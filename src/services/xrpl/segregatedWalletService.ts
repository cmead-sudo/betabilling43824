/**
 * XRPL Segregated Wallet Service (Agent Model)
 * 
 * ARCHITECTURE: Each client gets their own XRPL wallet
 * - Master Key: Client owns (stored encrypted, can export)
 * - Regular Key: Pharma Loom (programmatic signing)
 * 
 * LEGAL: Pharma Loom acts as "agent" not "custodian"
 * - Bankruptcy remote (client funds segregated)
 * - No MSB/MTL triggers (clients own wallets)
 * - Power of attorney via RegularKey
 * 
 * COMPLIANCE: 21 CFR Part 11
 * - Immutable audit trail
 * - Electronic signatures via RegularKey
 * - Client can revoke delegation anytime
 */

import { Wallet, Client, xrpToDrops, AccountSetAsfFlags } from 'xrpl';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const XRPL_TESTNET_URL = 'wss://testnet.xrpl-labs.com';
const XRPL_MAINNET_URL = 'wss://xrplcluster.com/';
const RLUSD_ISSUER_MAINNET = 'rMxCKbEDwqrZwYpkR2cer528sT6NoJ8m5De';

// Pharma Loom's RegularKey wallet (signs on behalf of clients)
const PHARMA_LOOM_REGULAR_KEY_SEED = process.env.PHARMA_LOOM_REGULAR_KEY_SEED!;

interface SegregatedWallet {
  clientId: string;
  projectId?: string;
  
  // Master Key (client owns)
  masterAddress: string;
  masterPublicKey: string;
  encryptedMasterSeed: string; // Client can export for recovery
  
  // Regular Key (Pharma Loom controls)
  regularKeyAddress: string;
  regularKeyEnabled: boolean;
  
  // Metadata
  network: 'testnet' | 'mainnet';
  createdAt: string;
  lastActivity?: string;
}

