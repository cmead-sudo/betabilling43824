import { useState } from "react";
import { Plus, User, CheckCircle, Target, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  subtitle: string;
  budget?: string;
  consultant?: string;
  progress?: number;
  result?: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  projects: Project[];
}

interface ProjectsViewProps {
  onNavigateToTalent?: () => void;
}

export const ProjectsView = ({ onNavigateToTalent }: ProjectsViewProps) => {
  const [columns, setColumns] = useState<Column[]>([
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
  ]);

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSubtitle, setNewProjectSubtitle] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleAddProject = (columnId: string) => {
    if (columnId === "planning") {
      setIsNewProjectOpen(true);
    } else {
      toast.info("New projects start in Planning phase");
      setIsNewProjectOpen(true);
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      subtitle: newProjectSubtitle || "New Project",
      budget: newProjectBudget ? `$${newProjectBudget}k` : undefined,
    };

    setColumns(prev => prev.map(col => 
      col.id === "planning" 
        ? { ...col, projects: [...col.projects, newProject] }
        : col
    ));

    toast.success("Project created!", { description: `${newProjectName} added to Planning` });
    setNewProjectName("");
    setNewProjectSubtitle("");
    setNewProjectBudget("");
    setIsNewProjectOpen(false);
  };

  const handleMoveToActive = () => {
    if (!selectedProject) return;
    
    setColumns(prev => {
      const updated = prev.map(col => ({
        ...col,
        projects: col.projects.filter(p => p.id !== selectedProject.id)
      }));
      
      return updated.map(col => 
        col.id === "active"
          ? { ...col, projects: [...col.projects, { ...selectedProject, progress: 0, consultant: undefined }] }
          : col
      );
    });

    toast.success("Project moved to Active");
    setSelectedProject(null);
  };

  const handleAssignConsultant = () => {
    setSelectedProject(null);
    onNavigateToTalent?.();
    toast.info("Select a consultant from the Talent view");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Project Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage your clinical trial projects</p>
        </div>
        <Button className="btn-gradient gap-2" onClick={() => setIsNewProjectOpen(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  onClick={() => handleProjectClick(project)}
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
              <button 
                onClick={() => handleAddProject(column.id)}
                className="w-full p-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Project</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="soft-card border-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Create New Project
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Phase III Diabetes Trial"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Phase / Description</label>
              <input
                type="text"
                value={newProjectSubtitle}
                onChange={(e) => setNewProjectSubtitle(e.target.value)}
                placeholder="e.g., Site Selection"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Budget (in thousands)</label>
              <input
                type="number"
                value={newProjectBudget}
                onChange={(e) => setNewProjectBudget(e.target.value)}
                placeholder="e.g., 150"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsNewProjectOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                className="btn-gradient flex-1"
              >
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Details Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="soft-card border-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {selectedProject?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground">Phase</p>
                <p className="font-semibold text-foreground">{selectedProject.subtitle}</p>
              </div>
              
              {selectedProject.budget && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-semibold text-foreground">{selectedProject.budget}</p>
                </div>
              )}
              
              {selectedProject.consultant && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground">Assigned Consultant</p>
                  <p className="font-semibold text-foreground">{selectedProject.consultant}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                {!selectedProject.consultant && (
                  <Button
                    onClick={handleAssignConsultant}
                    className="btn-gradient flex-1"
                  >
                    Assign Consultant
                  </Button>
                )}
                {selectedProject.progress === undefined && (
                  <Button
                    onClick={handleMoveToActive}
                    variant="outline"
                    className="flex-1"
                  >
                    Move to Active
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};