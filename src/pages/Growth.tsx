import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, TrendingUp, Weight, Ruler, Circle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInMonths, parseISO } from 'date-fns';

interface Child {
  id: string;
  name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | null;
}

interface GrowthLog {
  id: string;
  child_id: string;
  date: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  notes: string | null;
}

// WHO Child Growth Standards — Boys (weight-for-age & length-for-age, p3/p50/p97)
const whoWeightBoys = [
  { month: 0,  p3: 2.5,  p50: 3.3,  p97: 4.3 },
  { month: 3,  p3: 5.1,  p50: 6.4,  p97: 7.9 },
  { month: 6,  p3: 6.4,  p50: 7.9,  p97: 9.7 },
  { month: 9,  p3: 7.2,  p50: 8.9,  p97: 10.9 },
  { month: 12, p3: 7.8,  p50: 9.6,  p97: 11.8 },
  { month: 18, p3: 8.6,  p50: 10.9, p97: 13.5 },
  { month: 24, p3: 9.3,  p50: 12.2, p97: 15.3 },
];

const whoHeightBoys = [
  { month: 0,  p3: 46.3, p50: 49.9, p97: 53.4 },
  { month: 3,  p3: 57.6, p50: 61.4, p97: 65.3 },
  { month: 6,  p3: 63.6, p50: 67.6, p97: 71.6 },
  { month: 9,  p3: 68.0, p50: 72.0, p97: 76.2 },
  { month: 12, p3: 71.3, p50: 75.7, p97: 80.2 },
  { month: 18, p3: 77.2, p50: 82.3, p97: 87.5 },
  { month: 24, p3: 82.1, p50: 87.8, p97: 93.6 },
];

// WHO Child Growth Standards — Girls (weight-for-age & length-for-age, p3/p50/p97)
const whoWeightGirls = [
  { month: 0,  p3: 2.4,  p50: 3.2,  p97: 4.2 },
  { month: 3,  p3: 4.6,  p50: 5.8,  p97: 7.3 },
  { month: 6,  p3: 5.8,  p50: 7.3,  p97: 9.2 },
  { month: 9,  p3: 6.6,  p50: 8.2,  p97: 10.4 },
  { month: 12, p3: 7.1,  p50: 8.9,  p97: 11.3 },
  { month: 18, p3: 7.9,  p50: 10.2, p97: 13.2 },
  { month: 24, p3: 8.7,  p50: 11.5, p97: 15.1 },
];

const whoHeightGirls = [
  { month: 0,  p3: 45.6, p50: 49.1, p97: 52.7 },
  { month: 3,  p3: 56.3, p50: 59.8, p97: 63.4 },
  { month: 6,  p3: 61.8, p50: 65.7, p97: 69.8 },
  { month: 9,  p3: 66.3, p50: 70.1, p97: 74.5 },
  { month: 12, p3: 69.6, p50: 74.0, p97: 78.6 },
  { month: 18, p3: 75.6, p50: 80.7, p97: 86.1 },
  { month: 24, p3: 80.8, p50: 86.4, p97: 92.2 },
];

