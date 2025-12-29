# 🔗 XRPL UI Integration Instructions

## 📦 New Components Created

I've built 3 production-ready components to connect XRPL functionality to your Lovable app:

### **1. WalletStatusCard.tsx**
Displays project wallet status, balances, and XRPL explorer link.

**Location:** `src/components/xrpl/WalletStatusCard.tsx`

**Props:**
- `projectId` - Project identifier
- `walletAddress` - XRPL wallet address
- `xrpBalance` - XRP balance (for gas)
- `rlusdBalance` - RLUSD balance (milestone funds)
- `onRefresh` - Callback to refresh balance

**Features:**
- Shows wallet address with copy functionality
- Displays XRP and RLUSD balances
- "Segregated Agent Model" badge
- Link to XRPL testnet explorer
- Refresh button for balance updates

---

### **2. EscrowMilestoneCard.tsx**
Milestone card with escrow deployment and release functionality.

**Location:** `src/components/xrpl/EscrowMilestoneCard.tsx`

**Props:**
- `milestone` - Milestone object with escrow data
- `projectId` - Project identifier
- `onDeployEscrow` - Callback to deploy escrow contract
- `onReleaseEscrow` - Callback to release escrow funds
- `canRelease` - Boolean to enable release button

**Features:**
- Visual status badges (Pending, Escrowed, Completed)
- Deploy Escrow button (locks funds)
- Release Payment button (unlocks funds)
- Transaction hash links to XRPL explorer
- Loading states during blockchain operations

---

### **3. useProjectWallet.ts**
React hook for wallet data fetching and management.

**Location:** `src/hooks/useProjectWallet.ts`

**Returns:**
- `wallet` - Wallet data object
- `isLoading` - Loading state
- `error` - Error message
- `createWallet()` - Function to generate new wallet
- `refreshBalance()` - Function to refresh balances
- `refetch()` - Function to reload wallet data

**Features:**
- Auto-fetches wallet on mount
- Integrates with Supabase segregated_wallets table
- Calls Edge Functions for wallet operations
- Error handling and toast notifications

---

## 🔧 HOW TO INTEGRATE

### **Step 1: Copy Files to Lovable Project**

```bash
# Copy components
cp WalletStatusCard.tsx /path/to/lovable_repo/src/components/xrpl/
cp EscrowMilestoneCard.tsx /path/to/lovable_repo/src/components/xrpl/
cp useProjectWallet.ts /path/to/lovable_repo/src/hooks/
```

---

### **Step 2: Update ProjectsView.tsx**

Add these imports at the top:

```typescript
import { WalletStatusCard } from "@/components/xrpl/WalletStatusCard";
import { EscrowMilestoneCard } from "@/components/xrpl/EscrowMilestoneCard";
import { useProjectWallet } from "@/hooks/useProjectWallet";
```

---

### **Step 3: Add Wallet Hook to ProjectsView**

Inside the `ProjectsView` component, add:

```typescript
// For each project, you'll need to fetch wallet data
// This example shows how to do it for the selected project
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
const { wallet, isLoading: walletLoading, refreshBalance } = useProjectWallet(
  selectedProjectId || ""
);
```

---

### **Step 4: Add WalletStatusCard to Project Card**

In your project card JSX, add:

```tsx
{selectedProject && (
  <div className="space-y-4">
    {/* Existing project details */}
    
    {/* XRPL Wallet Status */}
    <WalletStatusCard
      projectId={selectedProject.id}
      walletAddress={wallet?.address}
      xrpBalance={wallet?.xrpBalance || 0}
      rlusdBalance={wallet?.rlusdBalance || 0}
      isLoading={walletLoading}
      onRefresh={refreshBalance}
    />
    
    {/* Existing content */}
  </div>
)}
```

---

### **Step 5: Replace Milestone Cards with EscrowMilestoneCard**

Replace your existing milestone rendering with:

```tsx
{project.milestones?.map((milestone) => (
  <EscrowMilestoneCard
    key={milestone.id}
    milestone={milestone}
    projectId={project.id}
    onDeployEscrow={handleDeployEscrow}
    onReleaseEscrow={handleReleaseEscrow}
    canRelease={milestone.status === "in-progress"}
  />
))}
```

---

### **Step 6: Implement Escrow Handlers**

Add these handler functions to ProjectsView:

