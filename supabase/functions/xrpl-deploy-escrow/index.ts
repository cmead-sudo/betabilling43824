import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Wallet, xrpToDrops } from "https://esm.sh/xrpl@3.0.0";
import { getXRPLClient, disconnectXRPL } from "../_shared/xrpl-client.ts";
import { getSupabaseServiceClient } from "../_shared/supabase.ts";

const PHARMA_LOOM_REGULAR_KEY_SEED = Deno.env.get("PHARMA_LOOM_REGULAR_KEY_SEED");

interface DeployEscrowRequest {
  projectId: string;
  milestoneId: string;
  amount: number; // RLUSD amount
  vendorAddress?: string; // Optional: vendor XRPL address
  durationDays?: number; // Optional: escrow duration (default 90 days)
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
    const {
      projectId,
      milestoneId,
      amount,
      vendorAddress,
      durationDays = 90,
    }: DeployEscrowRequest = await req.json();

    if (!projectId || !milestoneId || !amount) {
      throw new Error("projectId, milestoneId, and amount are required");
    }

    if (!PHARMA_LOOM_REGULAR_KEY_SEED) {
      throw new Error("PHARMA_LOOM_REGULAR_KEY_SEED not configured");
    }

    console.log(
      `🔨 Deploying escrow for project ${projectId}, milestone ${milestoneId}, amount $${amount}`
    );

    const supabase = getSupabaseServiceClient();

    // Get client wallet from database
    const { data: wallet, error: walletError } = await supabase
      .from("segregated_wallets")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (walletError || !wallet) {
      throw new Error("Project wallet not found");
    }

    console.log(`✅ Found wallet: ${wallet.address}`);

    // Connect to XRPL
    const client = await getXRPLClient();

    // Get Regular Key wallet (Pharma Loom signs on behalf of client)
    const regularKeyWallet = Wallet.fromSeed(PHARMA_LOOM_REGULAR_KEY_SEED);
    console.log(`✅ Regular Key wallet loaded: ${regularKeyWallet.address}`);

    // Calculate escrow finish time (90 days from now, or custom)
    const finishAfter = Math.floor(Date.now() / 1000) + durationDays * 24 * 60 * 60;

    // Generate condition/fulfillment for escrow
    // Using a simple preimage condition (in production, use proper crypto)
    const crypto = await import("https://deno.land/std@0.168.0/crypto/mod.ts");
    const preimage = crypto.crypto.getRandomValues(new Uint8Array(32));
    const preimageHex = Array.from(preimage)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    // Create SHA-256 hash of preimage (condition)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.crypto.subtle.digest(
      "SHA-256",
      encoder.encode(preimageHex)
    );
    const condition = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    console.log(`🔐 Condition generated: ${condition.slice(0, 16)}...`);

    // RLUSD issuer (testnet)
    const RLUSD_ISSUER = "rN6jbxx4H6SS4cLGwesFeUnQ3GLMt69B2K";

    // Default vendor address (if not provided, use a placeholder)
    const destination =
      vendorAddress || "rN7n7otQDd6FczFgLdlqtyMVrn3HMtthca"; // Testnet vendor

    // Deploy escrow (signed by Pharma Loom Regular Key on behalf of client)
    console.log("📝 Submitting EscrowCreate transaction...");
    const escrowTx = await client.submitAndWait(
      {
        TransactionType: "EscrowCreate",
        Account: wallet.address, // Client's wallet
        Destination: destination, // Vendor
        Amount: {
          currency: "RLUSD",
          issuer: RLUSD_ISSUER,
          value: amount.toString(),
        },
        FinishAfter: finishAfter,
        Condition: condition,
      },
      { wallet: regularKeyWallet } // Signed by Pharma Loom Regular Key
    );

    if (escrowTx.result.meta && typeof escrowTx.result.meta === "object" && "TransactionResult" in escrowTx.result.meta) {
      if (escrowTx.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Escrow deployment failed: ${escrowTx.result.meta.TransactionResult}`);
      }
    }

    console.log(`✅ Escrow deployed: ${escrowTx.result.hash}`);

    // Extract escrow sequence from transaction
    const escrowSequence = escrowTx.result.Sequence || 0;

    // Save escrow to database
    const { data: escrowData, error: dbError } = await supabase
      .from("escrow_contracts")
      .insert({
        project_id: projectId,
        milestone_id: milestoneId,
        wallet_id: wallet.id,
        escrow_address: wallet.address,
        vendor_address: destination,
        amount: amount.toString(),
        currency: "RLUSD",
        escrow_sequence: escrowSequence,
        condition: condition,
        fulfillment: preimageHex, // Store fulfillment for later release
        finish_after: new Date(finishAfter * 1000).toISOString(),
        tx_hash: escrowTx.result.hash,
        status: "active",
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log(`✅ Escrow saved to database: ${escrowData.id}`);

    // Disconnect from XRPL
    await disconnectXRPL();

    return new Response(
      JSON.stringify({
        success: true,
        escrowId: escrowData.id,
        txHash: escrowTx.result.hash,
        escrowSequence: escrowSequence,
        amount: amount,
        currency: "RLUSD",
        finishAfter: new Date(finishAfter * 1000).toISOString(),
        explorerLink: `https://testnet.xrpl.org/transactions/${escrowTx.result.hash}`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error deploying escrow:", error);

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
