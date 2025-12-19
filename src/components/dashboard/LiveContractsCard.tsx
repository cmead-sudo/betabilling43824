import { MoreHorizontal } from "lucide-react";

interface Contract {
  id: string;
  name: string;
  type: string;
  status: "active" | "paused" | "pending";
  amount: string;
}

interface LiveContractsCardProps {
  contracts: Contract[];
}

export const LiveContractsCard = ({ contracts }: LiveContractsCardProps) => {
  return (
    <div className="soft-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">Live Contracts</h3>
        <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div 
            key={contract.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`status-dot ${contract.status}`}></div>
              <div>
                <p className="font-semibold text-foreground text-sm">{contract.name}</p>
                <p className="text-xs text-muted-foreground">{contract.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground text-sm">{contract.amount}</p>
              <p className="text-xs text-muted-foreground capitalize">{contract.status}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-3 rounded-2xl border-2 border-dashed border-border text-muted-foreground text-sm font-medium hover:border-primary hover:text-primary transition-colors">
        + Add New Contract
      </button>
    </div>
  );
};