export default function Growth() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedChildId) {
      fetchGrowthLogs();
    }
  }, [selectedChildId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChildren = async () => {
    const { data, error } = await supabase
      .from('children')
      .select('id, name, date_of_birth, gender')
      .eq('user_id', user?.id);

    if (error) {
      toast.error('Failed to load children');
    } else if (data && data.length > 0) {
      setChildren(data);
      setSelectedChildId(data[0].id);
    }
    setLoading(false);
  };

  const fetchGrowthLogs = async () => {
    const { data, error } = await supabase
      .from('growth_logs')
      .select('*')
      .eq('child_id', selectedChildId)
      .order('date', { ascending: true });

    if (error) {
      toast.error('Failed to load growth logs');
    } else {
      setGrowthLogs(data || []);
    }
  };

  const handleAddLog = async () => {
    if (!selectedChildId || (!weight && !height && !headCircumference)) {
      toast.error('Please enter at least one measurement');
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from('growth_logs').insert({
      child_id: selectedChildId,
      date,
      weight_kg: weight ? parseFloat(weight) : null,
      height_cm: height ? parseFloat(height) : null,
      head_circumference_cm: headCircumference ? parseFloat(headCircumference) : null,
      notes: notes || null,
    });

    if (error) {
      toast.error('Failed to save growth log');
    } else {
      toast.success('Growth log added!');
      setIsDialogOpen(false);
      resetForm();
      fetchGrowthLogs();
    }

    setIsSaving(false);
  };

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setWeight('');
    setHeight('');
    setHeadCircumference('');
    setNotes('');
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const getChartData = () => {
    if (!selectedChild) return [];

    return growthLogs.map((log) => {
      const ageInMonths = differenceInMonths(parseISO(log.date), parseISO(selectedChild.date_of_birth));
      return {
        month: ageInMonths,
        date: format(parseISO(log.date), 'MMM yyyy'),
        weight: log.weight_kg,
        height: log.height_cm,
        head: log.head_circumference_cm,
      };
    });
  };

  const chartData = getChartData();
  const latestLog = growthLogs[growthLogs.length - 1];
  const isGirl = selectedChild?.gender === 'female';
  const whoWeight = isGirl ? whoWeightGirls : whoWeightBoys;
  const whoHeight = isGirl ? whoHeightGirls : whoHeightBoys;

  const chartConfig = {
    weight: { label: 'Weight', color: 'hsl(var(--primary))' },
    height: { label: 'Height', color: 'hsl(var(--success))' },
    head: { label: 'Head', color: 'hsl(var(--info))' },
    p3: { label: '3rd Percentile', color: 'hsl(var(--muted-foreground))' },
    p50: { label: '50th Percentile', color: 'hsl(var(--muted-foreground))' },
    p97: { label: '97th Percentile', color: 'hsl(var(--muted-foreground))' },
  };

  if (loading) {
    return (
      <PageLayout title="Growth Tracking" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (children.length === 0) {
    return (
      <PageLayout title="Growth Tracking" showBack>
        <div className="px-4 py-12 text-center">
          <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No Children Added</h2>
          <p className="text-muted-foreground mb-6">
            Add a child to start tracking their growth.
          </p>
          <Button onClick={() => window.location.href = '/profile/children'}>
            Add Child
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Growth Tracking" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* Child Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Growth Log</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 5.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 60"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="head">Head Circumference (cm)</Label>
                  <Input
                    id="head"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 38"
                    value={headCircumference}
                    onChange={(e) => setHeadCircumference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Any observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAddLog}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Log'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Stats */}
        {latestLog && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Weight className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold text-foreground">
                  {latestLog.weight_kg || '-'}
                </p>
                <p className="text-xs text-muted-foreground">kg</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Ruler className="w-5 h-5 mx-auto text-success mb-1" />
                <p className="text-2xl font-bold text-foreground">
                  {latestLog.height_cm || '-'}
                </p>
                <p className="text-xs text-muted-foreground">cm</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Circle className="w-5 h-5 mx-auto text-info mb-1" />
                <p className="text-2xl font-bold text-foreground">
                  {latestLog.head_circumference_cm || '-'}
                </p>
                <p className="text-xs text-muted-foreground">cm head</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Growth Charts */}
        <Tabs defaultValue="weight" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="height">Height</TabsTrigger>
            <TabsTrigger value="head">Head</TabsTrigger>
          </TabsList>

          <TabsContent value="weight" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Weight vs WHO Standards ({isGirl ? 'Girls' : 'Boys'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Age (months)', position: 'bottom' }} />
                      <YAxis label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                      {/* WHO reference lines */}
                      <Line type="monotone" data={whoWeight} dataKey="p3" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" data={whoWeight} dataKey="p50" stroke="hsl(var(--muted-foreground))" dot={false} />
                      <Line type="monotone" data={whoWeight} dataKey="p97" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No weight data yet. Add a growth log to see the chart.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="height" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Height vs WHO Standards ({isGirl ? 'Girls' : 'Boys'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Age (months)', position: 'bottom' }} />
                      <YAxis label={{ value: 'Height (cm)', angle: -90, position: 'insideLeft' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="height" stroke="hsl(var(--success))" strokeWidth={2} dot />
                      <Line type="monotone" data={whoHeight} dataKey="p3" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" data={whoHeight} dataKey="p50" stroke="hsl(var(--muted-foreground))" dot={false} />
                      <Line type="monotone" data={whoHeight} dataKey="p97" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No height data yet. Add a growth log to see the chart.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="head" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Head Circumference</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Age (months)', position: 'bottom' }} />
                      <YAxis label={{ value: 'Circumference (cm)', angle: -90, position: 'insideLeft' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="head" stroke="hsl(var(--info))" strokeWidth={2} dot />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No head circumference data yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Growth Log History */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Recent Logs</h3>
          {growthLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No growth logs yet. Tap + to add one.
            </p>
          ) : (
            <div className="space-y-2">
              {growthLogs.slice().reverse().slice(0, 5).map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {format(parseISO(log.date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.weight_kg && `${log.weight_kg}kg`}
                        {log.height_cm && ` • ${log.height_cm}cm`}
                        {log.head_circumference_cm && ` • ${log.head_circumference_cm}cm head`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
