import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Pill, Baby, MessageSquare, AlertTriangle, Loader2, Smartphone } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card, CardContent } from '@/components/ui/card';

interface NotificationSetting {
  id: string;
  icon: typeof Bell;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettings() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: 'vaccination', icon: Baby, label: 'Vaccination Reminders', description: 'Get reminded about upcoming vaccines', enabled: true },
    { id: 'appointments', icon: Calendar, label: 'Appointment Reminders', description: 'Reminders for scheduled checkups', enabled: true },
    { id: 'medication', icon: Pill, label: 'Medication Alerts', description: 'Daily medication reminders', enabled: true },
    { id: 'community', icon: MessageSquare, label: 'Community Updates', description: 'Replies and mentions in forums', enabled: false },
    { id: 'articles', icon: Bell, label: 'New Articles', description: 'Get notified about new health content', enabled: true },
    { id: 'emergency', icon: AlertTriangle, label: 'Emergency Alerts', description: 'Critical health alerts (always on)', enabled: true },
  ]);

  const toggleSetting = (id: string) => {
    if (id === 'emergency') return; // Emergency alerts cannot be disabled
    setSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <PageLayout title="Notifications" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* Push Notifications Card */}
        {isSupported && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Push Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed 
                      ? 'You will receive notifications on this device'
                      : 'Enable to receive notifications on this device'}
                  </p>
                </div>
                <Button
                  variant={isSubscribed ? 'outline' : 'default'}
                  size="sm"
                  onClick={handlePushToggle}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    'Disable'
                  ) : (
                    'Enable'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <p className="text-muted-foreground text-sm mb-4">
            Choose which notifications you'd like to receive.
          </p>

          <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
            {settings.map((setting, index) => {
              const Icon = setting.icon;
              const isEmergency = setting.id === 'emergency';
              return (
                <div
                  key={setting.id}
                  className={`flex items-center justify-between p-4 ${
                    index !== settings.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isEmergency ? 'bg-destructive/10' : 'bg-accent'}`}>
                      <Icon className={`w-5 h-5 ${isEmergency ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    <div>
                      <span className="font-medium text-foreground block">{setting.label}</span>
                      <span className="text-sm text-muted-foreground">{setting.description}</span>
                    </div>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => toggleSetting(setting.id)}
                    disabled={isEmergency}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
