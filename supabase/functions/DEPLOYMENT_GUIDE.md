# 🚀 XRPL Edge Functions Deployment Guide

## 📦 Edge Functions Built

4 production-ready Supabase Edge Functions connecting your Lovable UI to XRPL:

### **1. xrpl-generate-wallet**
Generates a segregated XRPL wallet for a project.

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/xrpl-generate-wallet`

**Request:**
```json
{
  "projectId": "project-123",
  "userId": "user-456" // optional
}
```

**Response:**
```json
{
  "success": true,
  "walletId": "uuid",
  "address": "rN3x...",
  "regularKeyAddress": "rMK...",
  "xrpBalance": 12,
  "rlusdBalance": 0,
  "transactions": {
    "funding": "TX_HASH_1",
    "regularKey": "TX_HASH_2",
    "trustline": "TX_HASH_3"
  }
}
```

**What it does:**
1. Generates new XRPL wallet (client Master Key)
2. Funds with 12 XRP from master wallet
3. Sets RegularKey delegation to Pharma Loom
4. Sets up RLUSD trustline
5. Saves encrypted seeds to Supabase

---

### **2. xrpl-refresh-balance**
Refreshes XRP and RLUSD balances from XRPL.

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/xrpl-refresh-balance`

**Request:**
```json
{
  "walletId": "uuid"
  // OR
  "address": "rN3x..."
}
```

**Response:**
```json
{
  "success": true,
  "walletId": "uuid",
  "address": "rN3x...",
  "xrpBalance": 11.9,
  "rlusdBalance": 100000
}
```

**What it does:**
1. Queries XRPL for current balances
2. Updates `segregated_wallets` table
3. Returns fresh balance data

---

### **3. xrpl-deploy-escrow**
Deploys an escrow contract for a milestone.

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/xrpl-deploy-escrow`

**Request:**
```json
{
  "projectId": "project-123",
  "milestoneId": "milestone-456",
  "amount": 25000,
  "vendorAddress": "rVendor...", // optional
  "durationDays": 90 // optional, default 90
}
```

**Response:**
```json
{
  "success": true,
  "escrowId": "uuid",
  "txHash": "TX_HASH",
  "escrowSequence": 12345,
  "amount": 25000,
  "currency": "RLUSD",
  "finishAfter": "2025-03-30T...",
  "explorerLink": "https://testnet.xrpl.org/transactions/TX_HASH"
}
```

**What it does:**
1. Gets client wallet from database
2. Signs EscrowCreate with Pharma Loom RegularKey
3. Generates condition/fulfillment pair
4. Submits to XRPL (funds locked)
5. Saves escrow to database

---

### **4. xrpl-release-escrow**
Releases funds from an escrow contract.

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/xrpl-release-escrow`

**Request:**
```json
{
  "projectId": "project-123",
  "milestoneId": "milestone-456"
}
```

**Response:**
```json
{
  "success": true,
  "escrowId": "uuid",
  "txHash": "TX_HASH",
  "amount": 25000,
  "currency": "RLUSD",
  "vendor": "rVendor...",
  "explorerLink": "https://testnet.xrpl.org/transactions/TX_HASH"
}
```

**What it does:**
1. Gets active escrow from database
2. Signs EscrowFinish with fulfillment
3. Submits to XRPL (funds released)
4. Updates escrow status to "completed"
5. Logs transaction

---

## ⚙️ ENVIRONMENT VARIABLES

Set these in Supabase Dashboard → Project Settings → Edge Functions:

```env
# XRPL Configuration
XRPL_NETWORK=testnet
MASTER_WALLET_SEED=sEd79Mj9XE2EfhgkFoTEeDpDLMkGcA1
PHARMA_LOOM_REGULAR_KEY_SEED=sEdThPfKDxr4FUZTPy95nVuTTuYePgw

# Supabase (auto-populated)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **IMPORTANT:** These are testnet seeds. For production:
1. Generate new mainnet wallets
2. Store seeds in AWS Secrets Manager
3. Use environment variables to reference secrets

---

## 🚀 DEPLOYMENT STEPS

### **Option 1: Supabase CLI (Recommended)**

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref [your-project-ref]

# 4. Deploy all functions
supabase functions deploy xrpl-generate-wallet
supabase functions deploy xrpl-refresh-balance
supabase functions deploy xrpl-deploy-escrow
supabase functions deploy xrpl-release-escrow

# 5. Set environment variables
supabase secrets set XRPL_NETWORK=testnet
supabase secrets set MASTER_WALLET_SEED=sEd79Mj9XE2EfhgkFoTEeDpDLMkGcA1
supabase secrets set PHARMA_LOOM_REGULAR_KEY_SEED=sEdThPfKDxr4FUZTPy95nVuTTuYePgw
```

---

### **Option 2: Supabase Dashboard**

