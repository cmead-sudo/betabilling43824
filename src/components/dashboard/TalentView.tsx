import { useState } from "react";
import { Star, CheckCircle, Briefcase, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Consultant {
  id: string;
  name: string;
  role: string;
  image: string;
  tags: string[];
  aiScore: number;
  aiMetric: string;
  projects: number;
  email?: string;
  hourlyRate?: string;
}

const consultants: Consultant[] = [
  {
    id: "1",
    name: "Alice B.",
    role: "Clinical Pharmacologist",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    tags: ["Oncology", "Adaptive Design", "Fast Track"],
    aiScore: 98,
    aiMetric: "Reliability Score",
    projects: 12,
    email: "alice.b@pharmaloom.net",
    hourlyRate: "$350/hr",
  },
  {
    id: "2",
    name: "DataStats Inc.",
    role: "Biostatistics Firm",
    image: "https://images.unsplash.com/photo-1560179707-f14e90623?w=150&h=150&fit=crop",
    tags: ["PK/PD", "Meta-Analysis", "Real World Data"],
    aiScore: 92,
    aiMetric: "On-Time Delivery",
    projects: 28,
    email: "contracts@datastats.io",
    hourlyRate: "$275/hr",
  },
  {
    id: "3",
    name: "Dr. Michael Chen",
    role: "Regulatory Affairs Specialist",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    tags: ["FDA", "EMA", "Orphan Drugs"],
    aiScore: 95,
    aiMetric: "Approval Rate",
    projects: 8,
    email: "m.chen@regaffairs.com",
    hourlyRate: "$425/hr",
  },
  {
    id: "4",
    name: "Sarah Thompson",
    role: "Medical Writer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    tags: ["CSR", "IB", "Protocol"],
    aiScore: 97,
    aiMetric: "Quality Score",
    projects: 15,
    email: "s.thompson@medwrite.pro",
    hourlyRate: "$225/hr",
  },
];

const getScoreColor = (score: number) => {
  if (score >= 95) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 90) return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-amber-600 bg-amber-50 border-amber-200";
};

interface TalentViewProps {
  onHireConsultant?: (name: string) => void;
}

export const TalentView = ({ onHireConsultant }: TalentViewProps) => {
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);

  const handleHireClick = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setIsHireModalOpen(true);
  };

  const handleConfirmHire = () => {
    if (!selectedConsultant) return;
    
    toast.success("SOW Initiated!", {
      description: `Contract started with ${selectedConsultant.name}`,
    });
    onHireConsultant?.(selectedConsultant.name);
    setIsHireModalOpen(false);
    setSelectedConsultant(null);
  };

  const handleContactConsultant = (consultant: Consultant) => {
    toast.info(`Opening email to ${consultant.email}`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Verified Consultant Network</h1>
          <p className="text-muted-foreground mt-1">AI-powered matching and reliability scores</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-card shadow-soft">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{consultants.length}</span> Verified Experts
            </span>
          </div>
        </div>
      </div>

      {/* Talent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {consultants.map((consultant) => (
          <div
            key={consultant.id}
            className="soft-card p-6 hover:shadow-hover transition-all duration-300 group bg-white border border-gray-100"
          >
            <div className="flex gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={consultant.image}
                  alt={consultant.name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-soft"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(consultant.name)}&background=random`;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                      {consultant.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{consultant.role}</p>
                  </div>
                  
                  {/* AI Score Badge */}
                  <div className={`px-3 py-1.5 rounded-full border flex-shrink-0 ${getScoreColor(consultant.aiScore)}`}>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">{consultant.aiScore}%</span>
                    </div>
                    <p className="text-[10px] opacity-80">{consultant.aiMetric}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {consultant.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span>{consultant.projects} projects</span>
                    </div>
                    {consultant.hourlyRate && (
                      <span className="font-medium text-foreground">{consultant.hourlyRate}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleContactConsultant(consultant)}
                      className="h-9 px-3"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button 
                      className="btn-gradient text-sm h-9 px-4"
                      onClick={() => handleHireClick(consultant)}
                    >
                      Hire / SOW
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hire Modal */}
      <Dialog open={isHireModalOpen} onOpenChange={setIsHireModalOpen}>
        <DialogContent className="soft-card border-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Initiate Statement of Work
            </DialogTitle>
          </DialogHeader>
          
          {selectedConsultant && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                <img
                  src={selectedConsultant.image}
                  alt={selectedConsultant.name}
                  className="w-14 h-14 rounded-xl object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConsultant.name)}&background=random`;
                  }}
                />
                <div>
                  <p className="font-semibold text-foreground">{selectedConsultant.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedConsultant.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground">Hourly Rate</p>
                  <p className="font-semibold text-foreground">{selectedConsultant.hourlyRate}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground">AI Score</p>
                  <p className="font-semibold text-foreground">{selectedConsultant.aiScore}%</p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-primary">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Contract will begin immediately upon confirmation</span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsHireModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmHire}
                  className="btn-gradient flex-1"
                >
                  Confirm & Send SOW
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};