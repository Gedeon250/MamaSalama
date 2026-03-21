import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, AlertTriangle, Clock, CheckCircle, User, MapPin, Phone, ArrowRight, Baby } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ProviderCase {
  id: string;
  user_id: string;
  worker_id: string | null;
  status: string;
  subject: string | null;
  risk_level: string;
  ai_summary: string | null;
  escalated_at: string | null;
  created_at: string;
  updated_at: string;
  patient_name: string | null;
  patient_phone: string | null;
  pregnancy_stage: string | null;
  pregnancy_week: number | null;
  profile_location: string | null;
}

type TabFilter = 'all' | 'escalated' | 'assigned' | 'open' | 'closed';

export default function AdminCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ProviderCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  useEffect(() => {
    fetchCases();
    // Realtime
    const channel = supabase
      .channel('provider-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        fetchCases();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchCases = async () => {
    try {
      const { data: convData, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversations = convData || [];
      const userIds = [...new Set(conversations.map(c => c.user_id))];

      const { data: profileData } = userIds.length
        ? await supabase
            .from('profiles')
            .select('user_id, name, phone, pregnancy_stage, pregnancy_week, location')
            .in('user_id', userIds)
        : { data: [] };

      const profileMap = Object.fromEntries(
        (profileData || []).map(p => [p.user_id, p])
      );

      const mapped = conversations.map(c => {
        const p = profileMap[c.user_id];
        return {
          ...c,
          patient_name: p?.name || null,
          patient_phone: p?.phone || null,
          pregnancy_stage: p?.pregnancy_stage || null,
          pregnancy_week: p?.pregnancy_week || null,
          profile_location: p?.location || null,
        };
      });
      setCases(mapped as unknown as ProviderCase[]);
    } catch {
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'escalated') return c.risk_level === 'high' || c.status === 'escalated';
    return c.status === activeTab;
  });

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: cases.length },
    { id: 'escalated', label: '🚨 Urgent', count: cases.filter(c => c.risk_level === 'high' || c.status === 'escalated').length },
    { id: 'open', label: 'Open', count: cases.filter(c => c.status === 'open').length },
    { id: 'assigned', label: 'Active', count: cases.filter(c => c.status === 'assigned').length },
    { id: 'closed', label: 'Closed', count: cases.filter(c => c.status === 'closed').length },
  ];

  const riskBadge = (level: string) => {
    switch (level) {
      case 'high': return <Badge variant="destructive" className="text-[10px]">High Risk</Badge>;
      case 'medium': return <Badge className="bg-warning text-warning-foreground text-[10px]">Medium</Badge>;
      case 'low': return <Badge variant="secondary" className="text-[10px]">Low</Badge>;
      default: return null;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'escalated': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'assigned': return <MessageCircle className="w-4 h-4 text-success" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default: return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const assignToMe = async (caseId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('chat_conversations')
      .update({ worker_id: user.id, status: 'assigned' })
      .eq('id', caseId);
    fetchCases();
  };

  return (
    <AdminLayout title="Patient Cases" description="Monitor and respond to mother consultations">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold text-destructive">{cases.filter(c => c.risk_level === 'high').length}</p>
            <p className="text-xs text-destructive/80">Urgent Cases</p>
          </div>
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-warning">{cases.filter(c => c.status === 'open').length}</p>
            <p className="text-xs text-warning/80">Waiting</p>
          </div>
          <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
            <MessageCircle className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-success">{cases.filter(c => c.status === 'assigned').length}</p>
            <p className="text-xs text-success/80">Active</p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <CheckCircle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold text-muted-foreground">{cases.filter(c => c.status === 'closed').length}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Case List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No cases in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'bg-card border rounded-xl p-4 transition-all hover:shadow-md',
                  c.risk_level === 'high' ? 'border-destructive/40 bg-destructive/5' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'p-2 rounded-full flex-shrink-0',
                      c.risk_level === 'high' ? 'bg-destructive/10' : 'bg-muted'
                    )}>
                      {statusIcon(c.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-foreground text-sm">
                          {c.patient_name || 'Unknown Patient'}
                        </h3>
                        {riskBadge(c.risk_level)}
                        <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {c.subject || 'Health Consultation'} • {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                      </p>

                      {c.ai_summary && (
                        <p className="text-xs text-foreground/70 bg-muted rounded-lg p-2 mb-2 line-clamp-2">
                          🤖 {c.ai_summary}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {c.profile_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {c.profile_location}
                          </span>
                        )}
                        {c.pregnancy_stage && (
                          <span className="flex items-center gap-1">
                            <Baby className="w-3 h-3" /> {c.pregnancy_stage}
                            {c.pregnancy_week && ` (W${c.pregnancy_week})`}
                          </span>
                        )}
                        {c.patient_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {c.patient_phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!c.worker_id && c.status !== 'closed' && (
                      <Button size="sm" variant="default" onClick={() => assignToMe(c.id)} className="text-xs">
                        Take Case
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/cases/${c.id}`)}
                      className="text-xs gap-1"
                    >
                      Chat <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
