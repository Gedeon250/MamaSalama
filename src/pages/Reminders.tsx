import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ReminderCard } from '@/components/cards/ReminderCard';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';
import { AddVaccinationDialog } from '@/components/reminders/AddVaccinationDialog';
import { LocationMapDialog } from '@/components/reminders/LocationMapDialog';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Pill, Syringe, CheckCircle2, Circle, MapPin, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reminder, ReminderType, Vaccination } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Tab = 'all' | 'vaccination' | 'appointment' | 'medication';

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'vaccination', label: 'Vaccines', icon: Syringe },
  { id: 'appointment', label: 'Appointments', icon: Calendar },
  { id: 'medication', label: 'Medications', icon: Pill },
];

const validTabs: Tab[] = ['all', 'vaccination', 'appointment', 'medication'];

export default function Reminders() {
  const { user } = useAuth();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  
  // Validate and set the active tab from URL or default to 'all'
  const getValidTab = (urlTab?: string): Tab => {
    if (urlTab && validTabs.includes(urlTab as Tab)) {
      return urlTab as Tab;
    }
    return 'all';
  };
  
  const [activeTab, setActiveTab] = useState<Tab>(getValidTab(tab));
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getValidTab(tab));
  }, [tab]);
  
  const handleTabChange = (newTab: Tab) => {
    setActiveTab(newTab);
    if (newTab === 'all') {
      navigate('/reminders');
    } else {
      navigate(`/reminders/${newTab}`);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReminders();
      fetchVaccinations();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const mappedReminders: Reminder[] = (data || []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        description: r.description || undefined,
        type: r.type as ReminderType,
        dueDate: r.due_date,
        dueTime: r.due_time || undefined,
        isCompleted: r.is_completed || false,
        isRecurring: r.is_recurring || false,
        recurringPattern: r.recurring_pattern as 'daily' | 'weekly' | 'monthly' | undefined,
      }));

      setReminders(mappedReminders);
    } catch (error) {
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchVaccinations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('user_id', user.id)
        .order('age_in_weeks', { ascending: true });

      if (error) throw error;

      const mappedVaccinations: Vaccination[] = (data || []).map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description || '',
        ageInWeeks: v.age_in_weeks,
        isCompleted: v.is_completed || false,
        completedDate: v.completed_date || undefined,
      }));

      setVaccinations(mappedVaccinations);
    } catch (error) {
      toast.error('Failed to fetch vaccinations');
    }
  };

  const filteredReminders = reminders.filter((r) =>
    activeTab === 'all' ? true : r.type === activeTab
  );

  const handleCompleteReminder = async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: !reminder.isCompleted })
        .eq('id', id);

      if (error) throw error;

      setReminders(
        reminders.map((r) =>
          r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
        )
      );
      toast.success(reminder.isCompleted ? 'Unmarked as complete' : 'Marked as complete');
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const handleToggleVaccination = async (id: string) => {
    const vaccine = vaccinations.find((v) => v.id === id);
    if (!vaccine) return;

    const newCompleted = !vaccine.isCompleted;
    try {
      const { error } = await supabase
        .from('vaccinations')
        .update({
          is_completed: newCompleted,
          completed_date: newCompleted ? format(new Date(), 'yyyy-MM-dd') : null,
        })
        .eq('id', id);

      if (error) throw error;

      setVaccinations(
        vaccinations.map((v) =>
          v.id === id
            ? {
                ...v,
                isCompleted: newCompleted,
                completedDate: newCompleted ? new Date().toISOString() : undefined,
              }
            : v
        )
      );
      toast.success(newCompleted ? 'Vaccination completed!' : 'Unmarked vaccination');
    } catch (error) {
      toast.error('Failed to update vaccination');
    }
  };

  const completedVaccines = vaccinations.filter((v) => v.isCompleted).length;

  if (loading) {
    return (
      <PageLayout title="Reminders" showProfile={false}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reminders" showProfile={false}>
      <div className="px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Find Facilities Button */}
        <LocationMapDialog
          trigger={
            <Button variant="outline" className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              Find Nearby Healthcare Facilities
            </Button>
          }
        />

        {/* Vaccination Schedule (when vaccine tab is active) */}
        {activeTab === 'vaccination' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Vaccination Schedule</h3>
              <AddVaccinationDialog onSuccess={fetchVaccinations} />
            </div>

            {vaccinations.length > 0 && (
              <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">Progress</h3>
                  <span className="text-sm text-muted-foreground">
                    {completedVaccines}/{vaccinations.length} completed
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary transition-all duration-500"
                    style={{
                      width: `${vaccinations.length > 0 ? (completedVaccines / vaccinations.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {vaccinations.length > 0 ? (
              <div className="space-y-3">
                {vaccinations.map((vaccine) => (
                  <VaccinationCard
                    key={vaccine.id}
                    vaccination={vaccine}
                    onToggle={handleToggleVaccination}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Syringe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No vaccinations added yet</p>
                <div className="mt-4">
                  <AddVaccinationDialog onSuccess={fetchVaccinations} />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Reminders List */}
        {activeTab !== 'vaccination' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">
                {activeTab === 'all' ? 'All Reminders' : `${tabs.find(t => t.id === activeTab)?.label}`}
              </h3>
              <AddReminderDialog onSuccess={fetchReminders} />
            </div>

            {filteredReminders.length > 0 ? (
              <div className="space-y-3">
                {filteredReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onComplete={handleCompleteReminder}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reminders yet</p>
                <div className="mt-4">
                  <AddReminderDialog onSuccess={fetchReminders} />
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </PageLayout>
  );
}

function VaccinationCard({
  vaccination,
  onToggle,
}: {
  vaccination: Vaccination;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl bg-card shadow-soft border border-border transition-all",
        vaccination.isCompleted && "bg-success/5 border-success/20"
      )}
    >
      <button
        onClick={() => onToggle(vaccination.id)}
        className={cn(
          "transition-all",
          vaccination.isCompleted
            ? "text-success"
            : "text-muted-foreground hover:text-success"
        )}
      >
        {vaccination.isCompleted ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>

      <div className="flex-1">
        <h4
          className={cn(
            "font-semibold text-foreground",
            vaccination.isCompleted && "line-through opacity-70"
          )}
        >
          {vaccination.name}
        </h4>
        <p className="text-sm text-muted-foreground">{vaccination.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Due at: {vaccination.ageInWeeks === 0 ? 'Birth' : `${vaccination.ageInWeeks} weeks`}
        </p>
      </div>

      {vaccination.isCompleted && vaccination.completedDate && (
        <span className="text-xs text-success font-medium">
          Done
        </span>
      )}
    </div>
  );
}
