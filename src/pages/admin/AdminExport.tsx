import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

const exportOptions = [
  { id: 'profiles', label: 'Client Profiles', description: 'All registered mothers and their details' },
  { id: 'children', label: 'Children Records', description: 'All children linked to clients' },
  { id: 'reminders', label: 'Reminders', description: 'All reminders and their status' },
  { id: 'vaccinations', label: 'Vaccinations', description: 'Vaccination records and completion status' },
  { id: 'milestones', label: 'Milestones', description: 'Child development milestones' },
  { id: 'growth_logs', label: 'Growth Logs', description: 'Weight, height, and head circumference logs' },
];

export default function AdminExport() {
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const toggleExport = (id: string) => {
    setSelectedExports(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedExports(exportOptions.map(o => o.id));
  };

  const deselectAll = () => {
    setSelectedExports([]);
  };

  const handleExport = async () => {
    if (selectedExports.length === 0) {
      toast.error('Please select at least one data type to export');
      return;
    }

    setIsExporting(true);

    try {
      for (const exportType of selectedExports) {
        await exportDataType(exportType);
      }
      toast.success(`Successfully exported ${selectedExports.length} file(s)`);
    } catch (error) {
      toast.error('Failed to export some data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportDataType = async (type: string) => {
    switch (type) {
      case 'profiles': {
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
          exportToCSV(
            data.map(p => ({
              name: p.name,
              email: p.email || '',
              phone: p.phone || '',
              pregnancy_stage: p.pregnancy_stage || '',
              pregnancy_week: p.pregnancy_week || '',
              location: p.location || '',
              language: p.language || '',
              is_onboarded: p.is_onboarded ? 'Yes' : 'No',
              created_at: format(new Date(p.created_at), 'yyyy-MM-dd'),
            })),
            'client-profiles',
            {
              name: 'Name',
              email: 'Email',
              phone: 'Phone',
              pregnancy_stage: 'Pregnancy Stage',
              pregnancy_week: 'Pregnancy Week',
              location: 'Location',
              language: 'Language',
              is_onboarded: 'Onboarded',
              created_at: 'Registered Date',
            }
          );
        }
        break;
      }

      case 'children': {
        const { data: children } = await supabase.from('children').select('*');
        const { data: profiles } = await supabase.from('profiles').select('user_id, name');
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));

        if (children) {
          exportToCSV(
            children.map(c => ({
              parent: profileMap.get(c.user_id) || 'Unknown',
              name: c.name,
              date_of_birth: c.date_of_birth,
              gender: c.gender || '',
              created_at: format(new Date(c.created_at), 'yyyy-MM-dd'),
            })),
            'children-records',
            {
              parent: 'Parent',
              name: 'Child Name',
              date_of_birth: 'Date of Birth',
              gender: 'Gender',
              created_at: 'Added Date',
            }
          );
        }
        break;
      }

      case 'reminders': {
        const { data: reminders } = await supabase.from('reminders').select('*');
        const { data: profiles } = await supabase.from('profiles').select('user_id, name');
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));

        if (reminders) {
          exportToCSV(
            reminders.map(r => ({
              client: profileMap.get(r.user_id) || 'Unknown',
              title: r.title,
              description: r.description || '',
              type: r.type,
              due_date: r.due_date,
              due_time: r.due_time || '',
              is_completed: r.is_completed ? 'Yes' : 'No',
              is_recurring: r.is_recurring ? 'Yes' : 'No',
              recurring_pattern: r.recurring_pattern || '',
            })),
            'reminders',
            {
              client: 'Client',
              title: 'Title',
              description: 'Description',
              type: 'Type',
              due_date: 'Due Date',
              due_time: 'Due Time',
              is_completed: 'Completed',
              is_recurring: 'Recurring',
              recurring_pattern: 'Pattern',
            }
          );
        }
        break;
      }

      case 'vaccinations': {
        const { data: vaccinations } = await supabase.from('vaccinations').select('*');
        const { data: profiles } = await supabase.from('profiles').select('user_id, name');
        const { data: children } = await supabase.from('children').select('id, name');
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));
        const childMap = new Map(children?.map(c => [c.id, c.name]));

        if (vaccinations) {
          exportToCSV(
            vaccinations.map(v => ({
              client: profileMap.get(v.user_id) || 'Unknown',
              child: v.child_id ? childMap.get(v.child_id) || 'Unknown' : '',
              name: v.name,
              description: v.description || '',
              age_in_weeks: v.age_in_weeks,
              is_completed: v.is_completed ? 'Yes' : 'No',
              completed_date: v.completed_date || '',
            })),
            'vaccinations',
            {
              client: 'Client',
              child: 'Child',
              name: 'Vaccine Name',
              description: 'Description',
              age_in_weeks: 'Recommended Age (weeks)',
              is_completed: 'Completed',
              completed_date: 'Completed Date',
            }
          );
        }
        break;
      }

      case 'milestones': {
        const { data: milestones } = await supabase.from('milestones').select('*');
        const { data: profiles } = await supabase.from('profiles').select('user_id, name');
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));

        if (milestones) {
          exportToCSV(
            milestones.map(m => ({
              client: profileMap.get(m.user_id) || 'Unknown',
              title: m.title,
              description: m.description || '',
              category: m.category,
              age_in_months: m.age_in_months,
              is_achieved: m.is_achieved ? 'Yes' : 'No',
              achieved_date: m.achieved_date || '',
            })),
            'milestones',
            {
              client: 'Client',
              title: 'Milestone',
              description: 'Description',
              category: 'Category',
              age_in_months: 'Age (months)',
              is_achieved: 'Achieved',
              achieved_date: 'Achieved Date',
            }
          );
        }
        break;
      }

      case 'growth_logs': {
        const { data: logs } = await supabase.from('growth_logs').select('*');
        const { data: children } = await supabase.from('children').select('id, name, user_id');
        const { data: profiles } = await supabase.from('profiles').select('user_id, name');
        const childMap = new Map(children?.map(c => [c.id, { name: c.name, user_id: c.user_id }]));
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));

        if (logs) {
          exportToCSV(
            logs.map(l => {
              const child = childMap.get(l.child_id);
              return {
                parent: child ? profileMap.get(child.user_id) || 'Unknown' : 'Unknown',
                child: child?.name || 'Unknown',
                date: l.date,
                weight_kg: l.weight_kg || '',
                height_cm: l.height_cm || '',
                head_circumference_cm: l.head_circumference_cm || '',
                notes: l.notes || '',
              };
            }),
            'growth-logs',
            {
              parent: 'Parent',
              child: 'Child',
              date: 'Date',
              weight_kg: 'Weight (kg)',
              height_cm: 'Height (cm)',
              head_circumference_cm: 'Head Circumference (cm)',
              notes: 'Notes',
            }
          );
        }
        break;
      }
    }
  };

  return (
    <AdminLayout
      title="Export Data"
      description="Download program data in CSV format"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Select Data to Export
              </CardTitle>
              <CardDescription>
                Choose which data types you want to download as CSV files
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {exportOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedExports.includes(option.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleExport(option.id)}
              >
                <Checkbox
                  checked={selectedExports.includes(option.id)}
                  onCheckedChange={() => toggleExport(option.id)}
                />
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedExports.length} of {exportOptions.length} selected
            </p>
            <Button
              onClick={handleExport}
              disabled={selectedExports.length === 0 || isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
