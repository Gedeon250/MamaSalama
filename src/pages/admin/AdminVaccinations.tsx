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
import { Search, Download, Loader2, Syringe } from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

interface Vaccination {
  id: string;
  user_id: string;
  child_id: string | null;
  name: string;
  description: string | null;
  age_in_weeks: number;
  is_completed: boolean;
  completed_date: string | null;
  client_name?: string;
  child_name?: string;
}

export default function AdminVaccinations() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [filteredVaccinations, setFilteredVaccinations] = useState<Vaccination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVaccinations();
  }, []);

  useEffect(() => {
    filterVaccinations();
  }, [searchQuery, statusFilter, vaccinations]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVaccinations = async () => {
    try {
      const { data: vaccs, error } = await supabase
        .from('vaccinations')
        .select('*')
        .order('age_in_weeks', { ascending: true });

      if (error) throw error;

      // Get unique user_ids and child_ids
      const userIds = [...new Set(vaccs?.map(v => v.user_id) || [])];
      const childIds = [...new Set(vaccs?.filter(v => v.child_id).map(v => v.child_id) || [])];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      // Fetch children
      const { data: children } = await supabase
        .from('children')
        .select('id, name')
        .in('id', childIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));
      const childMap = new Map(children?.map(c => [c.id, c.name]));

      const vaccinationsWithNames = (vaccs || []).map(v => ({
        ...v,
        client_name: profileMap.get(v.user_id) || 'Unknown',
        child_name: v.child_id ? childMap.get(v.child_id) || 'Unknown' : undefined,
      }));

      setVaccinations(vaccinationsWithNames);
      setFilteredVaccinations(vaccinationsWithNames);
    } catch (error) {
      toast.error('Failed to load vaccinations');
    } finally {
      setIsLoading(false);
    }
  };

  const filterVaccinations = () => {
    let filtered = [...vaccinations];

    if (statusFilter === 'completed') {
      filtered = filtered.filter(v => v.is_completed);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(v => !v.is_completed);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.client_name?.toLowerCase().includes(query) ||
        v.child_name?.toLowerCase().includes(query)
      );
    }

    setFilteredVaccinations(filtered);
  };

  const toggleVaccinationStatus = async (vaccination: Vaccination) => {
    try {
      const newCompleted = !vaccination.is_completed;
      const { error } = await supabase
        .from('vaccinations')
        .update({
          is_completed: newCompleted,
          completed_date: newCompleted ? format(new Date(), 'yyyy-MM-dd') : null,
        })
        .eq('id', vaccination.id);

      if (error) throw error;

      setVaccinations(prev =>
        prev.map(v =>
          v.id === vaccination.id
            ? {
                ...v,
                is_completed: newCompleted,
                completed_date: newCompleted ? format(new Date(), 'yyyy-MM-dd') : null,
              }
            : v
        )
      );

      toast.success(vaccination.is_completed ? 'Marked as pending' : 'Marked as completed');
    } catch (error) {
      toast.error('Failed to update vaccination');
    }
  };

  const handleExport = () => {
    const exportData = filteredVaccinations.map(v => ({
      client: v.client_name,
      child: v.child_name || 'N/A',
      vaccine: v.name,
      description: v.description || '',
      age_weeks: v.age_in_weeks,
      status: v.is_completed ? 'Completed' : 'Pending',
      completed_date: v.completed_date || '',
    }));

    exportToCSV(exportData, 'vaccinations', {
      client: 'Client',
      child: 'Child',
      vaccine: 'Vaccine Name',
      description: 'Description',
      age_weeks: 'Age (weeks)',
      status: 'Status',
      completed_date: 'Completed Date',
    });

    toast.success('Vaccinations exported');
  };

  // Calculate stats
  const totalVacc = vaccinations.length;
  const completedVacc = vaccinations.filter(v => v.is_completed).length;
  const completionRate = totalVacc > 0 ? Math.round((completedVacc / totalVacc) * 100) : 0;

  return (
    <AdminLayout
      title="Vaccination Tracking"
      description="Monitor and manage child vaccination schedules"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Syringe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vaccinations</p>
                <p className="text-2xl font-bold">{totalVacc}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Syringe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedVacc}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Syringe className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>All Vaccinations ({filteredVaccinations.length})</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
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
          ) : filteredVaccinations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client / Child</TableHead>
                  <TableHead>Vaccine</TableHead>
                  <TableHead>Recommended Age</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVaccinations.map((vaccination) => (
                  <TableRow key={vaccination.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vaccination.client_name}</p>
                        {vaccination.child_name && (
                          <p className="text-sm text-muted-foreground">
                            Child: {vaccination.child_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vaccination.name}</p>
                        {vaccination.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {vaccination.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {vaccination.age_in_weeks} weeks
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        vaccination.is_completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {vaccination.is_completed ? 'Completed' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {vaccination.completed_date
                        ? format(new Date(vaccination.completed_date), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={vaccination.is_completed ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => toggleVaccinationStatus(vaccination)}
                      >
                        {vaccination.is_completed ? 'Mark Pending' : 'Mark Complete'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No vaccinations match your filters'
                : 'No vaccinations recorded yet'}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
