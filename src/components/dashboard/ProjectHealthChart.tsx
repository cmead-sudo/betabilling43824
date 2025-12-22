import { AlertTriangle } from "lucide-react";

interface ProjectHealthChartProps {
  budgetConsumed: number; // percentage
  dataVerified: number; // percentage
  projectName?: string;
}

export const ProjectHealthChart = ({
  budgetConsumed,
  dataVerified,
  projectName,
}: ProjectHealthChartProps) => {
  const isHighRisk = budgetConsumed > dataVerified;
  const efficiency = dataVerified > 0 ? Math.round((dataVerified / budgetConsumed) * 100) : 0;

  // Calculate donut chart values
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const budgetOffset = circumference - (budgetConsumed / 100) * circumference;
  const dataOffset = circumference - (dataVerified / 100) * circumference;

  return (
    <div className="p-5 rounded-2xl bg-muted/30 border border-border/50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-foreground">Project Health</h4>
          {projectName && (
            <p className="text-sm text-muted-foreground">{projectName}</p>
          )}
        </div>
        {isHighRisk && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">High Efficiency Risk</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            {/* Budget Consumed (Red) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--destructive))"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={budgetOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            {/* Data Verified (Green) - offset to start after budget */}
            <circle
              cx="50"
              cy="50"
              r={radius - 10}
              fill="none"
              stroke="hsl(var(--status-active))"
              strokeWidth="6"
              strokeDasharray={circumference * 0.78}
              strokeDashoffset={(circumference * 0.78) - (dataVerified / 100) * (circumference * 0.78)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-foreground">{efficiency}%</span>
            <span className="text-xs text-muted-foreground">Efficiency</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Budget Consumed</span>
                <span className="text-sm font-semibold text-foreground">{budgetConsumed}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-destructive rounded-full transition-all duration-1000"
                  style={{ width: `${budgetConsumed}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-status-active" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data Verified</span>
                <span className="text-sm font-semibold text-foreground">{dataVerified}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-status-active rounded-full transition-all duration-1000"
                  style={{ width: `${dataVerified}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};