import { Client } from "https://esm.sh/xrpl@3.0.0";

const XRPL_NETWORK = Deno.env.get("XRPL_NETWORK") || "testnet";

const NETWORKS = {
  testnet: "wss://s.altnet.rippletest.net:51233",
  mainnet: "wss://xrplcluster.com",
};

let client: Client | null = null;

export async function getXRPLClient(): Promise<Client> {
  if (client && client.isConnected()) {
    return client;
  }

  const wsUrl = NETWORKS[XRPL_NETWORK as keyof typeof NETWORKS] || NETWORKS.testnet;
  
  client = new Client(wsUrl);
  await client.connect();
  
  console.log(`✅ Connected to XRPL ${XRPL_NETWORK}: ${wsUrl}`);
  
  return client;
}

export async function disconnectXRPL(): Promise<void> {
  if (client && client.isConnected()) {
    await client.disconnect();
    client = null;
    console.log("✅ Disconnected from XRPL");
  }
}
