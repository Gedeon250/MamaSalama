import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Baby, 
  Brain, 
  Heart, 
  MessageCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  date_of_birth: string;
}

interface Milestone {
  id: string;
  user_id: string;
  child_id: string | null;
  title: string;
  description: string | null;
  age_in_months: number;
  category: 'motor' | 'cognitive' | 'social' | 'language';
  is_achieved: boolean;
  achieved_date: string | null;
}

const categories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'motor', label: 'Motor', icon: Baby },
  { id: 'cognitive', label: 'Cognitive', icon: Brain },
  { id: 'social', label: 'Social', icon: Heart },
  { id: 'language', label: 'Language', icon: MessageCircle },
];

const categoryConfig: Record<string, { icon: LucideIcon; color: string }> = {
  motor: { icon: Baby, color: 'text-primary' },
  cognitive: { icon: Brain, color: 'text-info' },
  social: { icon: Heart, color: 'text-destructive' },
  language: { icon: MessageCircle, color: 'text-success' },
};

// Predefined milestones based on age
const defaultMilestones = [
  { title: 'Lifts head briefly', category: 'motor', ageInMonths: 1, description: 'Can briefly lift head when on tummy' },
  { title: 'Social smile', category: 'social', ageInMonths: 2, description: 'Smiles in response to your smile' },
  { title: 'Coos and gurgles', category: 'language', ageInMonths: 2, description: 'Makes cooing sounds' },
  { title: 'Follows objects with eyes', category: 'cognitive', ageInMonths: 3, description: 'Tracks moving objects with eyes' },
  { title: 'Rolls over', category: 'motor', ageInMonths: 4, description: 'Can roll from tummy to back' },
  { title: 'Laughs', category: 'social', ageInMonths: 4, description: 'Laughs out loud' },
  { title: 'Babbles', category: 'language', ageInMonths: 6, description: 'Makes babbling sounds like "ba-ba"' },
  { title: 'Sits without support', category: 'motor', ageInMonths: 6, description: 'Can sit independently' },
  { title: 'Stranger anxiety', category: 'social', ageInMonths: 7, description: 'Shows wariness of strangers' },
  { title: 'Object permanence', category: 'cognitive', ageInMonths: 8, description: 'Looks for hidden objects' },
  { title: 'Crawls', category: 'motor', ageInMonths: 9, description: 'Crawls on hands and knees' },
  { title: 'Says "mama" or "dada"', category: 'language', ageInMonths: 9, description: 'Uses mama/dada with meaning' },
  { title: 'Waves bye-bye', category: 'social', ageInMonths: 10, description: 'Waves goodbye' },
  { title: 'Stands with support', category: 'motor', ageInMonths: 10, description: 'Pulls to stand holding furniture' },
  { title: 'First steps', category: 'motor', ageInMonths: 12, description: 'Takes first independent steps' },
  { title: 'Says 2-3 words', category: 'language', ageInMonths: 12, description: 'Says a few words besides mama/dada' },
  { title: 'Points to objects', category: 'cognitive', ageInMonths: 12, description: 'Points to show interest' },
  { title: 'Walks steadily', category: 'motor', ageInMonths: 15, description: 'Walks without falling' },
  { title: 'Says 10+ words', category: 'language', ageInMonths: 18, description: 'Has vocabulary of 10+ words' },
  { title: 'Pretend play', category: 'cognitive', ageInMonths: 18, description: 'Engages in pretend play' },
  { title: 'Runs', category: 'motor', ageInMonths: 24, description: 'Runs and climbs' },
  { title: 'Two-word phrases', category: 'language', ageInMonths: 24, description: 'Puts two words together' },
  { title: 'Parallel play', category: 'social', ageInMonths: 24, description: 'Plays alongside other children' },
];

