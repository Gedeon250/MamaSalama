import { Milestone } from '@/types';
import { CheckCircle2, Circle, Baby, Brain, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MilestoneCardProps {
  milestone: Milestone;
  onToggle?: (id: string) => void;
}

const categoryConfig = {
  motor: { icon: Baby, color: 'text-primary' },
  cognitive: { icon: Brain, color: 'text-info' },
  social: { icon: Heart, color: 'text-destructive' },
  language: { icon: MessageCircle, color: 'text-success' },
};

export function MilestoneCard({ milestone, onToggle }: MilestoneCardProps) {
  const config = categoryConfig[milestone.category];
  const CategoryIcon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl bg-card shadow-soft border border-border transition-all",
        milestone.isAchieved && "bg-success/5 border-success/20"
      )}
    >
      <button
        onClick={() => onToggle?.(milestone.id)}
        className={cn(
          "mt-0.5 transition-all",
          milestone.isAchieved ? "text-success" : "text-muted-foreground hover:text-success"
        )}
      >
        {milestone.isAchieved ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <CategoryIcon className={cn("w-4 h-4", config.color)} />
          <span className="text-xs text-muted-foreground capitalize">
            {milestone.category}
          </span>
          <span className="text-xs text-muted-foreground">
            • {milestone.ageInMonths} months
          </span>
        </div>
        <h4 className={cn(
          "font-semibold text-foreground",
          milestone.isAchieved && "line-through opacity-70"
        )}>
          {milestone.title}
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          {milestone.description}
        </p>
      </div>
    </div>
  );
}
