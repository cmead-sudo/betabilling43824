import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: "incoming" | "outgoing";
  date: string;
}

interface TransactionsCardProps {
  transactions: Transaction[];
}

export const TransactionsCard = ({ transactions }: TransactionsCardProps) => {
  return (
    <div className="dark-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Recent Transactions</h3>
        <button className="text-sm text-dark-card-foreground/70 hover:text-dark-card-foreground transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div 
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tx.type === "incoming" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {tx.type === "incoming" ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{tx.description}</p>
                <p className="text-xs text-dark-card-foreground/50">{tx.date}</p>
              </div>
            </div>
            <p className={`font-bold text-sm ${
              tx.type === "incoming" ? "text-green-400" : "text-red-400"
            }`}>
              {tx.type === "incoming" ? "+" : "-"}{tx.amount}
            </p>
          </div>
        ))}
      </div>
      
      <button className="gradient-button w-full mt-4 justify-center">
        Fund New Contract
      </button>
    </div>
  );
};
