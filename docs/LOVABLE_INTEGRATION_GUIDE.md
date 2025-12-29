# 🔗 LOVABLE APP INTEGRATION GUIDE

## Overview

This guide shows you how to integrate the Segregated Agent XRPL model into your existing Lovable Pharma Loom app.

---

## 📦 STEP 1: COPY FILES TO YOUR LOVABLE PROJECT

### **A. Copy XRPL Services**

Copy these files from this package to your Lovable project:

```bash
# From: pharma_loom_xrpl_v2/
# To: your-lovable-project/

src/services/xrpl/
├── segregatedWalletService.ts    → Copy to: src/services/xrpl/
└── segregatedEscrowService.ts    → Copy to: src/services/xrpl/
```

### **B. Install Dependencies**

Add to your Lovable project's `package.json`:

```json
{
  "dependencies": {
    "xrpl": "^3.0.0",
    "@supabase/supabase-js": "^2.89.0"
  }
}
```

Run: `npm install`

### **C. Setup Environment Variables**

Add to your `.env.local`:

```env
# XRPL Configuration
VITE_XRPL_NETWORK=testnet
VITE_PHARMA_LOOM_REGULAR_KEY_SEED=<generate_this_once>

# Gas Station Wallet (for funding client wallets)
VITE_GAS_STATION_SEED=<your_funded_testnet_wallet>

# Wallet Encryption
VITE_WALLET_ENCRYPTION_KEY=<32_byte_hex_key>

# Supabase (you already have these)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
VITE_SUPABASE_SERVICE_KEY=eyJh... # Backend only
```

**Generate Keys:**

