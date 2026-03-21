import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, Download, Loader2, Trash2, Bell, Calendar, Pill, Syringe } from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  due_date: string;
  due_time: string | null;
  is_completed: boolean;
  is_recurring: boolean;
  recurring_pattern: string | null;
  client_name?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  vaccination: Syringe,
  appointment: Calendar,
  medication: Pill,
  checkup: Bell,
};

export default function AdminReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    filterReminders();
  }, [searchQuery, typeFilter, statusFilter, reminders]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));

      const remindersWithNames = (data || []).map(r => ({
        ...r,
        client_name: profileMap.get(r.user_id) || 'Unknown',
      }));

      setReminders(remindersWithNames);
      setFilteredReminders(remindersWithNames);
    } catch (error) {
      toast.error('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReminders = () => {
    let filtered = [...reminders];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    if (statusFilter === 'completed') {
      filtered = filtered.filter(r => r.is_completed);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(r => !r.is_completed);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.client_name?.toLowerCase().includes(query)
      );
    }

    setFilteredReminders(filtered);
  };

  const toggleReminderStatus = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: !reminder.is_completed })
        .eq('id', reminder.id);

      if (error) throw error;

      setReminders(prev =>
        prev.map(r =>
          r.id === reminder.id ? { ...r, is_completed: !r.is_completed } : r
        )
      );

      toast.success(reminder.is_completed ? 'Marked as pending' : 'Marked as completed');
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const deleteReminder = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== deleteId));
      toast.success('Reminder deleted');
    } catch (error) {
      toast.error('Failed to delete reminder');
    } finally {
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    const exportData = filteredReminders.map(r => ({
      client: r.client_name,
      title: r.title,
      description: r.description || '',
      type: r.type,
      date: format(new Date(r.due_date), 'yyyy-MM-dd'),
      time: r.due_time || '',
      status: r.is_completed ? 'Completed' : 'Pending',
      recurring: r.is_recurring ? r.recurring_pattern : 'No',
    }));

    exportToCSV(exportData, 'reminders', {
      client: 'Client',
      title: 'Title',
      description: 'Description',
      type: 'Type',
      date: 'Due Date',
      time: 'Time',
      status: 'Status',
      recurring: 'Recurring',
    });

    toast.success('Reminders exported');
  };

  return (
    <AdminLayout
      title="Reminders Management"
      description="View and manage all client reminders"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>All Reminders ({filteredReminders.length})</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="vaccination">Vaccination</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="medication">Medication</SelectItem>
                <SelectItem value="checkup">Checkup</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReminders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReminders.map((reminder) => {
                  const TypeIcon = typeIcons[reminder.type] || Bell;
                  return (
                    <TableRow key={reminder.id}>
                      <TableCell className="font-medium">{reminder.client_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reminder.title}</p>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {reminder.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="capitalize">{reminder.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{format(new Date(reminder.due_date), 'MMM d, yyyy')}</p>
                          {reminder.due_time && (
                            <p className="text-sm text-muted-foreground">{reminder.due_time}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          reminder.is_completed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {reminder.is_completed ? 'Completed' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={reminder.is_completed ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => toggleReminderStatus(reminder)}
                          >
                            {reminder.is_completed ? 'Pending' : 'Complete'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(reminder.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No reminders match your filters'
                : 'No reminders created yet'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteReminder} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
