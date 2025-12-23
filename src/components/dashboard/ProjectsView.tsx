import { useState, useRef } from "react";
import { Plus, User, CheckCircle, Target, X, Calendar, Upload, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectHealthChart } from "./ProjectHealthChart";
import { DataPassportCard } from "./DataPassportCard";

interface Milestone {
  id: string;
  name: string;
  amount: number;
  status: "pending" | "in-progress" | "completed";
  deliverable?: string;
}

interface Project {
  id: string;
  name: string;
  subtitle: string;
  budget?: string;
  budgetAmount?: number;
  consultant?: string;
  progress?: number;
  result?: string;
  milestones?: Milestone[];
  budgetConsumed?: number;
  dataVerified?: number;
}

interface Column {
  id: string;
  title: string;
  color: string;
  projects: Project[];
}

interface ProjectsViewProps {
  onNavigateToTalent?: () => void;
  walletBalance?: number;
  onBalanceChange?: (newBalance: number) => void;
  onAddTransaction?: (transaction: { description: string; amount: number; type: "incoming" | "outgoing" }) => void;
}

export const ProjectsView = ({ 
  onNavigateToTalent,
  walletBalance = 0,
  onBalanceChange,
  onAddTransaction,
}: ProjectsViewProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingMilestoneId, setVerifyingMilestoneId] = useState<string | null>(null);

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
          budgetAmount: 200000,
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
          budgetAmount: 150000,
          budgetConsumed: 66,
          dataVerified: 55,
          milestones: [
            { id: "m1", name: "Protocol Draft", amount: 25000, status: "completed" },
            { id: "m2", name: "Ethics Submission", amount: 35000, status: "completed" },
            { id: "m3", name: "Site Activation", amount: 40000, status: "in-progress" },
            { id: "m4", name: "Final Report", amount: 50000, status: "pending" },
          ],
        },
        {
          id: "4",
          name: "PK Analysis",
          subtitle: "Pharmacokinetics Study",
          consultant: "DataStats Inc.",
          progress: 35,
          budgetAmount: 80000,
          budgetConsumed: 45,
          dataVerified: 30,
          milestones: [
            { id: "m1", name: "Data Collection", amount: 20000, status: "completed" },
            { id: "m2", name: "Statistical Model", amount: 30000, status: "in-progress" },
            { id: "m3", name: "Final Analysis", amount: 30000, status: "pending" },
          ],
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
          budgetConsumed: 100,
          dataVerified: 100,
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

    const budgetNum = parseInt(newProjectBudget) * 1000 || 0;
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      subtitle: newProjectSubtitle || "New Project",
      budget: newProjectBudget ? `$${newProjectBudget}k` : undefined,
      budgetAmount: budgetNum,
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

  const handleUploadDeliverable = (milestoneId: string) => {
    setVerifyingMilestoneId(milestoneId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !verifyingMilestoneId || !selectedProject) return;

    // Start AI verification animation
    setIsVerifying(true);
    
    toast.info("Uploading deliverable...", { duration: 1000 });

    // 2-second "AI Verifying" animation
    setTimeout(() => {
      toast.loading("AI Verifying deliverable...", { 
        id: "ai-verify",
        description: "Analyzing document structure and data integrity",
      });
    }, 500);

    setTimeout(() => {
      toast.dismiss("ai-verify");
      
      // Find the milestone and its amount
      const milestone = selectedProject.milestones?.find(m => m.id === verifyingMilestoneId);
      const releaseAmount = milestone?.amount || 0;

      // Update milestone status to completed
      setColumns(prev => prev.map(col => ({
        ...col,
        projects: col.projects.map(project => {
          if (project.id === selectedProject.id && project.milestones) {
            const updatedMilestones = project.milestones.map(m =>
              m.id === verifyingMilestoneId 
                ? { ...m, status: "completed" as const, deliverable: file.name }
                : m
            );
            
            // Calculate new progress
            const completedCount = updatedMilestones.filter(m => m.status === "completed").length;
            const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
            
            // Update data verified percentage
            const newDataVerified = Math.min((project.dataVerified || 0) + 15, 100);
            
            return {
              ...project,
              milestones: updatedMilestones,
              progress: newProgress,
              dataVerified: newDataVerified,
            };
          }
          return project;
        })
      })));

      // Deduct from wallet balance
      if (onBalanceChange && releaseAmount > 0) {
        onBalanceChange(walletBalance - releaseAmount);
      }

      // Add transaction record
      onAddTransaction?.({
        description: `Milestone Complete - ${milestone?.name}`,
        amount: releaseAmount,
        type: "outgoing",
      });

      // Update selected project state
      setSelectedProject(prev => {
        if (!prev?.milestones) return prev;
        const updatedMilestones = prev.milestones.map(m =>
          m.id === verifyingMilestoneId 
            ? { ...m, status: "completed" as const, deliverable: file.name }
            : m
        );
        const completedCount = updatedMilestones.filter(m => m.status === "completed").length;
        return {
          ...prev,
          milestones: updatedMilestones,
          progress: Math.round((completedCount / updatedMilestones.length) * 100),
          dataVerified: Math.min((prev.dataVerified || 0) + 15, 100),
        };
      });

      toast.success("Funds Released!", {
        description: `$${releaseAmount.toLocaleString()} released for verified deliverable`,
      });

      setIsVerifying(false);
      setVerifyingMilestoneId(null);
    }, 2500);

    // Reset file input
    event.target.value = "";
  };

  return (
    <div className="p-8">
      {/* Hidden file input for upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        accept=".pdf,.doc,.docx,.xlsx,.csv"
      />

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
        <DialogContent className="soft-card border-none max-w-md !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2">
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

      {/* Project Details Modal - Enhanced with Milestones */}
      <Dialog open={!!selectedProject} onOpenChange={() => !isVerifying && setSelectedProject(null)}>
        <DialogContent className="soft-card border-none max-w-2xl max-h-[90vh] overflow-y-auto !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {selectedProject?.name}
            </DialogTitle>
            {selectedProject?.subtitle && (
              <p className="text-sm text-muted-foreground">{selectedProject.subtitle}</p>
            )}
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-5 pt-2">
              {/* Project Info Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground">Consultant</p>
                  <p className="font-semibold text-foreground">{selectedProject.consultant || "Unassigned"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-semibold text-foreground">
                    {selectedProject.budgetAmount 
                      ? `$${selectedProject.budgetAmount.toLocaleString()}`
                      : selectedProject.budget || "TBD"
                    }
                  </p>
                </div>
              </div>

              {/* Project Health Chart */}
              {selectedProject.budgetConsumed !== undefined && selectedProject.dataVerified !== undefined && (
                <ProjectHealthChart
                  budgetConsumed={selectedProject.budgetConsumed}
                  dataVerified={selectedProject.dataVerified}
                  projectName={selectedProject.name}
                />
              )}

              {/* Milestones Section */}
              {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Milestones
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedProject.milestones.map((milestone) => (
                      <div 
                        key={milestone.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          milestone.status === "completed"
                            ? "bg-emerald-50 border-emerald-200"
                            : milestone.status === "in-progress"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-muted/30 border-border/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {milestone.status === "completed" ? (
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </div>
                            ) : milestone.status === "in-progress" ? (
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{milestone.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ${milestone.amount.toLocaleString()}
                              </p>
                              {milestone.deliverable && (
                                <DataPassportCard 
                                  fileName={milestone.deliverable}
                                  fileType="Verified Deliverable"
                                  className="mt-2"
                                />
                              )}
                            </div>
                          </div>
                          
                          {milestone.status === "in-progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleUploadDeliverable(milestone.id)}
                              disabled={isVerifying}
                              className="btn-gradient gap-1.5 flex-shrink-0"
                            >
                              {isVerifying && verifyingMilestoneId === milestone.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Upload Deliverable
                                </>
                              )}
                            </Button>
                          )}
                          
                          {milestone.status === "completed" && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex-shrink-0">
                              <Shield className="w-3 h-3" />
                              Verified
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
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