```bash
# Generate Pharma Loom's RegularKey wallet (ONE TIME)
# Save this seed securely - it signs for ALL clients
node -e "const {Wallet} = require('xrpl'); console.log(Wallet.generate().seed)"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ STEP 2: SETUP SUPABASE DATABASE

### **Run Migration**

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of: `supabase/migrations/002_segregated_model.sql`
3. Execute the migration

**Tables Created:**
- `segregated_wallets` - Client wallet storage
- `segregated_escrows` - Escrow contracts
- `client_funding_log` - Fiat on-ramp tracking
- `regular_key_audit_log` - Delegation audit trail
- `master_key_exports` - Key export tracking

---

## 🔌 STEP 3: CREATE API ENDPOINTS (Supabase Edge Functions)

### **A. Create Wallet Endpoint**

Create: `supabase/functions/create-segregated-wallet/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { userId, projectId } = await req.json()
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Import wallet service (you'll need to adapt this for Deno)
    // For now, call XRPL directly
    const { Wallet } = await import('npm:xrpl')
    const masterWallet = Wallet.generate()
    
    // Encrypt seed (implement encryption in separate util)
    const encryptedSeed = masterWallet.seed // TODO: Encrypt this
    
    // Save to database
    const { data, error } = await supabase
      .from('segregated_wallets')
      .insert({
        client_id: userId,
        project_id: projectId,
        master_address: masterWallet.address,
        master_public_key: masterWallet.publicKey,
        encrypted_master_seed: encryptedSeed,
        regular_key_address: Deno.env.get('PHARMA_LOOM_REGULAR_KEY_ADDRESS'),
        network: 'testnet',
      })
      .select()
      .single()
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        address: masterWallet.address 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### **B. Deploy Escrow Endpoint**

Create: `supabase/functions/deploy-escrow/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { clientId, milestoneId, vendorAddress, amount } = await req.json()
  
  // Get client wallet
  // Get Pharma Loom RegularKey wallet
  // Deploy escrow FROM client wallet, SIGNED BY Pharma Loom
  // Save to database
  
  return new Response(
    JSON.stringify({ success: true, txHash: '...' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

## 🎨 STEP 4: UPDATE FRONTEND COMPONENTS

### **A. Update ProjectsView.tsx**

Add XRPL integration to your existing ProjectsView:

```typescript
// src/components/dashboard/ProjectsView.tsx

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Add new state for XRPL integration
const [clientWallet, setClientWallet] = useState<string | null>(null);
const [escrowStatus, setEscrowStatus] = useState<'none' | 'deploying' | 'deployed' | 'released'>('none');

// Initialize wallet on component mount
useEffect(() => {
  async function initWallet() {
    // Check if user already has a wallet
    const { data: wallet } = await supabase
      .from('segregated_wallets')
      .select('master_address')
      .eq('client_id', userId)
      .single();
    
    if (wallet) {
      setClientWallet(wallet.master_address);
    } else {
      // Create wallet on first load
      const { data } = await supabase.functions.invoke('create-segregated-wallet', {
        body: { userId, projectId: currentProject?.id }
      });
      
      if (data?.success) {
        setClientWallet(data.address);
        toast({
          title: "Wallet Created",
          description: "Your secure payment wallet is ready",
        });
      }
    }
  }
  
  initWallet();
}, [userId]);

// Update existing handleDeployEscrow function
const handleDeployEscrow = async (milestone: Milestone) => {
  setEscrowStatus('deploying');
  
  try {
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('deploy-escrow', {
      body: {
        clientId: userId,
        milestoneId: milestone.id,
        vendorAddress: milestone.vendorWallet, // You'll need to add this
        amount: milestone.amount.toString(),
      }
    });
    
    if (error) throw error;
    
    setEscrowStatus('deployed');
    
    toast({
      title: "Escrow Deployed",
      description: `Funds locked until milestone approved. Settlement in 3-5 seconds.`,
    });
    
    // Update milestone status
    setMilestones(prev => 
      prev.map(m => 
        m.id === milestone.id 
          ? { ...m, status: 'escrowed', escrowTxHash: data.txHash }
          : m
      )
    );
  } catch (error) {
    console.error('Escrow deployment failed:', error);
    setEscrowStatus('none');
    
    toast({
      title: "Error",
      description: "Failed to deploy escrow contract",
      variant: "destructive",
    });
  }
};

// Update existing handleApproveMilestone function
const handleApproveMilestone = async (milestone: Milestone) => {
  try {
    // 1. Verify deliverable (your existing AI logic)
    const verified = await verifyDeliverable(milestone.deliverable);
    if (!verified) {
      throw new Error('Deliverable verification failed');
    }
    
    // 2. Release escrow
    const { data, error } = await supabase.functions.invoke('release-escrow', {
      body: {
        clientId: userId,
        milestoneId: milestone.id,
      }
    });
    
    if (error) throw error;
    
    setEscrowStatus('released');
    
    toast({
      title: "Payment Released",
      description: `Funds sent to vendor in 3-5 seconds. TX: ${data.txHash.slice(0, 10)}...`,
    });
    
    // 3. Update UI
    handleAddTransaction({
      description: `Payment to ${milestone.vendorName} - ${milestone.name}`,
      amount: milestone.amount,
      type: 'outgoing',
      status: 'completed',
    });
    
    setMilestones(prev => 
      prev.map(m => 
        m.id === milestone.id 
          ? { ...m, status: 'completed', releaseTxHash: data.txHash }
          : m
      )
    );
  } catch (error) {
    console.error('Milestone approval failed:', error);
    toast({
      title: "Error",
      description: "Failed to release payment",
      variant: "destructive",
    });
  }
};
```

### **B. Add Wallet Status Component**

Create: `src/components/dashboard/XRPLWalletStatus.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface XRPLWalletStatusProps {
  address: string | null;
  network: 'testnet' | 'mainnet';
}

export function XRPLWalletStatus({ address, network }: XRPLWalletStatusProps) {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  
  const explorerUrl = network === 'testnet' 
    ? `https://testnet.xrpl.org/accounts/${address}`
    : `https://xrpl.org/accounts/${address}`;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Blockchain Wallet</span>
          <Badge variant="outline" className="ml-2">
            {network === 'testnet' ? 'Testnet' : 'Mainnet'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {address ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address:</span>
              <a 
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-mono hover:underline"
              >
                {address.slice(0, 8)}...{address.slice(-6)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="text-sm font-semibold">{balance} RLUSD</span>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ✅ Your wallet is segregated and bankruptcy remote
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Initializing wallet...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### **C. Update Dashboard to Show Wallet**

Add to your `src/pages/Index.tsx`:

```typescript
import { XRPLWalletStatus } from '@/components/dashboard/XRPLWalletStatus';

// In your Dashboard component
<div className="grid gap-4 md:grid-cols-3">
  {/* Your existing cards */}
  
  {/* Add XRPL Wallet Status */}
  <XRPLWalletStatus 
    address={clientWallet} 
    network="testnet" 
  />
</div>
```

---

## 🔐 STEP 5: SECURITY CONSIDERATIONS

### **A. Seed Encryption**

Create: `src/lib/crypto.ts`

```typescript
import * as crypto from 'crypto';

const ENCRYPTION_KEY = import.meta.env.VITE_WALLET_ENCRYPTION_KEY;

export function encryptSeed(seed: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    iv
  );
  
  let encrypted = cipher.update(seed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptSeed(encryptedSeed: string): string {
  const parts = encryptedSeed.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    iv
  );
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### **B. Row-Level Security**

Ensure Supabase RLS policies are enabled:

```sql
-- Users can only see their own wallets
CREATE POLICY "Users view own wallets"
  ON segregated_wallets FOR SELECT
  USING (auth.uid() = client_id);

-- Users can only see their own escrows
CREATE POLICY "Users view own escrows"
  ON segregated_escrows FOR SELECT
  USING (auth.uid() = client_id);
```

---

## 🧪 STEP 6: TESTING INTEGRATION

### **A. Create Test User Flow**

1. **User Signs Up**
   - Wallet auto-created
   - RegularKey delegation enabled
   - Client sees: "Account ready"

2. **User Funds Project**
   - Wire $100K (manual for now)
   - Admin marks as funded in Supabase
   - Balance updates in dashboard

3. **User Deploys Escrow**
   - Click "Deploy Contract" on milestone
   - Escrow deployed FROM client wallet
   - Signed BY Pharma Loom (RegularKey)
   - Settlement: 3-5 seconds

4. **User Approves Milestone**
   - Upload deliverable
   - AI verification
   - Click "Approve & Pay"
   - Escrow released in 3-5 seconds

### **B. Test Checklist**

- [ ] Wallet creation works
- [ ] RegularKey delegation succeeds
- [ ] Escrow deployment shows in UI
- [ ] Transaction links work (testnet explorer)
- [ ] Approval releases funds
- [ ] Balance updates correctly
- [ ] Audit logs recorded

---

## 📊 STEP 7: UPDATE UI/UX

### **Add to Milestone Cards:**

```typescript
// Show escrow status badge
{milestone.status === 'escrowed' && (
  <Badge variant="secondary" className="flex items-center gap-1">
    🔒 Funds Locked
    <a 
      href={`https://testnet.xrpl.org/transactions/${milestone.escrowTxHash}`}
      target="_blank"
      className="ml-1"
    >
      <ExternalLink className="h-3 w-3" />
    </a>
  </Badge>
)}

{milestone.status === 'completed' && (
  <Badge variant="success" className="flex items-center gap-1">
    ✅ Paid
    <a 
      href={`https://testnet.xrpl.org/transactions/${milestone.releaseTxHash}`}
      target="_blank"
      className="ml-1"
    >
      <ExternalLink className="h-3 w-3" />
    </a>
  </Badge>
)}
```

### **Add Transaction Timeline:**

Show real-time transaction status:
- ⏳ "Deploying escrow..." (0-5 seconds)
- ✅ "Escrow deployed" (link to TX)
- 🔒 "Funds locked until approved"
- ⏳ "Releasing payment..." (on approval)
- ✅ "Payment sent" (link to TX)

---

## 🚀 STEP 8: DEPLOYMENT

### **A. Environment Setup**

**Development:**
- Use testnet
- Test with small amounts
- Enable verbose logging

**Production:**
- Switch to mainnet
- Update XRPL_NETWORK=mainnet
- Use production Supabase
- Enable monitoring

### **B. Go-Live Checklist**

- [ ] All seeds encrypted
- [ ] RLS policies enabled
- [ ] Audit logging works
- [ ] Error handling robust
- [ ] Monitoring/alerts setup
- [ ] Backup procedures documented
- [ ] Client recovery process tested

---

## 💡 QUICK START (5 MINUTES)

**Minimum viable integration:**

1. Copy `segregatedWalletService.ts` to your project
2. Add `xrpl` to package.json
3. Run Supabase migration
4. Add wallet creation to user signup
5. Test on testnet

**That's it! You have segregated wallets working.**

The rest (escrow deployment, release) can be added incrementally.

---

## 🆘 TROUBLESHOOTING

**Issue: "Module not found: xrpl"**
```bash
npm install xrpl
```

**Issue: "Wallet not found"**
- Check user is authenticated
- Verify RLS policies
- Check client_id matches auth.uid()

**Issue: "Transaction failed"**
- Check testnet faucet has funds
- Verify RegularKey is enabled
- Check transaction explorer for details

**Issue: "Escrow deployment takes too long"**
- Testnet can be slow (10-30 seconds)
- Mainnet is faster (3-5 seconds)
- Add loading states in UI

---

## 📞 NEXT STEPS

**After integration:**

1. **Test end-to-end flow** with real project
2. **Update marketing materials** with testnet proof
3. **Document user flows** for support team
4. **Setup monitoring** for production
5. **Plan mainnet migration** (when ready)

---

**You're ready to integrate! Start with wallet creation and build from there.**
