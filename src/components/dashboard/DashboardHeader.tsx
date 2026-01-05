import { Settings, Bell, User, FileDown, FileSpreadsheet } from "lucide-react";
import pharmaloomLogo from "@/assets/pharmaloom-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = ["Dashboard", "Projects", "Talent", "Wallet"];

interface DashboardHeaderProps {
  activeNav?: string;
  onNavChange?: (item: string) => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
}

export const DashboardHeader = ({ 
  activeNav = "Dashboard", 
  onNavChange,
  onExportPDF,
  onExportCSV
}: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-8 py-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img src={pharmaloomLogo} alt="PharmaLoom" className="h-10 w-auto" />
        <div className="flex flex-col">
          <span className="text-xl font-bold text-primary tracking-tight">Fabric<sup className="text-xs">©</sup></span>
          <span className="text-[10px] text-muted-foreground -mt-1">by PharmaLoom™</span>
        </div>
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
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-11 h-11 rounded-full bg-card flex items-center justify-center shadow-soft hover:shadow-hover transition-all duration-300">
              <FileDown className="w-5 h-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
              <FileDown className="w-4 h-4 mr-2 text-red-500" />
              Export to PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
              Export to CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
