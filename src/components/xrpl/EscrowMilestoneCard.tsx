import { useState } from "react";
import { Lock, Unlock, ExternalLink, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Milestone {
  id: string;
  name: string;
  amount: number;
  status: "pending" | "in-progress" | "completed";
  deliverable?: string;
  escrowTxHash?: string;
  releaseTxHash?: string;
  escrowDeployed?: boolean;
}

interface EscrowMilestoneCardProps {
  milestone: Milestone;
  projectId: string;
  onDeployEscrow?: (milestoneId: string, amount: number) => Promise<string>;
  onReleaseEscrow?: (milestoneId: string) => Promise<string>;
  canRelease?: boolean;
}

export const EscrowMilestoneCard = ({
  milestone,
  projectId,
  onDeployEscrow,
  onReleaseEscrow,
  canRelease = false,
}: EscrowMilestoneCardProps) => {
  const [deploying, setDeploying] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const handleDeployEscrow = async () => {
    if (!onDeployEscrow) return;

    setDeploying(true);
    try {
      const txHash = await onDeployEscrow(milestone.id, milestone.amount);
      toast.success(`Escrow deployed! TX: ${txHash.slice(0, 8)}...`, {
        action: {
          label: "View",
          onClick: () =>
            window.open(`https://testnet.xrpl.org/transactions/${txHash}`, "_blank"),
        },
      });
    } catch (error) {
      toast.error("Failed to deploy escrow: " + (error as Error).message);
    } finally {
      setDeploying(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!onReleaseEscrow) return;

    setReleasing(true);
    try {
      const txHash = await onReleaseEscrow(milestone.id);
      toast.success(`Payment released! TX: ${txHash.slice(0, 8)}...`, {
        action: {
          label: "View",
          onClick: () =>
            window.open(`https://testnet.xrpl.org/transactions/${txHash}`, "_blank"),
        },
      });
    } catch (error) {
      toast.error("Failed to release escrow: " + (error as Error).message);
    } finally {
      setReleasing(false);
    }
  };

  const getStatusBadge = () => {
    if (milestone.status === "completed") {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (milestone.escrowDeployed) {
      return (
        <Badge variant="secondary">
          <Lock className="h-3 w-3 mr-1" />
          Escrowed
        </Badge>
      );
    }
    if (milestone.status === "in-progress") {
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="opacity-50">
        Pending
      </Badge>
    );
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{milestone.name}</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="text-lg font-bold">
            ${milestone.amount.toLocaleString()}
          </span>
        </div>

        {milestone.escrowTxHash && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Escrow TX</p>
            <a
              href={`https://testnet.xrpl.org/transactions/${milestone.escrowTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              {milestone.escrowTxHash.slice(0, 16)}...
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {milestone.releaseTxHash && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Release TX</p>
            <a
              href={`https://testnet.xrpl.org/transactions/${milestone.releaseTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline flex items-center gap-1"
            >
              {milestone.releaseTxHash.slice(0, 16)}...
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!milestone.escrowDeployed && milestone.status !== "completed" && (
            <Button
              size="sm"
              onClick={handleDeployEscrow}
              disabled={deploying}
              className="flex-1"
            >
              {deploying ? (
                <>
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Deploy Escrow
                </>
              )}
            </Button>
          )}

          {milestone.escrowDeployed &&
            milestone.status !== "completed" &&
            canRelease && (
              <Button
                size="sm"
                onClick={handleReleaseEscrow}
                disabled={releasing}
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {releasing ? (
                  <>
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Release Payment
                  </>
                )}
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};
