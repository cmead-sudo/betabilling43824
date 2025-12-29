/**
 * XRPL Segregated Escrow Service (Agent Model)
 * 
 * KEY DIFFERENCE from previous version:
 * - Escrows deployed FROM client's segregated wallet
 * - Signed by Pharma Loom's RegularKey (agent authority)
 * - Funds remain in client's wallet until released
 * - Bankruptcy remote (client owns escrow, not Pharma Loom)
 */

import { Client, Wallet, xrpToDrops } from 'xrpl';
import { segregatedWalletService } from './segregatedWalletService';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const XRPL_TESTNET_URL = 'wss://testnet.xrpl-labs.com';

interface SegregatedEscrow {
  clientId: string;
  milestoneId: string;
  
  // Escrow data
  escrowSequence: number;
  txHash: string;
  clientWalletAddress: string; // Client's segregated wallet
  vendorAddress: string;
  amount: string;
  currency: string;
  
  // Crypto-condition
  condition: string;
  encryptedFulfillment: string; // Store securely
  
  // Status
  status: 'locked' | 'released' | 'cancelled';
  releaseTxHash?: string;
  releasedAt?: string;
  
  createdAt: string;
}

export class SegregatedEscrowService {
  private client: Client;
  private supabase: any;

  constructor() {
    this.client = new Client(XRPL_TESTNET_URL);
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );
  }

  async connect(): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
  }

  /**
   * DEPLOY ESCROW from client's segregated wallet
   * - Signed by Pharma Loom's RegularKey (agent)
   * - Funds move from client wallet → escrow contract
   * - Client still owns the escrow (bankruptcy remote)
   */
  async deploySegregatedEscrow(
    clientId: string,
    vendorAddress: string,
    amountRLUSD: string,
    milestoneId: string,
    milestoneDescription: string
  ): Promise<SegregatedEscrow> {
    try {
      await this.connect();

      // Generate crypto-condition
      const { condition, fulfillment } = this.generateCondition();

      // Get client's wallet
      const wallet = await segregatedWalletService.getWallet(clientId);
      if (!wallet) throw new Error('Client wallet not found');
      if (!wallet.regularKeyEnabled) {
        throw new Error('Client has not delegated signing authority');
      }

      // Prepare escrow transaction FROM client's wallet
      const escrowCreate = {
        TransactionType: 'EscrowCreate',
        Account: wallet.masterAddress, // CLIENT's address (not ours)
        Destination: vendorAddress,
        Amount: xrpToDrops(amountRLUSD),
        Condition: condition,
        Memo: {
          MemoData: Buffer.from(
            `Pharma Loom|${clientId}|${milestoneId}|${milestoneDescription}`
          ).toString('hex'),
        },
      };

      // Sign with RegularKey (on behalf of client)
      const txHash = await segregatedWalletService.signOnBehalfOf(
        clientId,
        escrowCreate
      );

      // Parse escrow sequence from transaction
      const tx = await this.client.request({
        command: 'tx',
        transaction: txHash,
      });

      const escrowSequence = tx.result.meta && typeof tx.result.meta !== 'string'
        ? tx.result.meta.TransactionIndex
        : 0;

      const escrow: SegregatedEscrow = {
        clientId,
        milestoneId,
        escrowSequence,
        txHash,
        clientWalletAddress: wallet.masterAddress,
        vendorAddress,
        amount: amountRLUSD,
        currency: 'XRP', // Production: RLUSD via checks
        condition,
        encryptedFulfillment: this.encryptFulfillment(fulfillment),
        status: 'locked',
        createdAt: new Date().toISOString(),
      };

      console.log('✅ Segregated escrow deployed:', {
        client: clientId,
        milestone: milestoneId,
        clientWallet: wallet.masterAddress,
        vendor: vendorAddress,
        amount: amountRLUSD,
        txHash,
      });

      // Save to database
      await this.saveEscrow(escrow);

      return escrow;
    } catch (error) {
      console.error('❌ Error deploying segregated escrow:', error);
      throw error;
    }
  }

  /**
   * RELEASE ESCROW on milestone approval
   * - Signed by Pharma Loom's RegularKey (agent)
   * - Funds move from escrow → vendor wallet
   * - Settlement in 3-5 seconds
   */
  async releaseSegregatedEscrow(
    clientId: string,
    milestoneId: string
  ): Promise<string> {
    try {
      await this.connect();

      // Get escrow data
      const escrow = await this.getEscrow(milestoneId);
      if (!escrow) throw new Error('Escrow not found');
      if (escrow.status !== 'locked') {
        throw new Error(`Escrow already ${escrow.status}`);
      }

      // Decrypt fulfillment
      const fulfillment = this.decryptFulfillment(escrow.encryptedFulfillment);

      // Prepare escrow finish transaction
      const escrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: escrow.clientWalletAddress, // CLIENT owns the escrow
        Owner: escrow.clientWalletAddress,
        OfferSequence: escrow.escrowSequence,
        Fulfillment: fulfillment,
        Memo: {
          MemoData: Buffer.from(
            `Milestone Approved|${milestoneId}|${new Date().toISOString()}`
          ).toString('hex'),
        },
      };

      // Sign with RegularKey (on behalf of client)
      const releaseTxHash = await segregatedWalletService.signOnBehalfOf(
        clientId,
        escrowFinish
      );

      console.log('✅ Segregated escrow released:', {
        client: clientId,
        milestone: milestoneId,
        vendor: escrow.vendorAddress,
        amount: escrow.amount,
        releaseTxHash,
      });

      // Update database
      await this.updateEscrowStatus(milestoneId, 'released', releaseTxHash);

      return releaseTxHash;
    } catch (error) {
      console.error('❌ Error releasing segregated escrow:', error);
      throw error;
    }
  }

  /**
   * CANCEL ESCROW (optional, if expired)
   * - Funds return to client's wallet
   * - Only if CancelAfter time passed
   */
  async cancelSegregatedEscrow(
    clientId: string,
    milestoneId: string
  ): Promise<string> {
    try {
      await this.connect();

      const escrow = await this.getEscrow(milestoneId);
      if (!escrow) throw new Error('Escrow not found');

      const escrowCancel = {
        TransactionType: 'EscrowCancel',
        Account: escrow.clientWalletAddress,
        Owner: escrow.clientWalletAddress,
        OfferSequence: escrow.escrowSequence,
      };

      const cancelTxHash = await segregatedWalletService.signOnBehalfOf(
        clientId,
        escrowCancel
      );

      console.log('⚠️  Segregated escrow cancelled:', {
        client: clientId,
        milestone: milestoneId,
        cancelTxHash,
      });

      await this.updateEscrowStatus(milestoneId, 'cancelled', cancelTxHash);

      return cancelTxHash;
    } catch (error) {
      console.error('❌ Error cancelling segregated escrow:', error);
      throw error;
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  private generateCondition(): { condition: string; fulfillment: string } {
    const preimage = crypto.randomBytes(32);
    const condition = crypto.createHash('sha256').update(preimage).digest();
    const fulfillment = Buffer.concat([Buffer.from([0xa0, 0x20]), preimage]);

    return {
      condition: condition.toString('hex').toUpperCase(),
      fulfillment: fulfillment.toString('hex').toUpperCase(),
    };
  }

  private encryptFulfillment(fulfillment: string): string {
    const key = process.env.WALLET_ENCRYPTION_KEY!;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(fulfillment, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptFulfillment(encrypted: string): string {
    const key = process.env.WALLET_ENCRYPTION_KEY!;
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async saveEscrow(escrow: SegregatedEscrow): Promise<void> {
    await this.supabase.from('segregated_escrows').insert({
      client_id: escrow.clientId,
      milestone_id: escrow.milestoneId,
      escrow_sequence: escrow.escrowSequence,
      tx_hash: escrow.txHash,
      client_wallet_address: escrow.clientWalletAddress,
      vendor_address: escrow.vendorAddress,
      amount: escrow.amount,
      currency: escrow.currency,
      condition: escrow.condition,
      encrypted_fulfillment: escrow.encryptedFulfillment,
      status: escrow.status,
      created_at: escrow.createdAt,
    });
  }

  private async getEscrow(milestoneId: string): Promise<SegregatedEscrow | null> {
    const { data } = await this.supabase
      .from('segregated_escrows')
      .select('*')
      .eq('milestone_id', milestoneId)
      .single();

    if (!data) return null;

    return {
      clientId: data.client_id,
      milestoneId: data.milestone_id,
      escrowSequence: data.escrow_sequence,
      txHash: data.tx_hash,
      clientWalletAddress: data.client_wallet_address,
      vendorAddress: data.vendor_address,
      amount: data.amount,
      currency: data.currency,
      condition: data.condition,
      encryptedFulfillment: data.encrypted_fulfillment,
      status: data.status,
      releaseTxHash: data.release_tx_hash,
      releasedAt: data.released_at,
      createdAt: data.created_at,
    };
  }

  private async updateEscrowStatus(
    milestoneId: string,
    status: 'released' | 'cancelled',
    txHash: string
  ): Promise<void> {
    await this.supabase
      .from('segregated_escrows')
      .update({
        status,
        release_tx_hash: txHash,
        released_at: new Date().toISOString(),
      })
      .eq('milestone_id', milestoneId);
  }
}

export const segregatedEscrowService = new SegregatedEscrowService();
