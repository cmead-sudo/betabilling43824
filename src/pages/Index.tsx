import { useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MainDashboardContent } from "@/components/dashboard/MainDashboardContent";
import { ProjectsView } from "@/components/dashboard/ProjectsView";
import { TalentView } from "@/components/dashboard/TalentView";
import { WalletView } from "@/components/dashboard/WalletView";

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

const Index = () => {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [walletBalance, setWalletBalance] = useState(145000);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

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

  const renderContent = () => {
    switch (activeNav) {
      case "Projects":
        return <ProjectsView onNavigateToTalent={() => setActiveNav("Talent")} />;
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
      <DashboardHeader activeNav={activeNav} onNavChange={setActiveNav} />
      {renderContent()}
    </main>
  );
};

export default Index;