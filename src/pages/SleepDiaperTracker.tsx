import { useState, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Moon, Sun, Droplets, Play, Square, Clock, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface SleepLog {
  id: string;
  sleep_type: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  quality: string | null;
}

interface DiaperLog {
  id: string;
  change_time: string;
  diaper_type: string;
  notes: string | null;
}

// ─── Sleep Tracker Tab ──────────────────────────────────────
function SleepTab() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('nap');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<SleepLog[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { if (user) fetchHistory(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  const startSleep = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('sleep_logs')
      .insert({ user_id: user.id, start_time: new Date().toISOString(), sleep_type: sleepType })
      .select('id')
      .single();
    if (error) { toast.error('Failed to start'); return; }
    setSessionId(data.id);
    setElapsedSeconds(0);
    setIsActive(true);
  };

  const stopSleep = async (quality: string = 'good') => {
    if (!sessionId) return;
    setIsActive(false);
    const durationMin = Math.round(elapsedSeconds / 60) || 1;
    await supabase
      .from('sleep_logs')
      .update({ end_time: new Date().toISOString(), duration_minutes: durationMin, quality })
      .eq('id', sessionId);
    toast.success(`Sleep logged: ${formatDuration(durationMin)}`);
    setSessionId(null);
    fetchHistory();
  };

  const deleteLog = async (id: string) => {
    await supabase.from('sleep_logs').delete().eq('id', id);
    setHistory(h => h.filter(s => s.id !== id));
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDuration = (mins: number) => {
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const today = new Date().toDateString();
  const todayLogs = history.filter(s => new Date(s.start_time).toDateString() === today);
  const todayTotal = todayLogs.reduce((a, s) => a + (s.duration_minutes || 0), 0);
  const todayNaps = todayLogs.filter(s => s.sleep_type === 'nap').length;

  return (
    <div className="space-y-5">
      {/* Daily Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{formatDuration(todayTotal)}</p>
          <p className="text-xs text-muted-foreground">Total Sleep</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{todayNaps}</p>
          <p className="text-xs text-muted-foreground">Naps</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{todayLogs.length}</p>
          <p className="text-xs text-muted-foreground">Sessions</p>
        </CardContent></Card>
      </div>

      {/* Timer Card */}
      <Card className="border-primary/20">
        <CardContent className="p-6 space-y-5 text-center">
          {/* Sleep Type */}
          <div className="flex gap-3 justify-center">
            {([['nap', '☀️', 'Nap'], ['night', '🌙', 'Night']] as const).map(([type, emoji, label]) => (
              <Button
                key={type}
                variant={sleepType === type ? 'default' : 'outline'}
                onClick={() => !isActive && setSleepType(type)}
                disabled={isActive}
                className="gap-2"
              >
                {emoji} {label}
              </Button>
            ))}
          </div>

          {/* Timer */}
          <div>
            <p className="text-4xl font-bold font-mono text-foreground">{formatTime(elapsedSeconds)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isActive ? `Baby is ${sleepType === 'nap' ? 'napping' : 'sleeping'}... 💤` : 'Ready to track'}
            </p>
          </div>

          {!isActive ? (
            <Button onClick={startSleep} size="lg" className="gap-2 w-full max-w-xs">
              <Moon className="w-5 h-5" /> Baby Fell Asleep
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">How did baby sleep?</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {['great', 'good', 'restless', 'poor'].map(q => (
                  <Button key={q} variant="outline" size="sm" onClick={() => stopSleep(q)} className="capitalize">
                    {q === 'great' ? '😴' : q === 'good' ? '🙂' : q === 'restless' ? '😟' : '😢'} {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Sleep History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{s.sleep_type === 'nap' ? '☀️' : '🌙'}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.duration_minutes ? formatDuration(s.duration_minutes) : 'In progress'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {s.quality && ` • ${s.quality}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteLog(s.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Diaper Tracker Tab ─────────────────────────────────────
function DiaperTab() {
  const { user } = useAuth();
  const [history, setHistory] = useState<DiaperLog[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => { if (user) fetchHistory(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('diaper_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setHistory(data);
  };

  const logDiaper = async (type: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('diaper_logs')
      .insert({
        user_id: user.id,
        change_time: new Date().toISOString(),
        diaper_type: type,
        notes: notes || null,
      });
    if (error) { toast.error('Failed to log'); return; }
    toast.success(`${type} diaper logged ✅`);
    setNotes('');
    fetchHistory();
  };

  const deleteLog = async (id: string) => {
    await supabase.from('diaper_logs').delete().eq('id', id);
    setHistory(h => h.filter(d => d.id !== id));
  };

  const today = new Date().toDateString();
  const todayLogs = history.filter(d => new Date(d.change_time).toDateString() === today);
  const wetCount = todayLogs.filter(d => d.diaper_type === 'wet').length;
  const dirtyCount = todayLogs.filter(d => d.diaper_type === 'dirty').length;
  const mixedCount = todayLogs.filter(d => d.diaper_type === 'mixed').length;

  const getEmoji = (type: string) => type === 'wet' ? '💧' : type === 'dirty' ? '💩' : type === 'mixed' ? '💧💩' : '✅';

  return (
    <div className="space-y-5">
      {/* Daily Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{wetCount}</p>
          <p className="text-xs text-muted-foreground">💧 Wet</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{dirtyCount}</p>
          <p className="text-xs text-muted-foreground">💩 Dirty</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{mixedCount}</p>
          <p className="text-xs text-muted-foreground">💧💩 Mixed</p>
        </CardContent></Card>
      </div>

      {/* Quick Log */}
      <Card className="border-primary/20">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground text-center">Log a Diaper Change</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {[['wet', '💧', 'Wet'], ['dirty', '💩', 'Dirty'], ['mixed', '💧💩', 'Mixed']].map(([type, emoji, label]) => (
              <motion.div key={type} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={() => logDiaper(type)}
                  className="w-full h-20 flex-col gap-1 text-lg"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-xs">{label}</span>
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => logDiaper('dry')} className="flex-1 gap-1">
              ✅ Dry Check
            </Button>
          </div>

          <Textarea
            placeholder="Optional notes (e.g. rash, color change)..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="text-sm"
          />

          {todayLogs.length >= 6 && (
            <Badge variant="secondary" className="w-full justify-center py-1">
              ✅ {todayLogs.length} changes today — good hydration!
            </Badge>
          )}
          {todayLogs.length > 0 && todayLogs.length < 6 && (
            <p className="text-xs text-muted-foreground text-center">
              Newborns typically need 6-8 diaper changes per day
            </p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Diaper History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getEmoji(d.diaper_type)}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{d.diaper_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.change_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {d.notes && ` • ${d.notes}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteLog(d.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function SleepDiaperTracker() {
  return (
    <PageLayout title="Sleep & Diaper Tracker" showBack>
      <div className="px-4 py-6">
        <Tabs defaultValue="sleep" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sleep" className="gap-2"><Moon className="w-4 h-4" /> Sleep</TabsTrigger>
            <TabsTrigger value="diaper" className="gap-2"><Droplets className="w-4 h-4" /> Diapers</TabsTrigger>
          </TabsList>
          <TabsContent value="sleep" className="mt-4"><SleepTab /></TabsContent>
          <TabsContent value="diaper" className="mt-4"><DiaperTab /></TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
