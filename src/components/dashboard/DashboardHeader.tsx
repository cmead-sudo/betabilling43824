import { Settings, Bell, User } from "lucide-react";

const navItems = ["Dashboard", "Projects", "Talent", "Wallet"];

interface DashboardHeaderProps {
  activeNav?: string;
  onNavChange?: (item: string) => void;
}

export const DashboardHeader = ({ activeNav = "Dashboard", onNavChange }: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-8 py-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-foreground" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-xl font-bold text-primary tracking-tight">PHARMA LOOM</span>
      </div>

      {/* Pill Navigation */}
      <nav className="pill-nav">
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => onNavChange?.(item)}
            className={`pill-nav-item ${activeNav === item ? "active" : ""}`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button className="w-11 h-11 rounded-full bg-card flex items-center justify-center shadow-soft hover:shadow-hover transition-all duration-300">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="w-11 h-11 rounded-full bg-card flex items-center justify-center shadow-soft hover:shadow-hover transition-all duration-300 relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card"></span>
        </button>
        <button className="w-11 h-11 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center shadow-soft hover:shadow-hover transition-all duration-300">
          <User className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </header>
  );
};
