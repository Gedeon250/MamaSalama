import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<string>('admin');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile info for each admin
      const userIds = roles?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const adminsWithInfo = (roles || []).map(r => ({
        ...r,
        user_name: profileMap.get(r.user_id)?.name || 'Unknown',
        user_email: profileMap.get(r.user_id)?.email || 'Unknown',
      }));

      setAdmins(adminsWithInfo);
    } catch (error) {
      toast.error('Failed to load admin users');
    } finally {
      setIsLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsAdding(true);

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', newAdminEmail)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast.error('No user found with that email address');
        setIsAdding(false);
        return;
      }

      // Check if already has this role
      const existingRole = admins.find(a => a.user_id === profile.user_id && a.role === newAdminRole);
      if (existingRole) {
        toast.error('User already has this role');
        setIsAdding(false);
        return;
      }

      // Add role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.user_id,
          role: newAdminRole as 'admin' | 'moderator' | 'user',
        });

      if (insertError) throw insertError;

      toast.success('Admin role added successfully');
      setNewAdminEmail('');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to add admin role');
    } finally {
      setIsAdding(false);
    }
  };

  const removeAdmin = async () => {
    if (!deleteId) return;

    // Prevent removing the last admin
    const adminCount = admins.filter(a => a.role === 'admin').length;
    const targetRole = admins.find(a => a.id === deleteId)?.role;
    if (targetRole === 'admin' && adminCount <= 1) {
      toast.error('Cannot remove the last admin. Add another admin first.');
      setDeleteId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setAdmins(prev => prev.filter(a => a.id !== deleteId));
      toast.success('Admin role removed');
    } catch (error) {
      toast.error('Failed to remove admin role');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout
      title="Admin Settings"
      description="Manage admin users and system settings"
    >
      {/* Add New Admin */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New Admin
          </CardTitle>
          <CardDescription>
            Grant admin or moderator access to existing users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter user's email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Label>Role</Label>
              <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addAdmin} disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add Role'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin Users
          </CardTitle>
          <CardDescription>
            Users with administrative access to the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : admins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.user_name}</TableCell>
                    <TableCell>{admin.user_email}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${
                        admin.role === 'admin'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {admin.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {admin.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(admin.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No admin users configured yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user's admin privileges? They will no longer have access to the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeAdmin} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
