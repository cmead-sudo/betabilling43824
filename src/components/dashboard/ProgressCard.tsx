interface ProgressCardProps {
  title: string;
  subtitle: string;
  progress: number;
  phases: { name: string; progress: number }[];
}

export const ProgressCard = ({ title, subtitle, progress, phases }: ProgressCardProps) => {
  return (
    <div className="soft-card p-6 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-gradient">{progress}%</span>
          <p className="text-xs text-muted-foreground">Complete</p>
        </div>
      </div>
      
      {/* Wave/Bar Chart Visualization */}
      <div className="flex items-end gap-2 h-32 mb-6">
        {[65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 40, 95].map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-lg gradient-bar transition-all duration-500 hover:opacity-80"
            style={{ 
              height: `${height}%`,
              animationDelay: `${i * 0.05}s`,
              opacity: 0.6 + (i % 3) * 0.15
            }}
          ></div>
        ))}
      </div>
      
      {/* Phase Progress */}
      <div className="space-y-3">
        {phases.map((phase, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground font-medium">{phase.name}</span>
              <span className="text-muted-foreground">{phase.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-bar rounded-full transition-all duration-700"
                style={{ width: `${phase.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
