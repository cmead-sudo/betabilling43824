import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Wallet } from "https://esm.sh/xrpl@3.0.0";
import { getXRPLClient, disconnectXRPL } from "../_shared/xrpl-client.ts";
import { getSupabaseServiceClient } from "../_shared/supabase.ts";

const MASTER_WALLET_SEED = Deno.env.get("MASTER_WALLET_SEED");
const PHARMA_LOOM_REGULAR_KEY_SEED = Deno.env.get("PHARMA_LOOM_REGULAR_KEY_SEED");

interface GenerateWalletRequest {
  projectId: string;
  userId?: string;
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
    const { projectId, userId }: GenerateWalletRequest = await req.json();

    if (!projectId) {
      throw new Error("projectId is required");
    }

    if (!MASTER_WALLET_SEED) {
      throw new Error("MASTER_WALLET_SEED not configured");
    }

    if (!PHARMA_LOOM_REGULAR_KEY_SEED) {
      throw new Error("PHARMA_LOOM_REGULAR_KEY_SEED not configured");
    }

    console.log(`🔨 Generating wallet for project: ${projectId}`);

    // Connect to XRPL
    const client = await getXRPLClient();

    // Generate new wallet for client (Master Key)
    const clientWallet = Wallet.generate();
    console.log(`✅ Client wallet generated: ${clientWallet.address}`);

    // Get master wallet for funding
    const masterWallet = Wallet.fromSeed(MASTER_WALLET_SEED);
    console.log(`✅ Master wallet loaded: ${masterWallet.address}`);

    // Get Pharma Loom Regular Key wallet
    const regularKeyWallet = Wallet.fromSeed(PHARMA_LOOM_REGULAR_KEY_SEED);
    console.log(`✅ Regular Key wallet loaded: ${regularKeyWallet.address}`);

    // Step 1: Fund client wallet with XRP (for gas)
    console.log("💰 Funding client wallet with 12 XRP...");
    const fundTx = await client.submitAndWait(
      {
        TransactionType: "Payment",
        Account: masterWallet.address,
        Destination: clientWallet.address,
        Amount: "12000000", // 12 XRP in drops
      },
      { wallet: masterWallet }
    );

    if (fundTx.result.meta && typeof fundTx.result.meta === "object" && "TransactionResult" in fundTx.result.meta) {
      if (fundTx.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Funding failed: ${fundTx.result.meta.TransactionResult}`);
      }
    }

    console.log(`✅ Funded client wallet: ${fundTx.result.hash}`);

    // Step 2: Set RegularKey delegation (Pharma Loom can sign on behalf)
    console.log("🔑 Setting RegularKey delegation...");
    const setRegularKeyTx = await client.submitAndWait(
      {
        TransactionType: "SetRegularKey",
        Account: clientWallet.address,
        RegularKey: regularKeyWallet.address,
      },
      { wallet: clientWallet }
    );

    if (setRegularKeyTx.result.meta && typeof setRegularKeyTx.result.meta === "object" && "TransactionResult" in setRegularKeyTx.result.meta) {
      if (setRegularKeyTx.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`RegularKey setup failed: ${setRegularKeyTx.result.meta.TransactionResult}`);
      }
    }

    console.log(`✅ RegularKey set: ${setRegularKeyTx.result.hash}`);

    // Step 3: Setup RLUSD trustline
    console.log("🔗 Setting up RLUSD trustline...");
    const RLUSD_ISSUER = "rN6jbxx4H6SS4cLGwesFeUnQ3GLMt69B2K"; // Testnet RLUSD issuer

    const trustlineTx = await client.submitAndWait(
      {
        TransactionType: "TrustSet",
        Account: clientWallet.address,
        LimitAmount: {
          currency: "RLUSD",
          issuer: RLUSD_ISSUER,
          value: "1000000000", // 1 billion RLUSD limit
        },
      },
      { wallet: clientWallet }
    );

    if (trustlineTx.result.meta && typeof trustlineTx.result.meta === "object" && "TransactionResult" in trustlineTx.result.meta) {
      if (trustlineTx.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Trustline setup failed: ${trustlineTx.result.meta.TransactionResult}`);
      }
    }

    console.log(`✅ RLUSD trustline set: ${trustlineTx.result.hash}`);

    // Step 4: Save to Supabase
    const supabase = getSupabaseServiceClient();

    // Encrypt seeds before storing (simple base64 for now - use proper encryption in production)
    const encryptedMasterSeed = btoa(clientWallet.seed!);
    const encryptedPrivateKey = btoa(clientWallet.privateKey);

    const { data: walletData, error: dbError } = await supabase
      .from("segregated_wallets")
      .insert({
        project_id: projectId,
        user_id: userId,
        address: clientWallet.address,
        encrypted_master_seed: encryptedMasterSeed,
        encrypted_private_key: encryptedPrivateKey,
        regular_key_address: regularKeyWallet.address,
        xrp_balance: "12",
        rlusd_balance: "0",
        funding_tx_hash: fundTx.result.hash,
        regular_key_tx_hash: setRegularKeyTx.result.hash,
        trustline_tx_hash: trustlineTx.result.hash,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log(`✅ Wallet saved to database: ${walletData.id}`);

    // Disconnect from XRPL
    await disconnectXRPL();

    return new Response(
      JSON.stringify({
        success: true,
        walletId: walletData.id,
        address: clientWallet.address,
        regularKeyAddress: regularKeyWallet.address,
        xrpBalance: 12,
        rlusdBalance: 0,
        transactions: {
          funding: fundTx.result.hash,
          regularKey: setRegularKeyTx.result.hash,
          trustline: trustlineTx.result.hash,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error generating wallet:", error);

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
