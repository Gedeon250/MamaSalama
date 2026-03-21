import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useTranslation } from '@/i18n';

interface HeaderProps {
  title?: string;
  showProfile?: boolean;
}

export function Header({ title, showProfile = true }: HeaderProps) {
  const { user } = useApp();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 glass-subtle border-b border-border/60 safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
        {showProfile ? (
          <Link to="/profile" className="flex items-center gap-3 group">
            <Avatar className="h-10 w-10 ring-2 ring-primary/15 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary/30">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent text-foreground font-bold text-sm">
                {user?.name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t.header.welcomeBack}</p>
              <p className="font-semibold text-foreground text-sm">{user?.name || t.header.defaultName}</p>
            </div>
          </Link>
        ) : (
          <h1 className="text-lg font-bold font-display text-foreground tracking-tight">{title}</h1>
        )}

        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button variant="ghost" size="icon-sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/settings">
              <Settings className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