```typescript
const handleDeployEscrow = async (milestoneId: string, amount: number) => {
  try {
    // Call Supabase Edge Function to deploy escrow
    const { data, error } = await supabase.functions.invoke(
      "xrpl-deploy-escrow",
      {
        body: {
          projectId: selectedProjectId,
          milestoneId,
          amount,
        },
      }
    );

    if (error) throw error;
    
    // Return transaction hash
    return data.txHash;
  } catch (error) {
    throw new Error("Failed to deploy escrow: " + (error as Error).message);
  }
};

const handleReleaseEscrow = async (milestoneId: string) => {
  try {
    // Call Supabase Edge Function to release escrow
    const { data, error } = await supabase.functions.invoke(
      "xrpl-release-escrow",
      {
        body: {
          projectId: selectedProjectId,
          milestoneId,
        },
      }
    );

    if (error) throw error;
    
    // Return transaction hash
    return data.txHash;
  } catch (error) {
    throw new Error("Failed to release escrow: " + (error as Error).message);
  }
};
```

---

## 🚀 SUPABASE EDGE FUNCTIONS NEEDED

You'll need to create 4 Edge Functions to handle XRPL operations:

### **1. xrpl-generate-wallet**
Generates a new segregated wallet for a project.

**Input:** `{ projectId: string }`  
**Output:** `{ walletId: string, address: string }`

---

### **2. xrpl-refresh-balance**
Refreshes XRP and RLUSD balances for a wallet.

**Input:** `{ walletId: string }`  
**Output:** `{ xrpBalance: number, rlusdBalance: number }`

---

### **3. xrpl-deploy-escrow**
Deploys an escrow contract for a milestone.

**Input:** `{ projectId: string, milestoneId: string, amount: number }`  
**Output:** `{ txHash: string, escrowId: string }`

---

### **4. xrpl-release-escrow**
Releases funds from an escrow contract.

**Input:** `{ projectId: string, milestoneId: string }`  
**Output:** `{ txHash: string }`

---

## 📝 DATABASE SCHEMA

Make sure you've run the migration: `002_segregated_model.sql`

This creates:
- `segregated_wallets` table
- `escrow_contracts` table
- `xrpl_transactions` table

---

## 🎨 VISUAL FLOW

**Before Funding:**
```
┌─────────────────────────────┐
│  Project Card               │
│  ┌─────────────────────┐   │
│  │ No Wallet Yet       │   │
│  │ (Dashed border)     │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

**After Funding:**
```
┌─────────────────────────────┐
│  Project Card               │
│  ┌─────────────────────┐   │
│  │ XRPL Wallet         │   │
│  │ rN3x...  🔗         │   │
│  │ 12 XRP | $100k      │   │
│  │ [Segregated Model]  │   │
│  └─────────────────────┘   │
│                             │
│  Milestone: Protocol Draft  │
│  ┌─────────────────────┐   │
│  │ $25k  [Escrowed]    │   │
│  │ TX: C7E1...  🔗     │   │
│  │ [Release Payment]   │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

---

## 🧪 TESTING CHECKLIST

- [ ] Copy all 3 files to Lovable project
- [ ] Update ProjectsView imports
- [ ] Add useProjectWallet hook
- [ ] Render WalletStatusCard
- [ ] Render EscrowMilestoneCard
- [ ] Implement escrow handlers
- [ ] Create Edge Functions
- [ ] Run Supabase migration
- [ ] Test wallet generation
- [ ] Test escrow deployment
- [ ] Test escrow release
- [ ] Verify XRPL explorer links work

---

## 🎯 EXPECTED BEHAVIOR

1. **User funds project** → Wallet auto-generated
2. **User clicks "Deploy Escrow"** → Funds locked on XRPL
3. **Vendor delivers milestone** → User clicks "Release Payment"
4. **Funds released in 3-5 seconds** → Vendor receives payment
5. **All transactions** → Logged in Supabase + viewable on XRPL explorer

---

## 💬 NEXT STEPS

Once these components are integrated:

1. **Test on Testnet** – Deploy real escrows with test RLUSD
2. **Add to Jan 5 Demo** – Show live blockchain transactions
3. **Create Edge Functions** – Connect UI to XRPL services
4. **Security Hardening** – Encrypt seeds, add multi-sig

---

**Status:** ✅ UI Components Ready  
**Next:** Integrate with ProjectsView and create Edge Functions
