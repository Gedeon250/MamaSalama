import { useState, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Square, Clock, Droplets, Baby, TrendingUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Side = 'left' | 'right';
type FeedType = 'breast' | 'bottle' | 'pumped';

interface FeedingSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  side: string;
  feed_type: string;
  amount_ml: number | null;
  notes: string | null;
  created_at: string;
}

export default function BreastfeedingTracker() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [selectedSide, setSelectedSide] = useState<Side>('left');
  const [feedType, setFeedType] = useState<FeedType>('breast');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<FeedingSession[]>([]);
  const [bottleAmount, setBottleAmount] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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
      .from('breastfeeding_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data as FeedingSession[]);
  };

  const startFeeding = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('breastfeeding_sessions')
      .insert({
        user_id: user.id,
        start_time: now,
        side: selectedSide,
        feed_type: feedType,
      })
      .select('id')
      .single();
    if (error) { toast.error('Failed to start session'); return; }
    setSessionId(data.id);
    setElapsedSeconds(0);
    setIsActive(true);
  };

  const stopFeeding = async () => {
    if (!sessionId) return;
    setIsActive(false);
    const durationMin = Math.round(elapsedSeconds / 60) || 1;
    const amountMl = feedType !== 'breast' && bottleAmount ? parseInt(bottleAmount) : null;

    await supabase
      .from('breastfeeding_sessions')
      .update({
        end_time: new Date().toISOString(),
        duration_minutes: durationMin,
        amount_ml: amountMl,
      })
      .eq('id', sessionId);

    toast.success(`Feeding saved: ${durationMin} min on ${selectedSide} side`);
    setSessionId(null);
    setBottleAmount('');
    fetchHistory();
  };

  const deleteSession = async (id: string) => {
    await supabase.from('breastfeeding_sessions').delete().eq('id', id);
    setHistory(h => h.filter(s => s.id !== id));
    toast.success('Session deleted');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Daily stats
  const today = new Date().toDateString();
  const todaySessions = history.filter(s => new Date(s.start_time).toDateString() === today);
  const todayTotal = todaySessions.reduce((a, s) => a + (s.duration_minutes || 0), 0);
  const todayCount = todaySessions.length;
  const lastSide = todaySessions[0]?.side;

  return (
    <PageLayout title="Breastfeeding Tracker" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* Today's Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{todayCount}</p>
              <p className="text-xs text-muted-foreground">Feedings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{todayTotal}m</p>
              <p className="text-xs text-muted-foreground">Total Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground capitalize">{lastSide || '--'}</p>
              <p className="text-xs text-muted-foreground">Last Side</p>
            </CardContent>
          </Card>
        </div>

        {/* Timer Card */}
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-5">
            {/* Feed Type */}
            <div className="flex gap-2 justify-center">
              {(['breast', 'bottle', 'pumped'] as FeedType[]).map(type => (
                <Button
                  key={type}
                  variant={feedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => !isActive && setFeedType(type)}
                  disabled={isActive}
                  className="capitalize"
                >
                  {type === 'breast' ? '🤱' : type === 'bottle' ? '🍼' : '🫙'} {type}
                </Button>
              ))}
            </div>

            {/* Side Selector (for breast/pumped) */}
            {feedType !== 'bottle' && (
              <div className="flex gap-3 justify-center">
                {(['left', 'right'] as Side[]).map(side => (
                  <motion.button
                    key={side}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => !isActive && setSelectedSide(side)}
                    disabled={isActive}
                    className={`flex-1 max-w-[140px] py-4 rounded-2xl border-2 text-center transition-all ${
                      selectedSide === side
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{side === 'left' ? '◀️' : '▶️'}</span>
                    <span className="text-sm capitalize">{side}</span>
                    {lastSide && lastSide !== side && !isActive && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">Suggested</Badge>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Bottle amount */}
            {feedType === 'bottle' && (
              <div className="space-y-2">
                <Label>Amount (ml)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 120"
                  value={bottleAmount}
                  onChange={e => setBottleAmount(e.target.value)}
                  disabled={!isActive}
                />
              </div>
            )}

            {/* Timer Display */}
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-foreground">{formatTime(elapsedSeconds)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isActive ? `Feeding on ${selectedSide} side` : 'Ready to start'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              {!isActive ? (
                <Button onClick={startFeeding} size="lg" className="gap-2 w-full max-w-xs">
                  <Play className="w-5 h-5" /> Start Feeding
                </Button>
              ) : (
                <Button onClick={stopFeeding} variant="destructive" size="lg" className="gap-2 w-full max-w-xs">
                  <Square className="w-5 h-5" /> Stop & Save
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" /> Feeding History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.map(s => {
                const time = new Date(s.start_time);
                const isToday = time.toDateString() === today;
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {s.feed_type === 'breast' ? '🤱' : s.feed_type === 'bottle' ? '🍼' : '🫙'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {s.duration_minutes ? `${s.duration_minutes} min` : 'In progress'}
                          {s.feed_type === 'breast' && <span className="text-muted-foreground"> • {s.side}</span>}
                          {s.amount_ml && <span className="text-muted-foreground"> • {s.amount_ml}ml</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isToday ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : time.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => deleteSession(s.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
