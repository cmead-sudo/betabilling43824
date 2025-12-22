import { useState, useCallback } from "react";
import { TreasuryCard } from "./TreasuryCard";
import { ProjectLedger } from "./ProjectLedger";
import { toast } from "sonner";
import { FileText, Clock, AlertCircle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApprovalItem {
  id: string;
  title: string;
  subtitle: string;
  type: "document" | "hours";
  hoursValue?: string;
  amount: number;
  amountDisplay: string;
  status: "pending" | "urgent";
}

const initialApprovals: ApprovalItem[] = [
  {
    id: "1",
    title: "Protocol Draft v1 - Phase I Oncology",
    subtitle: "Clinical documentation awaiting sponsor review",
    type: "document",
    amount: 6000,
    amountDisplay: "$6,000",
    status: "pending",
  },
  {
    id: "2",
    title: "Regulatory Advisory Hours",
    subtitle: "Consultant time tracking submission",
    type: "hours",
    hoursValue: "5 hrs",
    amount: 2500,
    amountDisplay: "$2,500",
    status: "urgent",
  },
];

const mockProjects = [
  {
    id: "1",
    name: "FIH Oncology",
    consultant: "Alice B.",
    status: "active" as const,
    progress: 66,
    nextMilestone: "Final Draft",
  },
  {
    id: "2",
    name: "PK Analysis",
    consultant: "DataStats",
    status: "paused" as const,
    progress: 10,
    nextMilestone: "Awaiting Data",
  },
  {
    id: "3",
    name: "Cardiology Phase II",
    consultant: "Dr. Chen",
    status: "active" as const,
    progress: 42,
    nextMilestone: "Patient Enrollment",
  },
  {
    id: "4",
    name: "Biomarker Study",
    consultant: "BioMetrics Ltd.",
    status: "completed" as const,
    progress: 100,
    nextMilestone: "Report Submitted",
  },
];

interface MainDashboardContentProps {
  walletBalance: number;
  onBalanceChange: (newBalance: number) => void;
  onAddTransaction?: (transaction: { description: string; amount: number; type: "incoming" | "outgoing" }) => void;
}

export const MainDashboardContent = ({ 
  walletBalance, 
  onBalanceChange,
  onAddTransaction,
}: MainDashboardContentProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFundContract = useCallback(() => {
    toast.info("Connecting to Wallet...", {
      description: "Please approve the connection in your wallet",
      duration: 3000,
    });
  }, []);

  const handleReviewClick = useCallback((approval: ApprovalItem) => {
    setSelectedApproval(approval);
    setIsReviewOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!isProcessing) {
      setIsReviewOpen(false);
      setSelectedApproval(null);
    }
  }, [isProcessing]);

  const handleApproveRelease = useCallback(() => {
    if (!selectedApproval || isProcessing) return;
    
    setIsProcessing(true);
    
    // Update balance
    const newBalance = walletBalance - selectedApproval.amount;
    onBalanceChange(newBalance);
    
    // Add transaction record
    onAddTransaction?.({
      description: `Payment released - ${selectedApproval.title}`,
      amount: selectedApproval.amount,
      type: "outgoing",
    });
    
    // Remove from approvals list
    setApprovals(prev => prev.filter(a => a.id !== selectedApproval.id));
    
    // Show success toast
    toast.success("Payment Released!", {
      description: `${selectedApproval.amountDisplay} sent successfully`,
    });
    
    // Close modal
    setIsReviewOpen(false);
    setSelectedApproval(null);
    setIsProcessing(false);
  }, [selectedApproval, isProcessing, walletBalance, onBalanceChange, onAddTransaction]);

  const handleProjectClick = useCallback((id: string) => {
    const project = mockProjects.find(p => p.id === id);
    toast.info(`Opening ${project?.name} details...`);
  }, []);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}.00`;
  };

  const availableAmount = walletBalance > 125000 ? walletBalance - 125000 : Math.max(0, walletBalance);
  const escrowedAmount = Math.min(walletBalance, 125000);

  return (
    <div className="px-8 pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Row - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Stream - Spans 2 columns */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="soft-card p-6 h-full">
              {/* Header with notification badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Action Required</h3>
                  {approvals.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                      {approvals.length}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Approval Items */}
              <div className="space-y-4">
                {approvals.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-status-active mx-auto mb-3" />
                    <p className="font-semibold text-foreground">All caught up!</p>
                    <p className="text-sm text-muted-foreground mt-1">No pending approvals</p>
                  </div>
                ) : (
                  approvals.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
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
                        
                        <button
                          onClick={() => handleReviewClick(item)}
                          className="gradient-button flex-shrink-0"
                        >
                          Review Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Treasury Card - Right */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <TreasuryCard
              totalLiquidity={formatCurrency(walletBalance)}
              available={`$${availableAmount.toLocaleString()}`}
              escrowed={`$${escrowedAmount.toLocaleString()}`}
              onFundContract={handleFundContract}
            />
          </div>
        </div>
        
        {/* Bottom Row - Full Width Ledger */}
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <ProjectLedger 
            projects={mockProjects}
            onProjectClick={handleProjectClick}
          />
        </div>
      </div>

      {/* Review Modal - Fixed positioning */}
      <Dialog open={isReviewOpen} onOpenChange={handleCloseModal} modal>
        <DialogContent className="soft-card border-none max-w-lg !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Review Document
            </DialogTitle>
          </DialogHeader>
          
          {selectedApproval && (
            <div className="space-y-5">
              {/* Secured by XRPL Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">Secured by XRPL</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
                  <span className="text-xs font-mono opacity-80">a7f3c8e...9c2</span>
                </div>
              </div>

              {/* PDF Placeholder - smaller to fit viewport */}
              <div className="aspect-[16/10] rounded-2xl bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-foreground text-center px-4 text-sm">{selectedApproval.title}</p>
                <p className="text-xs text-muted-foreground mt-1">PDF Preview</p>
              </div>
              
              {/* Amount to Release */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount to Release</span>
                  <span className="text-2xl font-bold text-primary">{selectedApproval.amountDisplay}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 rounded-xl border border-border bg-background text-foreground font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveRelease}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-status-active text-white font-semibold hover:bg-status-active/90 transition-colors shadow-[0_4px_12px_hsl(var(--status-active)/0.3)] disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isProcessing ? "Processing..." : "Approve & Release"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};