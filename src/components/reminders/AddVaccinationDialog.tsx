import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AddVaccinationDialogProps {
  onSuccess: () => void;
}

interface Child {
  id: string;
  name: string;
}

export function AddVaccinationDialog({ onSuccess }: AddVaccinationDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ageInWeeks, setAgeInWeeks] = useState('');
  const [childId, setChildId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChildren = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('children')
      .select('id, name')
      .eq('user_id', user.id);
    if (data) setChildren(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('vaccinations').insert({
        user_id: user.id,
        child_id: childId || null,
        name,
        description: description || null,
        age_in_weeks: parseInt(ageInWeeks) || 0,
        is_completed: false,
      });

      if (error) throw error;

      toast.success('Vaccination added successfully!');
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to add vaccination');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAgeInWeeks('');
    setChildId('');
    setLocation('');
    setShowMap(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="soft">
          <Plus className="w-4 h-4 mr-1" />
          Add Vaccine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vaccination</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vaccine Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., BCG, Polio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {children.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="child">For Child</Label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="age">Due at Age (weeks)</Label>
            <Input
              id="age"
              type="number"
              min="0"
              value={ageInWeeks}
              onChange={(e) => setAgeInWeeks(e.target.value)}
              placeholder="e.g., 6 for 6 weeks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Clinic/Hospital Location</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter clinic address..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowMap(!showMap)}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showMap && (
            <div className="rounded-lg overflow-hidden border border-border">
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(location || 'Kenya hospitals')}`}
              />
              <p className="text-xs text-muted-foreground p-2 bg-muted">
                Search for clinics offering vaccinations
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name} className="flex-1">
              {loading ? 'Adding...' : 'Add Vaccination'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
