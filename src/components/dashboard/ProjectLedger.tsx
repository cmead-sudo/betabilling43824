import { MoreHorizontal, ArrowUpRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  consultant: string;
  status: "active" | "paused" | "completed";
  progress: number;
  nextMilestone: string;
}

interface ProjectLedgerProps {
  projects: Project[];
  onProjectClick?: (id: string) => void;
}

export const ProjectLedger = ({ projects, onProjectClick }: ProjectLedgerProps) => {
  const getStatusStyles = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-status-active/10",
          text: "text-status-active",
          dot: "bg-status-active shadow-[0_0_8px_hsl(var(--status-active)/0.5)]"
        };
      case "paused":
        return {
          bg: "bg-status-paused/10",
          text: "text-status-paused",
          dot: "bg-status-paused shadow-[0_0_8px_hsl(var(--status-paused)/0.5)]"
        };
      case "completed":
        return {
          bg: "bg-primary/10",
          text: "text-primary",
          dot: "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
        };
    }
  };

  return (
    <div className="soft-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Active Project Ledger</h3>
          <p className="text-sm text-muted-foreground mt-1">Track all ongoing clinical operations</p>
        </div>
        <button className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Project Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Consultant</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground min-w-[200px]">Progress</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Next Milestone</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const statusStyles = getStatusStyles(project.status);
              return (
                <tr 
                  key={project.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onProjectClick?.(project.id)}
                >
                  <td className="py-4 px-4">
                    <span className="font-semibold text-foreground">{project.name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-muted-foreground">{project.consultant}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyles.bg} ${statusStyles.text}`}>
                      <span className={`w-2 h-2 rounded-full ${statusStyles.dot}`}></span>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full gradient-bar rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-foreground w-12 text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-muted-foreground">{project.nextMilestone}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors ml-auto">
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="font-medium">No active projects</p>
          <p className="text-sm">Create a new project to get started</p>
        </div>
      )}
    </div>
  );
};
