import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { PendingActionsCard } from "@/components/dashboard/PendingActionsCard";
import { LiveContractsCard } from "@/components/dashboard/LiveContractsCard";
import { TransactionsCard } from "@/components/dashboard/TransactionsCard";

const mockContracts = [
  { id: "1", name: "Alice B.", type: "Clinical Consultant", status: "active" as const, amount: "$6,000" },
  { id: "2", name: "DataStats Inc.", type: "Data Analysis", status: "active" as const, amount: "$12,500" },
  { id: "3", name: "Dr. Marcus Chen", type: "Medical Advisor", status: "paused" as const, amount: "$8,200" },
  { id: "4", name: "BioMetrics Ltd.", type: "Lab Services", status: "pending" as const, amount: "$4,800" },
];

const mockTransactions = [
  { id: "1", description: "Funded Escrow - Phase II", amount: "$15,000", type: "outgoing" as const, date: "Today, 2:30 PM" },
  { id: "2", description: "Paid Alice B.", amount: "$6,000", type: "outgoing" as const, date: "Yesterday" },
  { id: "3", description: "Client Payment Received", amount: "$45,000", type: "incoming" as const, date: "Dec 15, 2024" },
  { id: "4", description: "DataStats Invoice", amount: "$12,500", type: "outgoing" as const, date: "Dec 14, 2024" },
];

const mockPhases = [
  { name: "Phase I - Oncology", progress: 66 },
  { name: "Phase II - Cardiology", progress: 42 },
  { name: "Phase III - Neurology", progress: 28 },
];

const Index = () => {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeNav={activeNav} onNavChange={setActiveNav} />
      
      <main className="px-8 pb-8">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Profile Card - Top Left */}
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <ProfileCard
              name="Dr. Sarah Mitchell"
              role="Sponsor Lead"
              walletBalance="$145k USDC"
            />
          </div>
          
          {/* Progress Card - Center (spans 2 columns on large screens) */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <ProgressCard
              title="Active Protocol Progress"
              subtitle="Real-time clinical trial monitoring"
              progress={66}
              phases={mockPhases}
            />
          </div>
          
          {/* Live Contracts - Bottom Left */}
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <LiveContractsCard contracts={mockContracts} />
          </div>
          
          {/* Pending Actions - Center */}
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <PendingActionsCard 
              pendingCount={2} 
              onReviewClick={() => console.log("Review clicked")}
            />
          </div>
          
          {/* Transactions Card - Right (Dark) */}
          <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <TransactionsCard transactions={mockTransactions} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
