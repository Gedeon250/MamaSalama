import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Bell, Sparkles, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export function MobileNav() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard',  icon: Home,       label: t.nav.home },
    { path: '/community',  icon: Users,      label: t.nav.community },
    { path: '/reminders',  icon: Bell,       label: t.nav.reminders },
    { path: '/ask-ai',     icon: Sparkles,   label: t.nav.askAi },
    { path: '/profile',    icon: UserCircle, label: t.nav.profile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around py-1.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.path === '/dashboard'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] relative',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <span className="absolute top-1 w-5 h-0.5 rounded-full bg-primary" />
              )}
              <Icon
                className={cn('w-5 h-5 mb-0.5 transition-all', isActive && 'text-primary')}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wide',
                  isActive ? 'text-primary' : ''
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
