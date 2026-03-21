import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Smile, Frown, Meh, Zap, Droplets, Moon, ChevronLeft, ChevronRight, Calendar, AlertTriangle, Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great', color: 'text-green-500' },
  { value: 'good', emoji: '🙂', label: 'Good', color: 'text-emerald-500' },
  { value: 'okay', emoji: '😐', label: 'Okay', color: 'text-yellow-500' },
  { value: 'low', emoji: '😔', label: 'Low', color: 'text-orange-500' },
  { value: 'bad', emoji: '😢', label: 'Bad', color: 'text-red-500' },
];

const SYMPTOMS = [
  'Nausea', 'Fatigue', 'Headache', 'Back pain', 'Swelling',
  'Cramping', 'Bleeding', 'Dizziness', 'Heartburn', 'Insomnia',
  'Breast tenderness', 'Mood swings', 'Anxiety', 'Hot flashes',
  'Constipation', 'Shortness of breath',
];

const URGENT_SYMPTOMS = ['Bleeding', 'Cramping', 'Dizziness', 'Shortness of breath'];

interface JournalEntry {
  id: string;
  date: string;
  mood: string;
  energy_level: number;
  symptoms: string[];
  notes: string | null;
  water_glasses: number;
  sleep_hours: number | null;
}

export default function HealthJournal() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('okay');
  const [energy, setEnergy] = useState(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [sleepHours, setSleepHours] = useState<number | ''>('');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadEntry(); }, [user, currentDate]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (user) fetchHistory(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEntry = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('health_journal')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', currentDate)
      .maybeSingle();

    if (data) {
      setEntryId(data.id);
      setMood(data.mood);
      setEnergy(data.energy_level || 3);
      setSelectedSymptoms((data.symptoms as string[]) || []);
      setNotes(data.notes || '');
      setWaterGlasses(data.water_glasses || 0);
      setSleepHours(data.sleep_hours ?? '');
    } else {
      setEntryId(null);
      setMood('okay');
      setEnergy(3);
      setSelectedSymptoms([]);
      setNotes('');
      setWaterGlasses(0);
      setSleepHours('');
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('health_journal')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);
    if (data) setHistory(data as JournalEntry[]);
  };

  const saveEntry = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      date: currentDate,
      mood,
      energy_level: energy,
      symptoms: selectedSymptoms,
      notes: notes || null,
      water_glasses: waterGlasses,
      sleep_hours: sleepHours === '' ? null : sleepHours,
    };

    let error;
    if (entryId) {
      ({ error } = await supabase.from('health_journal').update(payload).eq('id', entryId));
    } else {
      ({ error } = await supabase.from('health_journal').insert(payload));
    }

    if (error) {
      toast.error('Failed to save entry');
    } else {
      toast.success('Journal entry saved ✅');
      fetchHistory();
      loadEntry();
    }
    setSaving(false);
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const changeDate = (offset: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    if (d <= new Date()) setCurrentDate(d.toISOString().split('T')[0]);
  };

  const isToday = currentDate === new Date().toISOString().split('T')[0];
  const hasUrgent = selectedSymptoms.some(s => URGENT_SYMPTOMS.includes(s));

  const moodObj = MOODS.find(m => m.value === mood);

  return (
    <PageLayout title="Health Journal" showBack>
      <div className="px-4 py-6 space-y-5">
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <p className="font-semibold text-foreground">
              {isToday ? 'Today' : new Date(currentDate).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-xs text-muted-foreground">{currentDate}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeDate(1)} disabled={isToday}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">📝 Daily Log</TabsTrigger>
            <TabsTrigger value="history">📊 History</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="mt-4 space-y-5">
            {/* Mood */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">How are you feeling?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between gap-1">
                  {MOODS.map(m => (
                    <motion.button
                      key={m.value}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setMood(m.value)}
                      className={`flex-1 py-3 rounded-xl text-center transition-all border-2 ${
                        mood === m.value
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted/50'
                      }`}
                    >
                      <span className="text-2xl block">{m.emoji}</span>
                      <span className="text-[10px] text-muted-foreground">{m.label}</span>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Energy & Water */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Energy</span>
                  </div>
                  <Slider value={[energy]} onValueChange={v => setEnergy(v[0])} min={1} max={5} step={1} />
                  <p className="text-xs text-muted-foreground text-center">{energy}/5</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Water</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}>-</Button>
                    <span className="text-lg font-bold text-foreground w-8 text-center">{waterGlasses}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWaterGlasses(waterGlasses + 1)}>+</Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">glasses</p>
                </CardContent>
              </Card>
            </div>

            {/* Symptoms */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Symptoms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map(s => {
                    const isUrgent = URGENT_SYMPTOMS.includes(s);
                    const isSelected = selectedSymptoms.includes(s);
                    return (
                      <Badge
                        key={s}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all ${
                          isSelected && isUrgent ? 'bg-destructive text-destructive-foreground' : ''
                        }`}
                        onClick={() => toggleSymptom(s)}
                      >
                        {isUrgent && '⚠️ '}{s}
                      </Badge>
                    );
                  })}
                </div>

                {hasUrgent && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-2"
                  >
                    <p className="text-sm text-destructive font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> These symptoms may need urgent attention
                    </p>
                    <div className="flex gap-2">
                      <a
                        href="tel:912"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-destructive text-destructive-foreground text-xs font-semibold rounded-lg"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call 912
                      </a>
                      <Link
                        to="/chat"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-destructive text-destructive text-xs font-semibold rounded-lg"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Chat Worker
                      </Link>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Journal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="How was your day? Any concerns, wins, or thoughts..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Save */}
            <Button onClick={saveEntry} className="w-full" size="lg" disabled={saving}>
              {saving ? 'Saving...' : entryId ? 'Update Entry' : 'Save Entry'}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {history.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No journal entries yet. Start logging today!</p>
                </CardContent>
              </Card>
            ) : (
              history.map(entry => {
                const m = MOODS.find(x => x.value === entry.mood);
                return (
                  <Card key={entry.id} className="cursor-pointer" onClick={() => setCurrentDate(entry.date)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{m?.emoji || '😐'}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(entry.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Energy {entry.energy_level}/5 • 💧 {entry.water_glasses} glasses
                            </p>
                          </div>
                        </div>
                      </div>
                      {entry.symptoms && entry.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.symptoms.map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
