/**
 * XRPL Client Wrapper for Browser
 * 
 * Simplified client-side service that calls Supabase Edge Functions
 * instead of directly managing XRPL connections in the browser
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface SegregatedWallet {
  address: string;
  network: 'testnet' | 'mainnet';
  regularKeyEnabled: boolean;
}

export interface EscrowDeployment {
  txHash: string;
  escrowSequence: number;
  amount: string;
  status: 'locked' | 'released' | 'cancelled';
}

/**
 * Client-side XRPL Service
 * All heavy lifting done by Supabase Edge Functions
 */
export class XRPLClientService {
  
  /**
   * Get or create segregated wallet for current user
   */
  async getOrCreateWallet(projectId?: string): Promise<SegregatedWallet | null> {
    try {
      // Check if wallet exists
      const { data: existing } = await supabase
        .from('segregated_wallets')
        .select('master_address, network, regular_key_enabled')
        .eq('project_id', projectId || null)
        .single();
      
      if (existing) {
        return {
          address: existing.master_address,
          network: existing.network,
          regularKeyEnabled: existing.regular_key_enabled,
        };
      }
      
      // Create new wallet via Edge Function
      const { data, error } = await supabase.functions.invoke('create-segregated-wallet', {
        body: { projectId }
      });
      
      if (error) throw error;
      
      return {
        address: data.address,
        network: data.network,
        regularKeyEnabled: false, // Will be enabled after funding
      };
    } catch (error) {
      console.error('Failed to get/create wallet:', error);
      return null;
    }
  }
  
  /**
   * Deploy escrow for milestone
   */
  async deployEscrow(
    milestoneId: string,
    vendorAddress: string,
    amount: string
  ): Promise<EscrowDeployment | null> {
    try {
      const { data, error } = await supabase.functions.invoke('deploy-escrow', {
        body: {
          milestoneId,
          vendorAddress,
          amount,
        }
      });
      
      if (error) throw error;
      
      return {
        txHash: data.txHash,
        escrowSequence: data.escrowSequence,
        amount: data.amount,
        status: 'locked',
      };
    } catch (error) {
      console.error('Failed to deploy escrow:', error);
      return null;
    }
  }
  
  /**
   * Release escrow on milestone approval
   */
  async releaseEscrow(milestoneId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('release-escrow', {
        body: { milestoneId }
      });
      
      if (error) throw error;
      
      return data.txHash;
    } catch (error) {
      console.error('Failed to release escrow:', error);
      return null;
    }
  }
  
  /**
   * Get wallet balance (cached from database)
   */
  async getBalance(address: string): Promise<{ xrp: string; rlusd: string } | null> {
    try {
      const { data } = await supabase
        .from('wallet_balances')
        .select('xrp_balance, rlusd_balance')
        .eq('wallet_address', address)
        .single();
      
      if (!data) return null;
      
      return {
        xrp: data.xrp_balance?.toString() || '0',
        rlusd: data.rlusd_balance?.toString() || '0',
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      return null;
    }
  }
  
  /**
   * Get escrow status for milestone
   */
  async getEscrowStatus(milestoneId: string): Promise<EscrowDeployment | null> {
    try {
      const { data } = await supabase
        .from('segregated_escrows')
        .select('tx_hash, escrow_sequence, amount, status, release_tx_hash')
        .eq('milestone_id', milestoneId)
        .single();
      
      if (!data) return null;
      
      return {
        txHash: data.tx_hash,
        escrowSequence: data.escrow_sequence,
        amount: data.amount?.toString() || '0',
        status: data.status as 'locked' | 'released' | 'cancelled',
      };
    } catch (error) {
      console.error('Failed to get escrow status:', error);
      return null;
    }
  }
  
  /**
   * Get transaction explorer URL
   */
  getExplorerUrl(txHash: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
    const baseUrl = network === 'testnet' 
      ? 'https://testnet.xrpl.org'
      : 'https://xrpl.org';
    
    return `${baseUrl}/transactions/${txHash}`;
  }
  
  /**
   * Get account explorer URL
   */
  getAccountUrl(address: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
    const baseUrl = network === 'testnet' 
      ? 'https://testnet.xrpl.org'
      : 'https://xrpl.org';
    
    return `${baseUrl}/accounts/${address}`;
  }
}

// Export singleton instance
export const xrplClient = new XRPLClientService();
