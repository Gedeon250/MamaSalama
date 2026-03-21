import { Reminder } from '@/types';
import { Bell, Calendar, Pill, Stethoscope, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ReminderCardProps {
  reminder: Reminder;
  onComplete?: (id: string) => void;
}

const typeConfig = {
  vaccination: {
    icon: Bell,
    bgClass: 'bg-info/8',
    iconClass: 'text-info',
  },
  appointment: {
    icon: Calendar,
    bgClass: 'bg-primary/8',
    iconClass: 'text-primary',
  },
  medication: {
    icon: Pill,
    bgClass: 'bg-success/8',
    iconClass: 'text-success',
  },
  checkup: {
    icon: Stethoscope,
    bgClass: 'bg-warning/8',
    iconClass: 'text-warning',
  },
};

export function ReminderCard({ reminder, onComplete }: ReminderCardProps) {
  const config = typeConfig[reminder.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 p-3.5 rounded-2xl bg-card shadow-xs border border-border/40 transition-all duration-200 hover:shadow-soft",
        reminder.isCompleted && "opacity-50"
      )}
    >
      <div className={cn("p-2.5 rounded-xl flex-shrink-0", config.bgClass)}>
        <Icon className={cn("w-4.5 h-4.5", config.iconClass)} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={cn(
          "font-semibold text-foreground text-sm",
          reminder.isCompleted && "line-through"
        )}>
          {reminder.title}
        </h4>
        {reminder.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {reminder.description}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1 font-medium">
          {format(new Date(reminder.dueDate), 'MMM d, yyyy')}
          {reminder.dueTime && ` · ${reminder.dueTime}`}
        </p>
      </div>

      <button
        onClick={() => onComplete?.(reminder.id)}
        className={cn(
          "p-2 rounded-xl transition-all",
          reminder.isCompleted
            ? "text-success"
            : "text-muted-foreground/40 hover:text-success hover:bg-success/8"
        )}
      >
        <CheckCircle2 className="w-5 h-5" />
      </button>
    </div>
  );
}