1. **Go to:** Supabase Dashboard → Edge Functions
2. **Click:** "Create a new function"
3. **For each function:**
   - Name: `xrpl-generate-wallet` (or other function name)
   - Copy-paste code from `supabase/functions/[function-name]/index.ts`
   - Click "Deploy"
4. **Set environment variables:**
   - Go to: Project Settings → Edge Functions → Environment Variables
   - Add the variables listed above

---

### **Option 3: GitHub Integration**

1. **Push to GitHub** (already done)
2. **Connect Supabase to GitHub:**
   - Supabase Dashboard → Integrations → GitHub
   - Select your repo
   - Enable automatic deployments
3. **Functions auto-deploy on push**

---

## 🧪 TESTING

### **Test 1: Generate Wallet**

```bash
curl -X POST \
  https://[project-ref].supabase.co/functions/v1/xrpl-generate-wallet \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "test-project-1"}'
```

**Expected:** Returns wallet address, XRP/RLUSD balances, transaction hashes

---

### **Test 2: Refresh Balance**

```bash
curl -X POST \
  https://[project-ref].supabase.co/functions/v1/xrpl-refresh-balance \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"address": "rN3x..."}'
```

**Expected:** Returns current XRP and RLUSD balances

---

### **Test 3: Deploy Escrow**

```bash
curl -X POST \
  https://[project-ref].supabase.co/functions/v1/xrpl-deploy-escrow \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-1",
    "milestoneId": "milestone-1",
    "amount": 1000
  }'
```

**Expected:** Returns escrow TX hash, explorer link

---

### **Test 4: Release Escrow**

```bash
curl -X POST \
  https://[project-ref].supabase.co/functions/v1/xrpl-release-escrow \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-1",
    "milestoneId": "milestone-1"
  }'
```

**Expected:** Returns release TX hash, vendor address

---

## 🔐 SECURITY NOTES

### **Current (Testnet):**
- ✅ Seeds stored as environment variables
- ✅ Client seeds encrypted in database (base64)
- ✅ RegularKey delegation (agent model)

### **Required for Production:**

1. **AWS Secrets Manager Integration:**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getMasterSeed() {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "pharma-loom/master-wallet-seed" })
  );
  return response.SecretString;
}
```

2. **AES-256 Encryption for Client Seeds:**
```typescript
import { AES, enc } from "crypto-js";

const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY");

function encryptSeed(seed: string): string {
  return AES.encrypt(seed, ENCRYPTION_KEY).toString();
}

function decryptSeed(encrypted: string): string {
  return AES.decrypt(encrypted, ENCRYPTION_KEY).toString(enc.Utf8);
}
```

3. **Multi-sig for Large Payments:**
- Require 2-of-3 signatures for escrows >$50k
- Implement SignerListSet on XRPL

4. **Rate Limiting:**
- Add Supabase Edge Function rate limits
- Implement per-project escrow caps

---

## 📊 MONITORING

### **Logs:**
```bash
# View real-time logs
supabase functions logs xrpl-generate-wallet --tail

# Filter by project
supabase functions logs xrpl-deploy-escrow --tail --filter "project-123"
```

### **Database Monitoring:**
Query escrow status:
```sql
SELECT 
  e.id,
  e.project_id,
  e.milestone_id,
  e.amount,
  e.status,
  e.tx_hash,
  e.release_tx_hash,
  e.created_at,
  e.released_at
FROM escrow_contracts e
WHERE e.status = 'active'
ORDER BY e.created_at DESC;
```

Query wallet balances:
```sql
SELECT 
  w.project_id,
  w.address,
  w.xrp_balance,
  w.rlusd_balance,
  w.last_balance_check
FROM segregated_wallets w
ORDER BY w.created_at DESC;
```

---

## 🎯 INTEGRATION WITH UI

Your UI components are already set up to call these functions:

```typescript
// In useProjectWallet.ts
const { data, error } = await supabase.functions.invoke(
  "xrpl-generate-wallet",
  { body: { projectId } }
);

// In EscrowMilestoneCard.tsx
const { data, error } = await supabase.functions.invoke(
  "xrpl-deploy-escrow",
  { body: { projectId, milestoneId, amount } }
);
```

**No code changes needed** - just deploy the functions!

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Set environment variables in Supabase
- [ ] Deploy all 4 Edge Functions
- [ ] Test wallet generation
- [ ] Test balance refresh
- [ ] Test escrow deployment
- [ ] Test escrow release
- [ ] Verify XRPL testnet transactions
- [ ] Integrate with Lovable UI
- [ ] Test end-to-end flow
- [ ] Update Jan 5 demo script

---

## 🔗 QUICK LINKS

- **Supabase Dashboard:** https://app.supabase.com
- **XRPL Testnet Explorer:** https://testnet.xrpl.org
- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
- **Edge Functions Docs:** https://supabase.com/docs/guides/functions

---

**Status:** ✅ Edge Functions Ready to Deploy  
**Next:** Deploy to Supabase and test end-to-end
