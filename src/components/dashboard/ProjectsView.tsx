import { Plus, Calendar, User, CheckCircle, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  subtitle: string;
  budget?: string;
  consultant?: string;
  progress?: number;
  result?: string;
}

const columns: { id: string; title: string; color: string; projects: Project[] }[] = [
  {
    id: "planning",
    title: "Planning",
    color: "bg-blue-500",
    projects: [
      {
        id: "1",
        name: "Phase II Cardiology",
        subtitle: "Site Selection",
        budget: "$200k",
      },
    ],
  },
  {
    id: "active",
    title: "Active",
    color: "bg-amber-500",
    projects: [
      {
        id: "2",
        name: "FIH Oncology",
        subtitle: "Protocol Writing",
        consultant: "Alice B.",
        progress: 66,
      },
    ],
  },
  {
    id: "completed",
    title: "Completed",
    color: "bg-emerald-500",
    projects: [
      {
        id: "3",
        name: "Biomarker Feasibility",
        subtitle: "Phase I Analysis",
        result: "Success",
      },
    ],
  },
];

export const ProjectsView = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Project Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage your clinical trial projects</p>
        </div>
        <Button className="btn-gradient gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h2 className="font-semibold text-foreground">{column.title}</h2>
              <span className="ml-auto px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                {column.projects.length}
              </span>
            </div>

            {/* Project Cards */}
            <div className="space-y-4">
              {column.projects.map((project) => (
                <div
                  key={project.id}
                  className="card-glass p-5 hover:shadow-hover transition-all duration-300 cursor-pointer group"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{project.subtitle}</p>

                  <div className="mt-4 space-y-3">
                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-accent" />
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-semibold text-foreground">{project.budget}</span>
                      </div>
                    )}

                    {project.consultant && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Consultant:</span>
                        <span className="font-medium text-foreground">{project.consultant}</span>
                      </div>
                    )}

                    {project.progress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full progress-bar-gradient rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {project.result && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600">{project.result}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Card Button */}
              <button className="w-full p-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Project</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
