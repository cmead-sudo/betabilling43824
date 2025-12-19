interface ProfileCardProps {
  name: string;
  role: string;
  walletBalance: string;
  imageUrl?: string;
}

export const ProfileCard = ({ name, role, walletBalance, imageUrl }: ProfileCardProps) => {
  return (
    <div className="soft-card p-6 relative overflow-hidden h-full min-h-[280px]">
      {/* Background gradient decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-accent/20 to-pink-500/20 blur-3xl"></div>
      
      <div className="relative z-10">
        <p className="text-muted-foreground text-sm font-medium mb-2">Good morning</p>
        <h2 className="text-2xl font-bold text-foreground mb-6">Welcome, {name}</h2>
        
        <div className="relative inline-block">
          {/* Profile Image */}
          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-hover">
            <img 
              src={imageUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face"} 
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Floating Wallet Badge */}
          <div className="floating-badge -bottom-2 -right-4 animate-float">
            {walletBalance}
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">Role</p>
          <p className="font-semibold text-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
};
