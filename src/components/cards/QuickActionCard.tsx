import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  to: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-card hover:bg-accent/50',
  primary: 'bg-primary/5 hover:bg-primary/10',
  success: 'bg-success/5 hover:bg-success/10',
  warning: 'bg-warning/5 hover:bg-warning/10',
  danger: 'bg-destructive/5 hover:bg-destructive/10',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  to,
  variant = 'default',
}: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center p-3.5 rounded-2xl border border-border/50 shadow-xs transition-all duration-200 hover:shadow-soft active:scale-[0.97]",
        variantStyles[variant]
      )}
    >
      <div className={cn("p-2.5 rounded-xl mb-2.5", iconStyles[variant])}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-foreground text-center text-xs leading-tight">
        {title}
      </h3>
      {description && (
        <p className="text-[10px] text-muted-foreground text-center mt-0.5">
          {description}
        </p>
      )}
    </Link>
  );
}