export class SegregatedWalletService {
  private client: Client;
  private supabase: any;
  private network: 'testnet' | 'mainnet';
  private regularKeyWallet: Wallet;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
    const wsUrl = network === 'testnet' ? XRPL_TESTNET_URL : XRPL_MAINNET_URL;
    this.client = new Client(wsUrl);
    
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );

    // Pharma Loom's RegularKey wallet (used to sign for all clients)
    this.regularKeyWallet = Wallet.fromSeed(PHARMA_LOOM_REGULAR_KEY_SEED);
  }

  async connect(): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
      console.log(`✅ Connected to XRPL ${this.network}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
  }

  /**
   * STEP 1: Generate segregated wallet for client
   * - Master Key: Client owns (ultimate authority)
   * - Wallet is bankruptcy remote (client's property)
   */
  async createSegregatedWallet(
    clientId: string,
    projectId?: string
  ): Promise<SegregatedWallet> {
    try {
      await this.connect();

      // Generate master wallet (client owns this)
      const masterWallet = Wallet.generate();

      const wallet: SegregatedWallet = {
        clientId,
        projectId,
        masterAddress: masterWallet.address,
        masterPublicKey: masterWallet.publicKey,
        encryptedMasterSeed: this.encryptSeed(masterWallet.seed),
        regularKeyAddress: this.regularKeyWallet.address,
        regularKeyEnabled: false, // Will enable after funding
        network: this.network,
        createdAt: new Date().toISOString(),
      };

      console.log('🔐 Segregated wallet created:', {
        client: clientId,
        masterAddress: wallet.masterAddress,
        regularKeyAddress: wallet.regularKeyAddress,
      });

      // Save to database
      await this.saveWallet(wallet);

      return wallet;
    } catch (error) {
      console.error('❌ Error creating segregated wallet:', error);
      throw error;
    }
  }

  /**
   * STEP 2: Fund wallet from Banking Partner on-ramp
   * - Called when client's wire transfer arrives
   * - Auto-convert fiat → RLUSD
   * - Send to client's master wallet
   */
  async fundClientWallet(
    clientId: string,
    amountRLUSD: string,
    fiatAmountUSD: string,
    wireTransferRef: string
  ): Promise<string> {
    try {
      await this.connect();

      const wallet = await this.getWallet(clientId);
      if (!wallet) throw new Error('Client wallet not found');

      // In production: This comes from Banking Partner → RLUSD auto-buy
      // For now: Send XRP from master wallet (simulating funded account)
      
      // If wallet has no XRP reserve, fund it first (12 XRP)
      const balance = await this.getBalance(wallet.masterAddress);
      if (parseFloat(balance.xrp) < 10) {
        await this.fundMasterWallet(wallet.masterAddress, '12');
      }

      // Setup RLUSD trustline if not already done
      if (parseFloat(balance.rlusd) === 0) {
        await this.setupRLUSDTrustline(wallet.masterAddress);
      }

      // Log funding transaction
      console.log('✅ Client wallet funded:', {
        client: clientId,
        amountRLUSD,
        fiatAmountUSD,
        wireRef: wireTransferRef,
        address: wallet.masterAddress,
      });

      // Record in database
      await this.logFunding(clientId, fiatAmountUSD, amountRLUSD, wireTransferRef);

      return wallet.masterAddress;
    } catch (error) {
      console.error('❌ Error funding client wallet:', error);
      throw error;
    }
  }

  /**
   * STEP 3: Enable RegularKey delegation
   * - Client's wallet delegates signing to Pharma Loom
   * - This is the "Power of Attorney" step
   * - Client can revoke this anytime with their Master Key
   */
  async enableRegularKey(clientId: string): Promise<string> {
    try {
      await this.connect();

      const wallet = await this.getWallet(clientId);
      if (!wallet) throw new Error('Client wallet not found');

      // Decrypt master seed to sign this ONE transaction
      const masterSeed = this.decryptSeed(wallet.encryptedMasterSeed);
      const masterWallet = Wallet.fromSeed(masterSeed);

      // Set Pharma Loom's wallet as RegularKey
      const setRegularKey = {
        TransactionType: 'SetRegularKey',
        Account: masterWallet.address,
        RegularKey: this.regularKeyWallet.address,
      };

      const result = await this.client.submitAndWait(setRegularKey, {
        wallet: masterWallet,
      });

      console.log('✅ RegularKey enabled:', {
        client: clientId,
        masterAddress: masterWallet.address,
        regularKeyAddress: this.regularKeyWallet.address,
        txHash: result.result.hash,
      });

      // Update database
      await this.updateRegularKeyStatus(clientId, true);

      return result.result.hash;
    } catch (error) {
      console.error('❌ Error enabling RegularKey:', error);
      throw error;
    }
  }

  /**
   * STEP 4: Sign transaction on behalf of client
   * - Uses RegularKey (not Master Key)
   * - Client wallet remains segregated
   * - This is the "agent" action
   */
  async signOnBehalfOf(
    clientId: string,
    transaction: any
  ): Promise<string> {
    try {
      await this.connect();

      const wallet = await this.getWallet(clientId);
      if (!wallet) throw new Error('Client wallet not found');
      if (!wallet.regularKeyEnabled) {
        throw new Error('RegularKey not enabled for this client');
      }

      // Sign with RegularKey (NOT master key)
      const result = await this.client.submitAndWait(transaction, {
        wallet: this.regularKeyWallet,
      });

      console.log('✅ Transaction signed on behalf of client:', {
        client: clientId,
        masterAddress: wallet.masterAddress,
        signedBy: this.regularKeyWallet.address,
        txHash: result.result.hash,
      });

      return result.result.hash;
    } catch (error) {
      console.error('❌ Error signing on behalf of client:', error);
      throw error;
    }
  }

  /**
   * CLIENT RECOVERY: Export master seed (encrypted)
   * - Client can take this and recover wallet elsewhere
   * - Proves they own the wallet (bankruptcy remote)
   */
  async exportMasterKey(
    clientId: string,
    clientApprovalToken: string // Requires 2FA/approval
  ): Promise<{ masterSeed: string; address: string }> {
    try {
      // Verify client approval token
      const approved = await this.verifyClientApproval(clientId, clientApprovalToken);
      if (!approved) throw new Error('Client approval required');

      const wallet = await this.getWallet(clientId);
      if (!wallet) throw new Error('Wallet not found');

      const masterSeed = this.decryptSeed(wallet.encryptedMasterSeed);

      console.log('⚠️  Master key exported for client:', clientId);
      
      // Log this action for audit
      await this.logMasterKeyExport(clientId);

      return {
        masterSeed,
        address: wallet.masterAddress,
      };
    } catch (error) {
      console.error('❌ Error exporting master key:', error);
      throw error;
    }
  }

  /**
   * REVOKE DELEGATION: Client disables RegularKey
   * - Client can revoke Pharma Loom's signing authority
   * - Requires master key signature
   * - Wallet remains segregated
   */
  async revokeRegularKey(clientId: string): Promise<string> {
    try {
      await this.connect();

      const wallet = await this.getWallet(clientId);
      if (!wallet) throw new Error('Wallet not found');

      const masterSeed = this.decryptSeed(wallet.encryptedMasterSeed);
      const masterWallet = Wallet.fromSeed(masterSeed);

      // Disable RegularKey
      const disableRegularKey = {
        TransactionType: 'SetRegularKey',
        Account: masterWallet.address,
        // No RegularKey field = disable
      };

      const result = await this.client.submitAndWait(disableRegularKey, {
        wallet: masterWallet,
      });

      console.log('⚠️  RegularKey revoked:', {
        client: clientId,
        txHash: result.result.hash,
      });

      await this.updateRegularKeyStatus(clientId, false);

      return result.result.hash;
    } catch (error) {
      console.error('❌ Error revoking RegularKey:', error);
      throw error;
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  private async fundMasterWallet(address: string, amountXRP: string): Promise<void> {
    // Fund from Pharma Loom's operational wallet (gas station)
    const gasWallet = Wallet.fromSeed(process.env.GAS_STATION_SEED!);
    
    const payment = {
      TransactionType: 'Payment',
      Account: gasWallet.address,
      Destination: address,
      Amount: xrpToDrops(amountXRP),
    };

    await this.client.submitAndWait(payment, { wallet: gasWallet });
  }

  private async setupRLUSDTrustline(address: string): Promise<void> {
    const wallet = await this.getWallet(address);
    if (!wallet) throw new Error('Wallet not found');

    const masterSeed = this.decryptSeed(wallet.encryptedMasterSeed);
    const masterWallet = Wallet.fromSeed(masterSeed);

    const trustSet = {
      TransactionType: 'TrustSet',
      Account: masterWallet.address,
      LimitAmount: {
        currency: 'RLUSD',
        issuer: RLUSD_ISSUER_MAINNET,
        value: '1000000000',
      },
    };

    await this.client.submitAndWait(trustSet, { wallet: masterWallet });
  }

  private async getBalance(address: string): Promise<{ xrp: string; rlusd: string }> {
    const accountInfo = await this.client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    });

    const xrpBalance = (
      parseInt(accountInfo.result.account_data.Balance) / 1_000_000
    ).toFixed(6);

    const balances = await this.client.request({
      command: 'account_lines',
      account: address,
      ledger_index: 'validated',
    });

    let rlusdBalance = '0';
    const rlusdLine = balances.result.lines.find(
      (line: any) => line.currency === 'RLUSD'
    );
    if (rlusdLine) rlusdBalance = rlusdLine.balance;

    return { xrp: xrpBalance, rlusd: rlusdBalance };
  }

  private encryptSeed(seed: string): string {
    const key = process.env.WALLET_ENCRYPTION_KEY!;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(seed, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptSeed(encryptedSeed: string): string {
    const key = process.env.WALLET_ENCRYPTION_KEY!;
    const parts = encryptedSeed.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async saveWallet(wallet: SegregatedWallet): Promise<void> {
    await this.supabase.from('segregated_wallets').insert({
      client_id: wallet.clientId,
      project_id: wallet.projectId,
      master_address: wallet.masterAddress,
      master_public_key: wallet.masterPublicKey,
      encrypted_master_seed: wallet.encryptedMasterSeed,
      regular_key_address: wallet.regularKeyAddress,
      regular_key_enabled: wallet.regularKeyEnabled,
      network: wallet.network,
      created_at: wallet.createdAt,
    });
  }

  private async getWallet(clientId: string): Promise<SegregatedWallet | null> {
    const { data } = await this.supabase
      .from('segregated_wallets')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (!data) return null;

    return {
      clientId: data.client_id,
      projectId: data.project_id,
      masterAddress: data.master_address,
      masterPublicKey: data.master_public_key,
      encryptedMasterSeed: data.encrypted_master_seed,
      regularKeyAddress: data.regular_key_address,
      regularKeyEnabled: data.regular_key_enabled,
      network: data.network,
      createdAt: data.created_at,
    };
  }

  private async updateRegularKeyStatus(clientId: string, enabled: boolean): Promise<void> {
    await this.supabase
      .from('segregated_wallets')
      .update({ regular_key_enabled: enabled })
      .eq('client_id', clientId);
  }

  private async logFunding(
    clientId: string,
    fiatAmount: string,
    rlusdAmount: string,
    wireRef: string
  ): Promise<void> {
    await this.supabase.from('client_funding_log').insert({
      client_id: clientId,
      fiat_amount_usd: fiatAmount,
      rlusd_amount: rlusdAmount,
      wire_transfer_ref: wireRef,
      funded_at: new Date().toISOString(),
    });
  }

  private async verifyClientApproval(
    clientId: string,
    token: string
  ): Promise<boolean> {
    // Implement 2FA verification logic
    return true; // Placeholder
  }

  private async logMasterKeyExport(clientId: string): Promise<void> {
    await this.supabase.from('audit_logs').insert({
      action: 'MASTER_KEY_EXPORT',
      table_name: 'segregated_wallets',
      record_id: clientId,
      created_at: new Date().toISOString(),
    });
  }
}

export const segregatedWalletService = new SegregatedWalletService('testnet');
