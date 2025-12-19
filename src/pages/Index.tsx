import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MainDashboardContent } from "@/components/dashboard/MainDashboardContent";
import { ProjectsView } from "@/components/dashboard/ProjectsView";
import { TalentView } from "@/components/dashboard/TalentView";
import { WalletView } from "@/components/dashboard/WalletView";

const Index = () => {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [walletBalance, setWalletBalance] = useState(145000);

  const handleBalanceChange = (newBalance: number) => {
    setWalletBalance(newBalance);
  };

  const renderContent = () => {
    switch (activeNav) {
      case "Projects":
        return <ProjectsView />;
      case "Talent":
        return <TalentView />;
      case "Wallet":
        return <WalletView balance={walletBalance} />;
      default:
        return <MainDashboardContent walletBalance={walletBalance} onBalanceChange={handleBalanceChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeNav={activeNav} onNavChange={setActiveNav} />
      {renderContent()}
    </div>
  );
};

export default Index;
