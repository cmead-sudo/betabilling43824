import { useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MainDashboardContent } from "@/components/dashboard/MainDashboardContent";
import { ProjectsView } from "@/components/dashboard/ProjectsView";
import { TalentView } from "@/components/dashboard/TalentView";
import { WalletView } from "@/components/dashboard/WalletView";
import { exportToPDF, exportToCSV, Project, Consultant } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "incoming" | "outgoing";
  date: string;
  status: "completed" | "pending";
}

const initialTransactions: Transaction[] = [
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

// Sample data for exports
const sampleProjects: Project[] = [
  {
    id: "1",
    name: "PK Analysis",
    status: "In Progress",
    progress: 65,
    consultant: "Alice B.",
    budget: "$25,000",
    budgetAmount: 25000,
    milestones: [
      { id: "m1", name: "Protocol Review", amount: 5000, status: "Completed" },
      { id: "m2", name: "Data Analysis", amount: 10000, status: "In Progress" },
      { id: "m3", name: "Final Report", amount: 10000, status: "Pending" },
    ],
    budgetConsumed: 45,
    dataVerified: 65,
  },
  {
    id: "2",
    name: "FIH Oncology Protocol",
    status: "Review",
    progress: 85,
    consultant: "Dr. Marcus L.",
    budget: "$45,000",
    budgetAmount: 45000,
    milestones: [
      { id: "m4", name: "Initial Draft", amount: 15000, status: "Completed" },
      { id: "m5", name: "Regulatory Review", amount: 15000, status: "Completed" },
      { id: "m6", name: "Final Approval", amount: 15000, status: "In Progress" },
    ],
    budgetConsumed: 70,
    dataVerified: 85,
  },
  {
    id: "3",
    name: "Biomarker Strategy",
    status: "Planning",
    progress: 20,
    consultant: "Sarah K.",
    budget: "$30,000",
    budgetAmount: 30000,
    milestones: [
      { id: "m7", name: "Literature Review", amount: 10000, status: "In Progress" },
      { id: "m8", name: "Strategy Development", amount: 10000, status: "Pending" },
      { id: "m9", name: "Implementation Plan", amount: 10000, status: "Pending" },
    ],
    budgetConsumed: 15,
    dataVerified: 20,
  },
];

const sampleConsultants: Consultant[] = [
  { id: "1", name: "Alice B.", specialty: "Pharmacokinetics", rate: "$150/hr", reliability: 98, status: "Active" },
  { id: "2", name: "Dr. Marcus L.", specialty: "Oncology Protocols", rate: "$200/hr", reliability: 95, status: "Active" },
  { id: "3", name: "Sarah K.", specialty: "Biomarker Strategy", rate: "$175/hr", reliability: 92, status: "Active" },
  { id: "4", name: "James R.", specialty: "Clinical Operations", rate: "$160/hr", reliability: 88, status: "Available" },
  { id: "5", name: "Dr. Emily W.", specialty: "Regulatory Affairs", rate: "$190/hr", reliability: 96, status: "Active" },
];

const Index = () => {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [walletBalance, setWalletBalance] = useState(145000);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const { toast } = useToast();

  const handleBalanceChange = useCallback((newBalance: number) => {
    setWalletBalance(newBalance);
  }, []);

  const handleAddTransaction = useCallback((transaction: { description: string; amount: number; type: "incoming" | "outgoing" }) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      date: formattedDate,
      status: "completed",
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const handleExportPDF = useCallback(() => {
    try {
      exportToPDF(sampleProjects, transactions, sampleConsultants, walletBalance);
      
      // Log the export as a transaction
      handleAddTransaction({
        description: "PDF Export Generated",
        amount: 0,
        type: "outgoing"
      });
      
      toast({
        title: "PDF Export Complete",
        description: "Your data has been exported to PDF and the action has been logged.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF.",
        variant: "destructive",
      });
    }
  }, [transactions, walletBalance, toast, handleAddTransaction]);

  const handleExportCSV = useCallback(() => {
    try {
      exportToCSV(sampleProjects, transactions, sampleConsultants, walletBalance);
      
      // Log the export as a transaction
      handleAddTransaction({
        description: "CSV Export Generated",
        amount: 0,
        type: "outgoing"
      });
      
      toast({
        title: "CSV Export Complete",
        description: "Your data has been exported to CSV and the action has been logged.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating the CSV.",
        variant: "destructive",
      });
    }
  }, [transactions, walletBalance, toast, handleAddTransaction]);

  const renderContent = () => {
    switch (activeNav) {
      case "Projects":
        return (
          <ProjectsView 
            onNavigateToTalent={() => setActiveNav("Talent")}
            walletBalance={walletBalance}
            onBalanceChange={handleBalanceChange}
            onAddTransaction={handleAddTransaction}
          />
        );
      case "Talent":
        return <TalentView onHireConsultant={(name) => {
          handleAddTransaction({ description: `SOW initiated with ${name}`, amount: 0, type: "outgoing" });
        }} />;
      case "Wallet":
        return <WalletView balance={walletBalance} transactions={transactions} onBalanceChange={handleBalanceChange} onAddTransaction={handleAddTransaction} />;
      default:
        return (
          <MainDashboardContent 
            walletBalance={walletBalance} 
            onBalanceChange={handleBalanceChange}
            onAddTransaction={handleAddTransaction}
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader 
        activeNav={activeNav} 
        onNavChange={setActiveNav}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
      />
      {renderContent()}
    </main>
  );
};

export default Index;