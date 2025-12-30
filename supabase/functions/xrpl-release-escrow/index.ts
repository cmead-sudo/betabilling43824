import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Wallet } from "https://esm.sh/xrpl@3.0.0";
import { getXRPLClient, disconnectXRPL } from "../_shared/xrpl-client.ts";
import { getSupabaseServiceClient } from "../_shared/supabase.ts";

const PHARMA_LOOM_REGULAR_KEY_SEED = Deno.env.get("PHARMA_LOOM_REGULAR_KEY_SEED");

interface ReleaseEscrowRequest {
  projectId: string;
  milestoneId: string;
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
    const { projectId, milestoneId }: ReleaseEscrowRequest = await req.json();

    if (!projectId || !milestoneId) {
      throw new Error("projectId and milestoneId are required");
    }

    if (!PHARMA_LOOM_REGULAR_KEY_SEED) {
      throw new Error("PHARMA_LOOM_REGULAR_KEY_SEED not configured");
    }

    console.log(
      `🔓 Releasing escrow for project ${projectId}, milestone ${milestoneId}`
    );

    const supabase = getSupabaseServiceClient();

    // Get escrow from database
    const { data: escrow, error: escrowError } = await supabase
      .from("escrow_contracts")
      .select("*")
      .eq("project_id", projectId)
      .eq("milestone_id", milestoneId)
      .eq("status", "active")
      .single();

    if (escrowError || !escrow) {
      throw new Error("Active escrow not found for this milestone");
    }

    console.log(`✅ Found escrow: ${escrow.id}`);

    // Connect to XRPL
    const client = await getXRPLClient();

    // Get Regular Key wallet (Pharma Loom signs on behalf of client)
    const regularKeyWallet = Wallet.fromSeed(PHARMA_LOOM_REGULAR_KEY_SEED);
    console.log(`✅ Regular Key wallet loaded: ${regularKeyWallet.address}`);

    // Release escrow with fulfillment
    console.log("📝 Submitting EscrowFinish transaction...");
    const releaseTx = await client.submitAndWait(
      {
        TransactionType: "EscrowFinish",
        Account: regularKeyWallet.address, // Pharma Loom signs
        Owner: escrow.escrow_address, // Client's wallet
        OfferSequence: escrow.escrow_sequence,
        Condition: escrow.condition,
        Fulfillment: escrow.fulfillment,
      },
      { wallet: regularKeyWallet }
    );

    if (releaseTx.result.meta && typeof releaseTx.result.meta === "object" && "TransactionResult" in releaseTx.result.meta) {
      if (releaseTx.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Escrow release failed: ${releaseTx.result.meta.TransactionResult}`);
      }
    }

    console.log(`✅ Escrow released: ${releaseTx.result.hash}`);

    // Update escrow status in database
    const { error: updateError } = await supabase
      .from("escrow_contracts")
      .update({
        status: "completed",
        release_tx_hash: releaseTx.result.hash,
        released_at: new Date().toISOString(),
      })
      .eq("id", escrow.id);

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log(`✅ Escrow status updated in database`);

    // Log transaction
    await supabase.from("xrpl_transactions").insert({
      wallet_id: escrow.wallet_id,
      tx_hash: releaseTx.result.hash,
      tx_type: "escrow_finish",
      amount: escrow.amount,
      currency: escrow.currency,
      destination: escrow.vendor_address,
      status: "success",
    });

    // Disconnect from XRPL
    await disconnectXRPL();

    return new Response(
      JSON.stringify({
        success: true,
        escrowId: escrow.id,
        txHash: releaseTx.result.hash,
        amount: parseFloat(escrow.amount),
        currency: escrow.currency,
        vendor: escrow.vendor_address,
        explorerLink: `https://testnet.xrpl.org/transactions/${releaseTx.result.hash}`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error releasing escrow:", error);

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