export default function Milestones() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('motor');
  const [ageInMonths, setAgeInMonths] = useState('');

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedChildId) {
      fetchMilestones();
    }
  }, [selectedChildId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChildren = async () => {
    const { data, error } = await supabase
      .from('children')
      .select('id, name, date_of_birth')
      .eq('user_id', user?.id);

    if (error) {
      toast.error('Failed to load children');
    } else if (data && data.length > 0) {
      setChildren(data);
      setSelectedChildId(data[0].id);
    }
    setLoading(false);
  };

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('child_id', selectedChildId)
      .order('age_in_months', { ascending: true });

    if (error) {
      toast.error('Failed to load milestones');
    } else {
      setMilestones((data || []).map(m => ({
        ...m,
        category: m.category as 'motor' | 'cognitive' | 'social' | 'language',
        achieved_date: m.achieved_date || null,
      })));
    }
  };

  const initializeDefaultMilestones = async () => {
    if (!user || !selectedChildId) return;

    setIsSaving(true);
    
    const milestonesToInsert = defaultMilestones.map((m) => ({
      user_id: user.id,
      child_id: selectedChildId,
      title: m.title,
      description: m.description,
      category: m.category,
      age_in_months: m.ageInMonths,
      is_achieved: false,
    }));

    const { error } = await supabase.from('milestones').insert(milestonesToInsert);

    if (error) {
      toast.error('Failed to add milestones');
    } else {
      toast.success('Milestones added!');
      fetchMilestones();
    }

    setIsSaving(false);
  };

  const handleToggleMilestone = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('milestones')
      .update({
        is_achieved: !currentStatus,
        achieved_date: !currentStatus ? format(new Date(), 'yyyy-MM-dd') : null,
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update milestone');
    } else {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, is_achieved: !currentStatus, achieved_date: !currentStatus ? format(new Date(), 'yyyy-MM-dd') : null }
            : m
        )
      );
    }
  };

  const handleAddMilestone = async () => {
    if (!title || !ageInMonths || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from('milestones').insert({
      user_id: user?.id,
      child_id: selectedChildId,
      title,
      description: description || null,
      category,
      age_in_months: parseInt(ageInMonths),
      is_achieved: false,
    });

    if (error) {
      toast.error('Failed to add milestone');
    } else {
      toast.success('Milestone added!');
      setIsDialogOpen(false);
      resetForm();
      fetchMilestones();
    }

    setIsSaving(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('motor');
    setAgeInMonths('');
  };

  const filteredMilestones = activeCategory === 'all'
    ? milestones
    : milestones.filter((m) => m.category === activeCategory);

  const achievedCount = milestones.filter((m) => m.is_achieved).length;
  const progressPercent = milestones.length > 0 ? (achievedCount / milestones.length) * 100 : 0;

  if (loading) {
    return (
      <PageLayout title="Milestones" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (children.length === 0) {
    return (
      <PageLayout title="Milestones" showBack>
        <div className="px-4 py-12 text-center">
          <Baby className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No Children Added</h2>
          <p className="text-muted-foreground mb-6">
            Add a child to start tracking milestones.
          </p>
          <Button onClick={() => window.location.href = '/profile/children'}>
            Add Child
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Milestones" showBack>
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
                <DialogTitle>Add Milestone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Milestone Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. First steps"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the milestone..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motor">Motor</SelectItem>
                        <SelectItem value="cognitive">Cognitive</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="language">Language</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age (months)</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="e.g. 12"
                      value={ageInMonths}
                      onChange={(e) => setAgeInMonths(e.target.value)}
                    />
                  </div>
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
                    onClick={handleAddMilestone}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Adding...' : 'Add Milestone'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress */}
        {milestones.length > 0 && (
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">
                {achievedCount} of {milestones.length} achieved
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="flex-shrink-0"
              >
                <Icon className="w-4 h-4 mr-1" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Initialize Default Milestones */}
        {milestones.length === 0 && (
          <div className="bg-accent/50 rounded-xl p-6 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-2">
              Start Tracking Milestones
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add recommended developmental milestones based on WHO guidelines.
            </p>
            <Button onClick={initializeDefaultMilestones} disabled={isSaving}>
              {isSaving ? 'Adding...' : 'Add Recommended Milestones'}
            </Button>
          </div>
        )}

        {/* Milestones List */}
        <div className="space-y-3">
          {filteredMilestones.map((milestone) => {
            const config = categoryConfig[milestone.category];
            const CategoryIcon = config?.icon || Baby;

            return (
              <div
                key={milestone.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl bg-card shadow-soft border border-border transition-all",
                  milestone.is_achieved && "bg-success/5 border-success/20"
                )}
              >
                <button
                  onClick={() => handleToggleMilestone(milestone.id, milestone.is_achieved)}
                  className={cn(
                    "mt-0.5 transition-all",
                    milestone.is_achieved ? "text-success" : "text-muted-foreground hover:text-success"
                  )}
                >
                  {milestone.is_achieved ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryIcon className={cn("w-4 h-4", config?.color || 'text-primary')} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {milestone.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {milestone.age_in_months} months
                    </span>
                  </div>
                  <h4 className={cn(
                    "font-semibold text-foreground",
                    milestone.is_achieved && "line-through opacity-70"
                  )}>
                    {milestone.title}
                  </h4>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {milestone.description}
                    </p>
                  )}
                  {milestone.is_achieved && milestone.achieved_date && (
                    <p className="text-xs text-success mt-1">
                      Achieved on {format(new Date(milestone.achieved_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
