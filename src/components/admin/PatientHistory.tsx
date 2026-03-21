import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Baby, Syringe, TrendingUp, Star, Calendar, Loader2 } from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface Child {
  id: string;
  name: string;
  date_of_birth: string;
  gender: string | null;
}

interface Vaccination {
  id: string;
  name: string;
  is_completed: boolean;
  completed_date: string | null;
  age_in_weeks: number;
  child_id: string | null;
}

interface GrowthLog {
  id: string;
  date: string;
  weight_kg: number | null;
  height_cm: number | null;
  child_id: string;
}

interface Milestone {
  id: string;
  title: string;
  category: string;
  is_achieved: boolean;
  age_in_months: number;
  child_id: string | null;
}

interface PatientHistoryProps {
  userId: string;
}

export default function PatientHistory({ userId }: PatientHistoryProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'children' | 'vaccinations' | 'growth' | 'milestones'>('children');

  useEffect(() => {
    fetchAll();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = async () => {
    try {
      const [childRes, vaccRes, mileRes] = await Promise.all([
        supabase.from('children').select('*').eq('user_id', userId).order('date_of_birth', { ascending: false }),
        supabase.from('vaccinations').select('*').eq('user_id', userId).order('age_in_weeks', { ascending: true }),
        supabase.from('milestones').select('*').eq('user_id', userId).order('age_in_months', { ascending: true }),
      ]);

      const kids = childRes.data || [];
      setChildren(kids);
      setVaccinations(vaccRes.data || []);
      setMilestones(mileRes.data || []);

      // Fetch growth logs for all children
      if (kids.length > 0) {
        const { data: gData } = await supabase
          .from('growth_logs')
          .select('*')
          .in('child_id', kids.map(c => c.id))
          .order('date', { ascending: false })
          .limit(20);
        setGrowthLogs(gData || []);
      }
    } catch (_e) {
      // fetch errors are non-critical; component shows empty state
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'children' as const, label: 'Children', icon: Baby, count: children.length },
    { id: 'vaccinations' as const, label: 'Vaccines', icon: Syringe, count: vaccinations.length },
    { id: 'growth' as const, label: 'Growth', icon: TrendingUp, count: growthLogs.length },
    { id: 'milestones' as const, label: 'Milestones', icon: Star, count: milestones.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const completedVaccines = vaccinations.filter(v => v.is_completed).length;
  const achievedMilestones = milestones.filter(m => m.is_achieved).length;

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-foreground">{children.length}</p>
          <p className="text-[10px] text-muted-foreground">Children</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-foreground">{completedVaccines}/{vaccinations.length}</p>
          <p className="text-[10px] text-muted-foreground">Vaccines</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-foreground">{growthLogs.length}</p>
          <p className="text-[10px] text-muted-foreground">Growth Logs</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-foreground">{achievedMilestones}/{milestones.length}</p>
          <p className="text-[10px] text-muted-foreground">Milestones</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="max-h-60 overflow-y-auto space-y-2">
        {activeTab === 'children' && (
          children.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No children registered</p>
          ) : (
            children.map(child => {
              const ageMonths = differenceInMonths(new Date(), new Date(child.date_of_birth));
              return (
                <div key={child.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Baby className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{child.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ageMonths < 1 ? 'Newborn' : `${ageMonths} months old`} • {child.gender || 'Unknown'} • Born {format(new Date(child.date_of_birth), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              );
            })
          )
        )}

        {activeTab === 'vaccinations' && (
          vaccinations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No vaccination records</p>
          ) : (
            vaccinations.map(v => (
              <div key={v.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-2.5">
                <div className={cn(
                  'p-1.5 rounded-full',
                  v.is_completed ? 'bg-success/10' : 'bg-warning/10'
                )}>
                  <Syringe className={cn('w-3.5 h-3.5', v.is_completed ? 'text-success' : 'text-warning')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground">Week {v.age_in_weeks}</p>
                </div>
                <Badge variant={v.is_completed ? 'default' : 'secondary'} className="text-[10px]">
                  {v.is_completed ? '✓ Done' : 'Pending'}
                </Badge>
              </div>
            ))
          )
        )}

        {activeTab === 'growth' && (
          growthLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No growth records</p>
          ) : (
            growthLogs.map(g => (
              <div key={g.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-2.5">
                <div className="p-1.5 rounded-full bg-accent/10">
                  <Calendar className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    {format(new Date(g.date), 'MMM d, yyyy')}
                  </p>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    {g.weight_kg && <span>Weight: {g.weight_kg}kg</span>}
                    {g.height_cm && <span>Height: {g.height_cm}cm</span>}
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'milestones' && (
          milestones.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No milestones tracked</p>
          ) : (
            milestones.map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-2.5">
                <div className={cn(
                  'p-1.5 rounded-full',
                  m.is_achieved ? 'bg-success/10' : 'bg-muted'
                )}>
                  <Star className={cn('w-3.5 h-3.5', m.is_achieved ? 'text-success' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{m.title}</p>
                  <p className="text-[10px] text-muted-foreground">{m.category} • {m.age_in_months}mo</p>
                </div>
                <Badge variant={m.is_achieved ? 'default' : 'secondary'} className="text-[10px]">
                  {m.is_achieved ? '✓' : '—'}
                </Badge>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
