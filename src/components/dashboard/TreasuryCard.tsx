import { Lock, CircleDollarSign } from "lucide-react";

interface TreasuryCardProps {
  totalLiquidity: string;
  available: string;
  escrowed: string;
  onFundContract?: () => void;
}

export const TreasuryCard = ({ 
  totalLiquidity, 
  available, 
  escrowed, 
  onFundContract 
}: TreasuryCardProps) => {
  return (
    <div className="relative soft-card p-6 h-full overflow-hidden">
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-br from-accent via-pink-500/50 to-transparent -z-10">
        <div className="w-full h-full bg-card rounded-3xl"></div>
      </div>
      
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-accent/10 to-pink-500/10 blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CircleDollarSign className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Total Liquidity</span>
        </div>
        
        <p className="text-4xl font-bold text-primary mb-1">{totalLiquidity}</p>
        <p className="text-sm text-muted-foreground mb-6">USDC</p>
        
        {/* Available & Escrowed */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-active shadow-[0_0_8px_hsl(var(--status-active)/0.5)]"></span>
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <span className="font-semibold text-foreground">{available}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Escrowed</span>
            </div>
            <span className="font-semibold text-foreground">{escrowed}</span>
          </div>
        </div>
        
        <button 
          onClick={onFundContract}
          className="gradient-button w-full flex items-center justify-center gap-2"
        >
          Fund New Contract
        </button>
      </div>
    </div>
  );
};
