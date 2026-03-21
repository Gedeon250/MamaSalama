import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Syringe, Bell, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DashboardStats {
  totalClients: number;
  totalReminders: number;
  totalVaccinations: number;
  completedVaccinations: number;
  upcomingAppointments: number;
  recentClients: Array<{
    id: string;
    name: string;
    email: string | null;
    pregnancy_stage: string | null;
    created_at: string;
  }>;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalReminders: 0,
    totalVaccinations: 0,
    completedVaccinations: 0,
    upcomingAppointments: 0,
    recentClients: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total reminders
      const { count: reminderCount } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true });

      // Fetch vaccinations
      const { data: vaccinations } = await supabase
        .from('vaccinations')
        .select('is_completed');

      const totalVacc = vaccinations?.length || 0;
      const completedVacc = vaccinations?.filter(v => v.is_completed).length || 0;

      // Fetch upcoming appointments
      const today = format(new Date(), 'yyyy-MM-dd');
      const { count: appointmentCount } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'appointment')
        .gte('due_date', today)
        .eq('is_completed', false);

      // Fetch recent clients
      const { data: recentClients } = await supabase
        .from('profiles')
        .select('id, name, email, pregnancy_stage, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalClients: clientCount || 0,
        totalReminders: reminderCount || 0,
        totalVaccinations: totalVacc,
        completedVaccinations: completedVacc,
        upcomingAppointments: appointmentCount || 0,
        recentClients: recentClients || [],
      });
    } catch {
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  const vaccinationRate = stats.totalVaccinations > 0 
    ? Math.round((stats.completedVaccinations / stats.totalVaccinations) * 100)
    : 0;

  return (
    <AdminLayout title="Dashboard Overview" description="Monitor your maternal health program at a glance">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          change="Registered mothers"
          changeType="neutral"
        />
        <StatCard
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          icon={Calendar}
          change="Scheduled visits"
          changeType="neutral"
        />
        <StatCard
          title="Vaccination Rate"
          value={`${vaccinationRate}%`}
          icon={Syringe}
          change={`${stats.completedVaccinations}/${stats.totalVaccinations} completed`}
          changeType={vaccinationRate >= 70 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Active Reminders"
          value={stats.totalReminders}
          icon={Bell}
          change="Total reminders set"
          changeType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Recent Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : stats.recentClients.length > 0 ? (
              <div className="space-y-4">
                {stats.recentClients.map(client => (
                  <div key={client.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.email || 'No email'}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                        {client.pregnancy_stage || 'Not set'}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(client.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No clients yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Program Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Vaccination Completion</span>
                  <span className="text-sm font-medium">{vaccinationRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${vaccinationRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.recentClients.filter(c => 
                      new Date(c.created_at).getMonth() === new Date().getMonth()
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">New registrations</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Syringe className="w-4 h-4" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalVaccinations - stats.completedVaccinations}
                  </p>
                  <p className="text-xs text-muted-foreground">Vaccinations due</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
