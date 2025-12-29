import { useState, useEffect } from "react";
import { Wallet, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface WalletStatusCardProps {
  projectId: string;
  walletAddress?: string;
  xrpBalance?: number;
  rlusdBalance?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const WalletStatusCard = ({
  projectId,
  walletAddress,
  xrpBalance = 0,
  rlusdBalance = 0,
  isLoading = false,
  onRefresh,
}: WalletStatusCardProps) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
      toast.success("Wallet balance updated");
    }
  };

  const openExplorer = () => {
    if (walletAddress) {
      window.open(
        `https://testnet.xrpl.org/accounts/${walletAddress}`,
        "_blank"
      );
    }
  };

  if (!walletAddress) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4" />
            XRPL Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No wallet created yet. Fund this project to automatically generate a
            segregated wallet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            XRPL Wallet
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
            >
              <RefreshCw
                className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <Button size="sm" variant="ghost" onClick={openExplorer}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Address</p>
          <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
            {walletAddress}
          </code>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">XRP Balance</p>
            <p className="text-lg font-bold">{xrpBalance.toFixed(2)} XRP</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">RLUSD Balance</p>
            <p className="text-lg font-bold">
              ${rlusdBalance.toLocaleString()}
            </p>
          </div>
        </div>

        <Badge variant="outline" className="w-full justify-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          Segregated Agent Model
        </Badge>
      </CardContent>
    </Card>
  );
};
