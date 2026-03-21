import { PageLayout } from '@/components/layout/PageLayout';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Bell, Shield, Palette, ChevronRight, LogOut } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const settingsItems = [
    { icon: Palette, label: 'Appearance', to: '/settings/theme', description: 'Theme & dark mode' },
    { icon: Globe, label: t.settings.language, to: '/settings/language', description: t.settings.languageDesc },
    { icon: Bell, label: t.settings.notifications, to: '/settings/notifications', description: t.settings.notificationsDesc },
    { icon: Shield, label: t.settings.privacy, to: '/settings/privacy', description: t.settings.privacyDesc },
  ];

  return (
    <PageLayout title={t.settings.title} showBack>
      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl shadow-xs border border-border/40 overflow-hidden">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between p-4 hover:bg-accent/50 transition-colors ${index !== settingsItems.length - 1 ? 'border-b border-border/40' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-muted">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block text-sm">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </div>
    </PageLayout>
  );
}
