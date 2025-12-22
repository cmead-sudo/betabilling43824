import { useState } from "react";
import { Shield, CheckCircle, FileText, Lock, Eye } from "lucide-react";

interface DataPassportCardProps {
  fileName: string;
  fileType?: string;
  createdDate?: string;
  reviewedDate?: string;
  lockedDate?: string;
  className?: string;
}

export const DataPassportCard = ({
  fileName,
  fileType = "Document",
  createdDate = "Dec 15, 2024",
  reviewedDate = "Dec 18, 2024",
  lockedDate = "Dec 20, 2024",
  className = "",
}: DataPassportCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const chainOfCustody = [
    {
      step: "Creation",
      date: createdDate,
      hash: "0x7a3f...8c21",
      icon: FileText,
    },
    {
      step: "Review",
      date: reviewedDate,
      hash: "0x9b4e...2d45",
      icon: Eye,
    },
    {
      step: "Blockchain Lock",
      date: lockedDate,
      hash: "0xa7f3...9c2e",
      icon: Lock,
    },
  ];

  return (
    <div 
      className={`perspective-1000 ${className}`}
      style={{ perspective: "1000px" }}
    >
      <div 
        className={`relative transition-transform duration-700 transform-style-3d cursor-pointer ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{ 
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side */}
        <div 
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex items-center gap-3 group hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">{fileType}</p>
            </div>
            <button 
              className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(true);
              }}
            >
              <Shield className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Back Side - Chain of Custody */}
        <div 
          className="absolute inset-0"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="p-4 rounded-xl bg-slate-900 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold">Chain of Custody</span>
              </div>
              <button 
                className="text-xs text-white/60 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
              >
                ✕ Close
              </button>
            </div>
            
            <div className="space-y-3">
              {chainOfCustody.map((item, index) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    {index < chainOfCustody.length - 1 && (
                      <div className="w-0.5 h-6 bg-emerald-500/30 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.step}</span>
                      <span className="text-xs text-white/50">{item.date}</span>
                    </div>
                    <code className="text-xs text-purple-300 font-mono">{item.hash}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};