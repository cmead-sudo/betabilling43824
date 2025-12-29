/**
 * React Hook for XRPL Wallet Management
 * 
 * Usage in your components:
 * 
 * const { wallet, deployEscrow, releaseEscrow, loading } = useXRPLWallet(projectId);
 */

import { useState, useEffect } from 'react';
import { xrplClient, SegregatedWallet, EscrowDeployment } from '../services/xrpl/client';
import { useToast } from './use-toast';

export function useXRPLWallet(projectId?: string) {
  const [wallet, setWallet] = useState<SegregatedWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState({ xrp: '0', rlusd: '0' });
  const { toast } = useToast();
  
  // Initialize wallet on mount
  useEffect(() => {
    async function initWallet() {
      setLoading(true);
      try {
        const w = await xrplClient.getOrCreateWallet(projectId);
        if (w) {
          setWallet(w);
          
          // Fetch balance
          const bal = await xrplClient.getBalance(w.address);
          if (bal) {
            setBalance(bal);
          }
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
        toast({
          title: "Wallet Error",
          description: "Failed to initialize blockchain wallet",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    initWallet();
  }, [projectId]);
  
  /**
   * Deploy escrow for milestone
   */
  const deployEscrow = async (
    milestoneId: string,
    vendorAddress: string,
    amount: string
  ): Promise<EscrowDeployment | null> => {
    setLoading(true);
    
    try {
      const deployment = await xrplClient.deployEscrow(
        milestoneId,
        vendorAddress,
        amount
      );
      
      if (deployment) {
        toast({
          title: "Escrow Deployed",
          description: `Funds locked until milestone approved. Settlement: 3-5 seconds`,
        });
        
        return deployment;
      } else {
        throw new Error('Escrow deployment failed');
      }
    } catch (error) {
      console.error('Deploy escrow error:', error);
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy escrow contract",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Release escrow on milestone approval
   */
  const releaseEscrow = async (milestoneId: string): Promise<string | null> => {
    setLoading(true);
    
    try {
      const txHash = await xrplClient.releaseEscrow(milestoneId);
      
      if (txHash) {
        toast({
          title: "Payment Released",
          description: `Funds sent to vendor in 3-5 seconds`,
        });
        
        // Refresh balance
        if (wallet) {
          const bal = await xrplClient.getBalance(wallet.address);
          if (bal) {
            setBalance(bal);
          }
        }
        
        return txHash;
      } else {
        throw new Error('Escrow release failed');
      }
    } catch (error) {
      console.error('Release escrow error:', error);
      toast({
        title: "Release Failed",
        description: "Failed to release escrow funds",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get escrow status for milestone
   */
  const getEscrowStatus = async (milestoneId: string): Promise<EscrowDeployment | null> => {
    try {
      return await xrplClient.getEscrowStatus(milestoneId);
    } catch (error) {
      console.error('Get escrow status error:', error);
      return null;
    }
  };
  
  /**
   * Refresh wallet balance
   */
  const refreshBalance = async () => {
    if (!wallet) return;
    
    try {
      const bal = await xrplClient.getBalance(wallet.address);
      if (bal) {
        setBalance(bal);
      }
    } catch (error) {
      console.error('Refresh balance error:', error);
    }
  };
  
  /**
   * Get explorer URLs
   */
  const getExplorerUrl = (txHash: string) => {
    return xrplClient.getExplorerUrl(txHash, wallet?.network || 'testnet');
  };
  
  const getAccountUrl = () => {
    if (!wallet) return null;
    return xrplClient.getAccountUrl(wallet.address, wallet.network);
  };
  
  return {
    wallet,
    balance,
    loading,
    deployEscrow,
    releaseEscrow,
    getEscrowStatus,
    refreshBalance,
    getExplorerUrl,
    getAccountUrl,
  };
}
