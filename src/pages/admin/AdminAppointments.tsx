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
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, Loader2, CheckCircle, Clock } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string | null;
  is_completed: boolean;
  client_name?: string;
  client_email?: string;
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [searchQuery, statusFilter, appointments]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAppointments = async () => {
    try {
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('type', 'appointment')
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Fetch client info for each appointment
      const userIds = [...new Set(reminders?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const appointmentsWithClients = (reminders || []).map(r => ({
        ...r,
        client_name: profileMap.get(r.user_id)?.name || 'Unknown',
        client_email: profileMap.get(r.user_id)?.email || null,
      }));

      setAppointments(appointmentsWithClients);
      setFilteredAppointments(appointmentsWithClients);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    const today = startOfDay(new Date());

    // Apply status filter
    if (statusFilter === 'completed') {
      filtered = filtered.filter(a => a.is_completed);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(a => !a.is_completed);
    } else if (statusFilter === 'upcoming') {
      filtered = filtered.filter(a => !a.is_completed && isAfter(new Date(a.due_date), today));
    } else if (statusFilter === 'overdue') {
      filtered = filtered.filter(a => !a.is_completed && isBefore(new Date(a.due_date), today));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.client_name?.toLowerCase().includes(query) ||
        a.client_email?.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  };

  const toggleAppointmentStatus = async (appointment: Appointment) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: !appointment.is_completed })
        .eq('id', appointment.id);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(a =>
          a.id === appointment.id ? { ...a, is_completed: !a.is_completed } : a
        )
      );

      toast.success(appointment.is_completed ? 'Marked as pending' : 'Marked as completed');
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const handleExport = () => {
    const exportData = filteredAppointments.map(a => ({
      client: a.client_name,
      email: a.client_email || '',
      title: a.title,
      description: a.description || '',
      date: format(new Date(a.due_date), 'yyyy-MM-dd'),
      time: a.due_time || '',
      status: a.is_completed ? 'Completed' : 'Pending',
    }));

    exportToCSV(exportData, 'appointments', {
      client: 'Client Name',
      email: 'Email',
      title: 'Appointment',
      description: 'Description',
      date: 'Date',
      time: 'Time',
      status: 'Status',
    });

    toast.success('Appointments exported');
  };

  const getStatusBadge = (appointment: Appointment) => {
    const today = startOfDay(new Date());
    const dueDate = new Date(appointment.due_date);

    if (appointment.is_completed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }

    if (isBefore(dueDate, today)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
          <Clock className="w-3 h-3" />
          Overdue
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
        <Clock className="w-3 h-3" />
        Upcoming
      </span>
    );
  };

  return (
    <AdminLayout
      title="Appointments"
      description="Manage client appointments and scheduled visits"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>All Appointments ({filteredAppointments.length})</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
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
          ) : filteredAppointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.client_name}</p>
                        <p className="text-sm text-muted-foreground">{appointment.client_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.title}</p>
                        {appointment.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {appointment.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(new Date(appointment.due_date), 'MMM d, yyyy')}</p>
                        {appointment.due_time && (
                          <p className="text-sm text-muted-foreground">{appointment.due_time}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(appointment)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={appointment.is_completed ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => toggleAppointmentStatus(appointment)}
                      >
                        {appointment.is_completed ? 'Mark Pending' : 'Mark Complete'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No appointments match your filters'
                : 'No appointments scheduled yet'}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
