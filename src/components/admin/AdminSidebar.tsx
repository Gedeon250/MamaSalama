import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Syringe,
  Bell,
  FileDown,
  Settings,
  LogOut,
  ChevronLeft,
  MessageSquare,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Overview', icon: LayoutDashboard, to: '/admin' },
  { title: 'Patient Cases', icon: ShieldAlert, to: '/admin/cases' },
  { title: 'Clients', icon: Users, to: '/admin/clients' },
  { title: 'Appointments', icon: Calendar, to: '/admin/appointments' },
  { title: 'Vaccinations', icon: Syringe, to: '/admin/vaccinations' },
  { title: 'Reminders', icon: Bell, to: '/admin/reminders' },
  { title: 'Messages', icon: MessageSquare, to: '/admin/messages' },
  { title: 'USSD & SMS', icon: Smartphone, to: '/admin/sms' },
  { title: 'Export Data', icon: FileDown, to: '/admin/export' },
  { title: 'Settings', icon: Settings, to: '/admin/settings' },
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to App</span>
        </Link>
        <h1 className="text-xl font-bold font-display text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Safe Start Mama</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== '/admin' && location.pathname.startsWith(item.to));
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {profile?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.name || 'Admin'}
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
