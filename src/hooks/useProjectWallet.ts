import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WalletData {
  id: string;
  address: string;
  xrpBalance: number;
  rlusdBalance: number;
  isLoading: boolean;
}

export const useProjectWallet = (projectId: string) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Query segregated_wallets table
      const { data, error: fetchError } = await supabase
        .from("segregated_wallets")
        .select("*")
        .eq("project_id", projectId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No wallet found - not an error, just no wallet yet
          setWallet(null);
        } else {
          throw fetchError;
        }
      } else if (data) {
        setWallet({
          id: data.id,
          address: data.address,
          xrpBalance: parseFloat(data.xrp_balance || "0"),
          rlusdBalance: parseFloat(data.rlusd_balance || "0"),
          isLoading: false,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching wallet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createWallet = async () => {
    try {
      setIsLoading(true);

      // Call Supabase Edge Function to generate wallet
      const { data, error: createError } = await supabase.functions.invoke(
        "xrpl-generate-wallet",
        {
          body: { projectId },
        }
      );

      if (createError) throw createError;

      toast.success("Wallet created successfully!");
      await fetchWallet(); // Refresh wallet data

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create wallet";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      if (!wallet) return;

      // Call Supabase Edge Function to refresh balance
      const { data, error: refreshError } = await supabase.functions.invoke(
        "xrpl-refresh-balance",
        {
          body: { walletId: wallet.id },
        }
      );

      if (refreshError) throw refreshError;

      await fetchWallet(); // Refresh wallet data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh balance";
      toast.error(errorMessage);
      throw err;
    }
  };

  // Fetch wallet on mount and when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchWallet();
    }
  }, [projectId]);

  return {
    wallet,
    isLoading,
    error,
    createWallet,
    refreshBalance,
    refetch: fetchWallet,
  };
};
