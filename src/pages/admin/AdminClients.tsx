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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Edit, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pregnancy_stage: string | null;
  pregnancy_week: number | null;
  location: string | null;
  is_onboarded: boolean;
  created_at: string;
}

interface ClientDetails extends Client {
  children: Array<{
    id: string;
    name: string;
    date_of_birth: string;
    gender: string | null;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    type: string;
    due_date: string;
    is_completed: boolean;
  }>;
  vaccinations: Array<{
    id: string;
    name: string;
    is_completed: boolean;
    completed_date: string | null;
  }>;
}

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredClients(
        clients.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query) ||
          c.location?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredClients(clients);
    }
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const viewClientDetails = async (client: Client) => {
    try {
      // Fetch children
      const { data: children } = await supabase
        .from('children')
        .select('id, name, date_of_birth, gender')
        .eq('user_id', client.user_id);

      // Fetch reminders
      const { data: reminders } = await supabase
        .from('reminders')
        .select('id, title, type, due_date, is_completed')
        .eq('user_id', client.user_id)
        .order('due_date', { ascending: true })
        .limit(10);

      // Fetch vaccinations
      const { data: vaccinations } = await supabase
        .from('vaccinations')
        .select('id, name, is_completed, completed_date')
        .eq('user_id', client.user_id);

      setSelectedClient({
        ...client,
        children: children || [],
        reminders: reminders || [],
        vaccinations: vaccinations || [],
      });
      setIsViewDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load client details');
    }
  };

  const handleExport = () => {
    const exportData = filteredClients.map(c => ({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      pregnancy_stage: c.pregnancy_stage || '',
      pregnancy_week: c.pregnancy_week || '',
      location: c.location || '',
      onboarded: c.is_onboarded ? 'Yes' : 'No',
      registered: format(new Date(c.created_at), 'yyyy-MM-dd'),
    }));

    exportToCSV(exportData, 'clients', {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      pregnancy_stage: 'Stage',
      pregnancy_week: 'Week',
      location: 'Location',
      onboarded: 'Onboarded',
      registered: 'Registered Date',
    });

    toast.success('Client data exported');
  };

  const getStageLabel = (stage: string | null) => {
    switch (stage) {
      case 'trying': return 'Trying to Conceive';
      case 'pregnant': return 'Pregnant';
      case 'postpartum': return 'Postpartum';
      default: return 'Not set';
    }
  };

  return (
    <AdminLayout 
      title="Client Management" 
      description="View and manage all registered mothers"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>All Clients ({filteredClients.length})</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {client.email && <p>{client.email}</p>}
                        {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        {getStageLabel(client.pregnancy_stage)}
                      </span>
                    </TableCell>
                    <TableCell>{client.location || '-'}</TableCell>
                    <TableCell>{format(new Date(client.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewClientDetails(client)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No clients match your search' : 'No clients registered yet'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <p className="font-medium">{selectedClient.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{selectedClient.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phone</label>
                  <p className="font-medium">{selectedClient.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Location</label>
                  <p className="font-medium">{selectedClient.location || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Stage</label>
                  <p className="font-medium">{getStageLabel(selectedClient.pregnancy_stage)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Pregnancy Week</label>
                  <p className="font-medium">{selectedClient.pregnancy_week || '-'}</p>
                </div>
              </div>

              {/* Children */}
              {selectedClient.children.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Children</h4>
                  <div className="space-y-2">
                    {selectedClient.children.map(child => (
                      <div key={child.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span>{child.name}</span>
                        <span className="text-sm text-muted-foreground">
                          DOB: {format(new Date(child.date_of_birth), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Reminders */}
              {selectedClient.reminders.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recent Reminders</h4>
                  <div className="space-y-2">
                    {selectedClient.reminders.map(reminder => (
                      <div key={reminder.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{reminder.title}</p>
                          <p className="text-sm text-muted-foreground capitalize">{reminder.type}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            reminder.is_completed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {reminder.is_completed ? 'Completed' : 'Pending'}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vaccinations */}
              {selectedClient.vaccinations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Vaccinations</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedClient.vaccinations.map(vacc => (
                      <div key={vacc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="text-sm">{vacc.name}</span>
                        <span className={`w-3 h-3 rounded-full ${
                          vacc.is_completed ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
