import { ArrowUpRight, ArrowDownLeft, Copy, ExternalLink, CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "incoming" | "outgoing";
  date: string;
  status: "completed" | "pending";
}

const transactions: Transaction[] = [
  {
    id: "1",
    description: "Deposit from JP Morgan Treasury",
    amount: 50000,
    type: "incoming",
    date: "Dec 18, 2024",
    status: "completed",
  },
  {
    id: "2",
    description: "Payment to Alice B. - Protocol Draft",
    amount: 6000,
    type: "outgoing",
    date: "Dec 17, 2024",
    status: "completed",
  },
  {
    id: "3",
    description: "Escrow Funded - FIH Oncology",
    amount: 15000,
    type: "outgoing",
    date: "Dec 15, 2024",
    status: "completed",
  },
  {
    id: "4",
    description: "Payment to DataStats Inc.",
    amount: 8500,
    type: "outgoing",
    date: "Dec 12, 2024",
    status: "completed",
  },
  {
    id: "5",
    description: "Deposit from Corporate Account",
    amount: 100000,
    type: "incoming",
    date: "Dec 10, 2024",
    status: "completed",
  },
];

interface WalletViewProps {
  balance?: number;
}

export const WalletView = ({ balance = 145000 }: WalletViewProps) => {
  const { toast } = useToast();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0x74a3B...2F39");
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Corporate Wallet</h1>
        <p className="text-muted-foreground mt-1">Manage funds and view transaction history</p>
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Left - Credit Card Visual */}
        <div className="col-span-2 space-y-6">
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
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-glass p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-muted-foreground">Available</span>
              </div>
              <p className="text-xl font-bold text-foreground">$20,000</p>
              <p className="text-xs text-emerald-600 mt-1">Ready to deploy</p>
            </div>
            <div className="card-glass p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm text-muted-foreground">Escrowed</span>
              </div>
              <p className="text-xl font-bold text-foreground">$125,000</p>
              <p className="text-xs text-amber-600 mt-1">In active contracts</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="btn-gradient flex-1">
              Fund Wallet
            </Button>
            <Button variant="outline" className="flex-1">
              Withdraw
            </Button>
          </div>
        </div>

        {/* Right - Transaction History */}
        <div className="col-span-3">
          <div className="card-glass p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground">Transaction History</h2>
              <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View All <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-background/50 hover:bg-background transition-colors"
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
