import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MainDashboardContent } from "@/components/dashboard/MainDashboardContent";

const Index = () => {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeNav={activeNav} onNavChange={setActiveNav} />
      <MainDashboardContent />
    </div>
  );
};

export default Index;
