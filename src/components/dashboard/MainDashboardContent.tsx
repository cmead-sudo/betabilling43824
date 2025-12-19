import { TreasuryCard } from "./TreasuryCard";
import { ActionStreamCard } from "./ActionStreamCard";
import { ProjectLedger } from "./ProjectLedger";
import { toast } from "sonner";

const mockApprovals = [
  {
    id: "1",
    title: "Protocol Draft v1 - Phase I Oncology",
    subtitle: "Clinical documentation awaiting sponsor review",
    type: "document" as const,
    amount: "$6,000",
    status: "pending" as const,
  },
  {
    id: "2",
    title: "Regulatory Advisory Hours",
    subtitle: "Consultant time tracking submission",
    type: "hours" as const,
    hoursValue: "5 hrs",
    amount: "$2,500",
    status: "urgent" as const,
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

export const MainDashboardContent = () => {
  const handleFundContract = () => {
    toast.success("Opening contract funding wizard...");
  };

  const handleApprove = (id: string) => {
    const item = mockApprovals.find(a => a.id === id);
    toast.success(`Approved: ${item?.title}`, {
      description: `Released ${item?.amount} to escrow`,
    });
  };

  const handleProjectClick = (id: string) => {
    const project = mockProjects.find(p => p.id === id);
    toast.info(`Opening ${project?.name}...`);
  };

  return (
    <div className="px-8 pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Row - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Stream - Spans 2 columns */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <ActionStreamCard 
              items={mockApprovals}
              pendingCount={2}
              onApprove={handleApprove}
            />
          </div>
          
          {/* Treasury Card - Right */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <TreasuryCard
              totalLiquidity="$145,000.00"
              available="$20,000"
              escrowed="$125,000"
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
    </div>
  );
};
