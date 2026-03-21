import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Baby, Trash2, Check, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Child {
  id: string;
  user_id: string;
  name: string;
  date_of_birth: string;
  gender: string | null;
}

export default function ManageChildren() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newChild, setNewChild] = useState({
    name: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | '',
  });

  useEffect(() => {
    fetchChildren();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChildren = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load children');
    } else {
      setChildren(data || []);
    }
    setIsLoading(false);
  };

  const handleAddChild = async () => {
    if (!newChild.name.trim() || !newChild.dateOfBirth) {
      toast.error('Please fill in name and date of birth');
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from('children')
      .insert({
        user_id: user?.id,
        name: newChild.name.trim(),
        date_of_birth: newChild.dateOfBirth,
        gender: newChild.gender || null,
      });

    if (error) {
      toast.error('Failed to add child');
    } else {
      toast.success('Child added successfully!');
      setNewChild({ name: '', dateOfBirth: '', gender: '' });
      setIsAddOpen(false);
      fetchChildren();
    }

    setIsSaving(false);
  };

  const openEdit = (child: Child) => {
    setEditingChild(child);
    setIsEditOpen(true);
  };

  const handleEditChild = async () => {
    if (!editingChild || !editingChild.name.trim() || !editingChild.date_of_birth) {
      toast.error('Please fill in name and date of birth');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('children')
      .update({
        name: editingChild.name.trim(),
        date_of_birth: editingChild.date_of_birth,
        gender: editingChild.gender || null,
      })
      .eq('id', editingChild.id);

    if (error) {
      toast.error('Failed to update child');
    } else {
      toast.success('Child updated!');
      setIsEditOpen(false);
      setEditingChild(null);
      fetchChildren();
    }
    setIsSaving(false);
  };

  const handleDeleteChild = async (id: string) => {
    const { error } = await supabase.from('children').delete().eq('id', id);

    if (error) {
      toast.error('Failed to remove child');
    } else {
      toast.success('Child removed');
      setChildren(children.filter((c) => c.id !== id));
    }
  };

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} old`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} old`;
  };

  if (isLoading) {
    return (
      <PageLayout title="Manage Children" showBack>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Manage Children" showBack>
      <div className="px-4 py-6 space-y-4">
        {children.length === 0 ? (
          <div className="text-center py-12">
            <Baby className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No children added yet</h3>
            <p className="text-muted-foreground mb-6">Add your child's information to track their health milestones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div key={child.id} className="bg-card rounded-xl p-4 shadow-soft border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent rounded-full">
                    <Baby className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{child.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {calculateAge(child.date_of_birth)}
                      {child.gender && ` • ${child.gender === 'male' ? 'Boy' : 'Girl'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(child)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteChild(child.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg"><Plus className="w-5 h-5 mr-2" />Add Child</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Child</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="childName">Child's Name</Label>
                <Input id="childName" value={newChild.name} onChange={(e) => setNewChild({ ...newChild, name: e.target.value })} placeholder="Enter name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={newChild.dateOfBirth} onChange={(e) => setNewChild({ ...newChild, dateOfBirth: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender (Optional)</Label>
                <Select value={newChild.gender} onValueChange={(val) => setNewChild({ ...newChild, gender: val as 'male' | 'female' })}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Boy</SelectItem>
                    <SelectItem value="female">Girl</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddChild} className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}Add Child
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Child</DialogTitle></DialogHeader>
            {editingChild && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Child's Name</Label>
                  <Input
                    id="editName"
                    value={editingChild.name}
                    onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDob">Date of Birth</Label>
                  <Input
                    id="editDob"
                    type="date"
                    value={editingChild.date_of_birth}
                    onChange={(e) => setEditingChild({ ...editingChild, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender (Optional)</Label>
                  <Select
                    value={editingChild.gender ?? ''}
                    onValueChange={(val) => setEditingChild({ ...editingChild, gender: val || null })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Boy</SelectItem>
                      <SelectItem value="female">Girl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleEditChild} className="w-full" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
