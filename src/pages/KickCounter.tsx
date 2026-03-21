import { useState, useEffect, useCallback, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Baby, Timer, Plus, Square, Play, Pause, RotateCcw, TrendingUp, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface KickSession {
  id: string;
  start_time: string;
  end_time: string | null;
  kick_count: number;
  duration_minutes: number | null;
}

// ─── Kick Counter Tab ───────────────────────────────────────
function KickCounterTab() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [kickCount, setKickCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<KickSession[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<string | null>(null);

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
      .from('kick_counter_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setHistory(data);
  };

  const startSession = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    startTimeRef.current = now;
    const { data, error } = await supabase
      .from('kick_counter_sessions')
      .insert({ user_id: user.id, start_time: now, kick_count: 0 })
      .select('id')
      .single();
    if (error) { toast.error('Failed to start session'); return; }
    setSessionId(data.id);
    setKickCount(0);
    setElapsedSeconds(0);
    setIsActive(true);
  };

  const recordKick = async () => {
    if (!sessionId) return;
    const newCount = kickCount + 1;
    setKickCount(newCount);
    await supabase
      .from('kick_counter_sessions')
      .update({ kick_count: newCount })
      .eq('id', sessionId);

    if (newCount >= 10) {
      toast.success('🎉 10 kicks reached! Baby is active and healthy!');
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    setIsActive(false);
    const durationMin = Math.round(elapsedSeconds / 60);
    await supabase
      .from('kick_counter_sessions')
      .update({ end_time: new Date().toISOString(), duration_minutes: durationMin, kick_count: kickCount })
      .eq('id', sessionId);
    toast.success(`Session saved: ${kickCount} kicks in ${formatTime(elapsedSeconds)}`);
    setSessionId(null);
    fetchHistory();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Main Counter Card */}
      <Card className="border-primary/20 overflow-hidden">
        <CardContent className="p-6 text-center space-y-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Session Timer</p>
            <p className="text-3xl font-bold font-mono text-foreground">{formatTime(elapsedSeconds)}</p>
          </div>

          {/* Kick Count Circle */}
          <div className="flex justify-center">
            <motion.button
              whileTap={isActive ? { scale: 0.9 } : {}}
              onClick={isActive ? recordKick : undefined}
              disabled={!isActive}
              className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg cursor-pointer'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={kickCount}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold"
                >
                  {kickCount}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm opacity-80">{isActive ? 'Tap to count' : 'kicks'}</span>
            </motion.button>
          </div>

          {kickCount >= 10 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              ✅ 10+ kicks — Baby is active!
            </Badge>
          )}

          {/* Controls */}
          <div className="flex gap-3 justify-center">
            {!isActive ? (
              <Button onClick={startSession} size="lg" className="gap-2">
                <Play className="w-5 h-5" /> Start Counting
              </Button>
            ) : (
              <Button onClick={endSession} variant="destructive" size="lg" className="gap-2">
                <Square className="w-5 h-5" /> End Session
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Count 10 movements within 2 hours. Contact your provider if fewer than 10.
          </p>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.kick_count} kicks</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.start_time).toLocaleDateString()} • {s.duration_minutes ? `${s.duration_minutes} min` : 'In progress'}
                  </p>
                </div>
                <Badge variant={s.kick_count >= 10 ? 'default' : 'secondary'}>
                  {s.kick_count >= 10 ? 'Good' : 'Low'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Contraction Timer Tab ──────────────────────────────────
interface Contraction {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  interval?: number;
  intensity: string;
}

function ContractionTimerTab() {
  const { user } = useAuth();
  const [isTimingContraction, setIsTimingContraction] = useState(false);
  const [contractionStart, setContractionStart] = useState<Date | null>(null);
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimingContraction && contractionStart) {
      intervalRef.current = setInterval(() => {
        setCurrentDuration(Math.floor((Date.now() - contractionStart.getTime()) / 1000));
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTimingContraction, contractionStart]);

  const startSession = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('contraction_sessions')
      .insert({ user_id: user.id, start_time: new Date().toISOString() })
      .select('id')
      .single();
    if (error) { toast.error('Failed to start session'); return; }
    setSessionId(data.id);
    setContractions([]);
  };

  const startContraction = () => {
    if (!sessionId) {
      startSession().then(() => {
        setContractionStart(new Date());
        setIsTimingContraction(true);
        setCurrentDuration(0);
      });
    } else {
      setContractionStart(new Date());
      setIsTimingContraction(true);
      setCurrentDuration(0);
    }
  };

  const endContraction = async (intensity: string = 'medium') => {
    if (!contractionStart || !sessionId) return;
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - contractionStart.getTime()) / 1000);

    let interval: number | undefined;
    if (contractions.length > 0) {
      const lastEnd = contractions[contractions.length - 1].endTime;
      if (lastEnd) {
        interval = Math.floor((contractionStart.getTime() - lastEnd.getTime()) / 1000);
      }
    }

    const newContraction: Contraction = {
      startTime: contractionStart,
      endTime,
      duration,
      interval,
      intensity,
    };

    setContractions(prev => [...prev, newContraction]);
    setIsTimingContraction(false);
    setCurrentDuration(0);

    await supabase.from('contractions').insert({
      session_id: sessionId,
      user_id: user?.id,
      start_time: contractionStart.toISOString(),
      end_time: endTime.toISOString(),
      duration_seconds: duration,
      interval_seconds: interval || null,
      intensity,
    });
  };

  const endSession = async () => {
    if (sessionId) {
      await supabase
        .from('contraction_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', sessionId);
    }
    setSessionId(null);
    toast.success(`Session saved with ${contractions.length} contractions`);
    setContractions([]);
  };

  const avgDuration = contractions.length > 0
    ? Math.round(contractions.reduce((a, c) => a + (c.duration || 0), 0) / contractions.length)
    : 0;
  const avgInterval = contractions.filter(c => c.interval).length > 0
    ? Math.round(contractions.filter(c => c.interval).reduce((a, c) => a + (c.interval || 0), 0) / contractions.filter(c => c.interval).length)
    : 0;

  const formatSec = (s: number) => {
    if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  };

  const shouldGoToHospital = avgInterval > 0 && avgInterval <= 300 && avgDuration >= 45 && contractions.length >= 3;

  return (
    <div className="space-y-6">
      {/* Timer Card */}
      <Card className="border-accent/30 overflow-hidden">
        <CardContent className="p-6 text-center space-y-6">
          {/* Current timer */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {isTimingContraction ? 'Contraction Duration' : 'Ready to time'}
            </p>
            <p className="text-4xl font-bold font-mono text-foreground">
              {isTimingContraction ? formatSec(currentDuration) : '00s'}
            </p>
          </div>

          {/* Main Button */}
          {!isTimingContraction ? (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={startContraction}
                size="lg"
                className="w-40 h-40 rounded-full text-lg gap-2 flex-col"
              >
                <Activity className="w-8 h-8" />
                <span>Contraction<br />Started</span>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">How intense?</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {['mild', 'medium', 'strong'].map(level => (
                  <Button
                    key={level}
                    variant={level === 'strong' ? 'destructive' : 'outline'}
                    onClick={() => endContraction(level)}
                    className="capitalize"
                  >
                    {level === 'mild' ? '😐' : level === 'medium' ? '😣' : '😫'} {level}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 5-1-1 Alert */}
          {shouldGoToHospital && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/30 rounded-xl p-4"
            >
              <p className="font-semibold text-destructive">🚨 5-1-1 Rule Met!</p>
              <p className="text-sm text-destructive/80">
                Contractions are ~{Math.round(avgInterval / 60)} min apart, lasting ~{avgDuration}s each. Consider heading to the hospital.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {contractions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{contractions.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{formatSec(avgDuration)}</p>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{avgInterval ? formatSec(avgInterval) : '--'}</p>
              <p className="text-xs text-muted-foreground">Avg Interval</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contraction List */}
      {contractions.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">This Session</CardTitle>
            {sessionId && (
              <Button variant="outline" size="sm" onClick={endSession}>End Session</Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {contractions.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {c.intensity === 'mild' ? '😐' : c.intensity === 'medium' ? '😣' : '😫'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {c.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{c.intensity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{formatSec(c.duration || 0)}</p>
                  {c.interval && <p className="text-xs text-muted-foreground">{formatSec(c.interval)} apart</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center px-4">
        <strong>5-1-1 Rule:</strong> Go to the hospital when contractions are 5 minutes apart, lasting 1 minute each, for at least 1 hour.
      </p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function KickCounter() {
  return (
    <PageLayout title="Kick Counter & Timer" showBack>
      <div className="px-4 py-6">
        <Tabs defaultValue="kicks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kicks" className="gap-2"><Baby className="w-4 h-4" /> Kick Counter</TabsTrigger>
            <TabsTrigger value="contractions" className="gap-2"><Timer className="w-4 h-4" /> Contractions</TabsTrigger>
          </TabsList>
          <TabsContent value="kicks" className="mt-4">
            <KickCounterTab />
          </TabsContent>
          <TabsContent value="contractions" className="mt-4">
            <ContractionTimerTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
