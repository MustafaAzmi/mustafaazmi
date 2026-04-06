interface EnergyBarProps {
  interactionCount: number;
}

const EnergyBar = ({ interactionCount }: EnergyBarProps) => {
  const energy = Math.min(100, interactionCount * 5);

  const getGradient = () => {
    if (energy < 30) return "from-primary/30 to-primary/50";
    if (energy < 60) return "from-primary/50 to-mystery-accent/60";
    return "from-primary to-mystery-accent";
  };

  const getMessage = () => {
    if (energy >= 80) return "Your profile is on fire 🔥";
    if (energy >= 50) return "Your profile is gaining attention today";
    if (energy >= 20) return "Curiosity is building…";
    return "The shadows are quiet…";
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Profile Energy</p>
        <p className="text-xs text-muted-foreground italic">{getMessage()}</p>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient()} transition-all duration-1000 ease-out`}
          style={{ width: `${energy}%` }}
        />
      </div>
    </div>
  );
};

export default EnergyBar;
