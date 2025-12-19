import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface ApprovalItem {
  id: string;
  title: string;
  subtitle: string;
  type: "document" | "hours";
  hoursValue?: string;
  amount: string;
  status: "pending" | "urgent";
}

interface ActionStreamCardProps {
  items: ApprovalItem[];
  pendingCount: number;
  onApprove?: (id: string) => void;
}

export const ActionStreamCard = ({ items, pendingCount, onApprove }: ActionStreamCardProps) => {
  return (
    <div className="soft-card p-6 h-full">
      {/* Header with notification badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Approvals Required</h3>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Approval Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id}
            className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.type === "document" 
                    ? "bg-primary/10" 
                    : "bg-accent/10"
                }`}>
                  {item.type === "document" ? (
                    <FileText className="w-6 h-6 text-primary" />
                  ) : (
                    <Clock className="w-6 h-6 text-accent" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.subtitle}</p>
                  {item.type === "hours" && item.hoursValue && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{item.hoursValue}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => onApprove?.(item.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-status-active text-white font-semibold text-sm hover:bg-status-active/90 transition-colors flex-shrink-0 shadow-[0_4px_12px_hsl(var(--status-active)/0.3)]"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Release {item.amount}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mb-3 opacity-50" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm">No pending approvals</p>
        </div>
      )}
    </div>
  );
};
