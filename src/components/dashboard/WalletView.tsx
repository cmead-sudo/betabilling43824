import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Copy, ExternalLink, CreditCard, Shield, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Transaction } from "@/pages/Index";

interface WalletViewProps {
  balance?: number;
  transactions?: Transaction[];
  onBalanceChange?: (newBalance: number) => void;
  onAddTransaction?: (transaction: { description: string; amount: number; type: "incoming" | "outgoing" }) => void;
}

export const WalletView = ({ 
  balance = 145000, 
  transactions = [],
  onBalanceChange,
  onAddTransaction,
}: WalletViewProps) => {
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const availableBalance = balance > 125000 ? balance - 125000 : Math.max(0, balance);
  const escrowedBalance = Math.min(balance, 125000);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0x74a3B7c8E9f2D1A5B6C4E8F3A2D9B7C6E5F4A3B2");
    toast.success("Wallet address copied to clipboard");
  };

  const handleFundWallet = () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const newBalance = balance + amount;
    onBalanceChange?.(newBalance);
    onAddTransaction?.({
      description: "Deposit from External Account",
      amount: amount,
      type: "incoming",
    });

    toast.success("Wallet Funded!", {
      description: `$${amount.toLocaleString()} added to your wallet`,
    });
    setFundAmount("");
    setIsFundModalOpen(false);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > availableBalance) {
      toast.error("Insufficient available balance", {
        description: `Maximum withdrawable: $${availableBalance.toLocaleString()}`,
      });
      return;
    }

    const newBalance = balance - amount;
    onBalanceChange?.(newBalance);
    onAddTransaction?.({
      description: "Withdrawal to External Account",
      amount: amount,
      type: "outgoing",
    });

    toast.success("Withdrawal Initiated!", {
      description: `$${amount.toLocaleString()} sent to your external account`,
    });
    setWithdrawAmount("");
    setIsWithdrawModalOpen(false);
  };

  const handleViewTransaction = (tx: Transaction) => {
    toast.info(`Transaction: ${tx.description}`, {
      description: `Amount: ${tx.type === "incoming" ? "+" : "-"}$${tx.amount.toLocaleString()} • ${tx.date}`,
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Corporate Wallet</h1>
        <p className="text-muted-foreground mt-1">Manage funds and view transaction history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left - Credit Card Visual */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card */}
          <div className="relative h-56 rounded-3xl p-6 overflow-hidden" style={{
            background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(328, 85%, 70%) 100%)"
          }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative h-full flex flex-col justify-between text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80">BioTrust Inc.</p>
                  <p className="text-xs opacity-60 mt-1">Corporate Account</p>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-xs font-medium">SECURED</span>
                </div>
              </div>

              <div>
                <p className="text-sm opacity-80 mb-1">Total Balance</p>
                <p className="text-3xl font-bold tracking-tight">
                  ${balance.toLocaleString()}.00 <span className="text-lg opacity-80">USDC</span>
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 opacity-80" />
                  <span className="font-mono text-sm tracking-wider">0x74a3B...2F39</span>
                </div>
                <button 
                  onClick={handleCopyAddress}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Copy wallet address"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="soft-card p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-muted-foreground">Available</span>
              </div>
              <p className="text-xl font-bold text-foreground">${availableBalance.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 mt-1">Ready to deploy</p>
            </div>
            <div className="soft-card p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm text-muted-foreground">Escrowed</span>
              </div>
              <p className="text-xl font-bold text-foreground">${escrowedBalance.toLocaleString()}</p>
              <p className="text-xs text-amber-600 mt-1">In active contracts</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              className="btn-gradient flex-1 gap-2"
              onClick={() => setIsFundModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Fund Wallet
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => setIsWithdrawModalOpen(true)}
            >
              <Send className="w-4 h-4" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Right - Transaction History */}
        <div className="lg:col-span-3">
          <div className="soft-card p-6 bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground">Transaction History</h2>
              <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View All <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                transactions.slice(0, 8).map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => handleViewTransaction(tx)}
                    className="flex items-center justify-between p-4 rounded-xl bg-background/50 hover:bg-background transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === "incoming" 
                          ? "bg-emerald-100 text-emerald-600" 
                          : "bg-rose-100 text-rose-600"
                      }`}>
                        {tx.type === "incoming" ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        tx.type === "incoming" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {tx.type === "incoming" ? "+" : "-"}${tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fund Wallet Modal */}
      <Dialog open={isFundModalOpen} onOpenChange={setIsFundModalOpen}>
        <DialogContent className="soft-card border-none max-w-md !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Fund Wallet
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Amount (USD)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount to deposit"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-xl font-bold text-foreground">${balance.toLocaleString()}.00</p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsFundModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFundWallet}
                className="btn-gradient flex-1"
              >
                Confirm Deposit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="soft-card border-none max-w-md !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Withdraw Funds
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Amount (USD)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="font-semibold text-foreground">${availableBalance.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground">Escrowed (locked)</p>
                <p className="font-semibold text-muted-foreground">${escrowedBalance.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                className="btn-gradient flex-1"
              >
                Confirm Withdrawal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};