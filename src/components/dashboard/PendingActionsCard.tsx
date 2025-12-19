import { ArrowRight } from "lucide-react";

interface PendingActionsCardProps {
  pendingCount: number;
  onReviewClick?: () => void;
}

export const PendingActionsCard = ({ pendingCount, onReviewClick }: PendingActionsCardProps) => {
  return (
    <div className="soft-card p-6 h-full flex flex-col items-center justify-center text-center">
      <p className="text-sm text-muted-foreground font-medium mb-4">Pending Actions</p>
      
      {/* Circle Indicator */}
      <div className="circle-indicator w-32 h-32 mb-4">
        <div className="flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">{pendingCount}</span>
          <span className="text-xs text-muted-foreground mt-1">Approvals</span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Smart Contract Triggers Waiting
      </p>
      
      <button 
        onClick={onReviewClick}
        className="gradient-button flex items-center gap-2"
      >
        Review Now
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
