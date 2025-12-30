import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getXRPLClient, disconnectXRPL } from "../_shared/xrpl-client.ts";
import { getSupabaseServiceClient } from "../_shared/supabase.ts";

interface RefreshBalanceRequest {
  walletId?: string;
  address?: string;
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { walletId, address }: RefreshBalanceRequest = await req.json();

    if (!walletId && !address) {
      throw new Error("Either walletId or address is required");
    }

    console.log(`🔄 Refreshing balance for wallet: ${walletId || address}`);

    const supabase = getSupabaseServiceClient();

    // Get wallet from database
    let walletQuery = supabase.from("segregated_wallets").select("*");

    if (walletId) {
      walletQuery = walletQuery.eq("id", walletId);
    } else {
      walletQuery = walletQuery.eq("address", address);
    }

    const { data: wallet, error: walletError } = await walletQuery.single();

    if (walletError || !wallet) {
      throw new Error("Wallet not found");
    }

    // Connect to XRPL
    const client = await getXRPLClient();

    // Fetch account info
    const accountInfo = await client.request({
      command: "account_info",
      account: wallet.address,
      ledger_index: "validated",
    });

    // XRP balance (convert drops to XRP)
    const xrpBalanceDrops = accountInfo.result.account_data.Balance;
    const xrpBalance = (parseInt(xrpBalanceDrops) / 1000000).toFixed(6);

    console.log(`💰 XRP Balance: ${xrpBalance}`);

    // Fetch account lines (for RLUSD)
    const accountLines = await client.request({
      command: "account_lines",
      account: wallet.address,
      ledger_index: "validated",
    });

    // Find RLUSD balance
    const RLUSD_ISSUER = "rN6jbxx4H6SS4cLGwesFeUnQ3GLMt69B2K"; // Testnet RLUSD issuer
    const rlusdLine = accountLines.result.lines.find(
      (line: any) => line.currency === "RLUSD" && line.account === RLUSD_ISSUER
    );

    const rlusdBalance = rlusdLine ? parseFloat(rlusdLine.balance) : 0;

    console.log(`💵 RLUSD Balance: ${rlusdBalance}`);

    // Update database
    const { error: updateError } = await supabase
      .from("segregated_wallets")
      .update({
        xrp_balance: xrpBalance,
        rlusd_balance: rlusdBalance.toString(),
        last_balance_check: new Date().toISOString(),
      })
      .eq("id", wallet.id);

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log(`✅ Balance updated in database`);

    // Disconnect from XRPL
    await disconnectXRPL();

    return new Response(
      JSON.stringify({
        success: true,
        walletId: wallet.id,
        address: wallet.address,
        xrpBalance: parseFloat(xrpBalance),
        rlusdBalance: rlusdBalance,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error refreshing balance:", error);

    await disconnectXRPL();

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
