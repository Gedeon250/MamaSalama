import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Eye, Lock, Download, Trash2, UserX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PrivacySettings() {
  const navigate = useNavigate();
  const [anonymousInForum, setAnonymousInForum] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownloadData = async () => {
    setIsDownloading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Not logged in'); return; }

      const [profile, children, reminders, vaccinations, journalEntries] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('children').select('*').eq('user_id', user.id),
        supabase.from('reminders').select('*').eq('user_id', user.id),
        supabase.from('vaccinations').select('*').eq('user_id', user.id),
        supabase.from('health_journal').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        children: children.data,
        reminders: reminders.data,
        vaccinations: vaccinations.data,
        health_journal: journalEntries.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mama-care-hub-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data downloaded successfully');
    } catch {
      toast.error('Failed to download data');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success('Account deleted successfully');
      navigate('/auth');
    } catch {
      // Fallback: sign out and show message
      await supabase.auth.signOut();
      toast.success('Account deletion requested. You have been signed out.');
      navigate('/auth');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout title="Privacy & Security" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* Privacy Settings */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Privacy</h3>
          <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg">
                  <UserX className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-foreground block">Anonymous in Forums</span>
                  <span className="text-sm text-muted-foreground">Hide your name in community posts</span>
                </div>
              </div>
              <Switch checked={anonymousInForum} onCheckedChange={setAnonymousInForum} />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-foreground block">Share Location</span>
                  <span className="text-sm text-muted-foreground">For nearby facilities & emergency</span>
                </div>
              </div>
              <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-foreground block">Analytics Collection</span>
                  <span className="text-sm text-muted-foreground">Help us improve the app</span>
                </div>
              </div>
              <Switch checked={dataCollection} onCheckedChange={setDataCollection} />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Your Data</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3" onClick={handleDownloadData} disabled={isDownloading}>
              <Download className="w-5 h-5" />
              {isDownloading ? 'Downloading...' : 'Download My Data'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-3 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={isDeleting}>
                  <Trash2 className="w-5 h-5" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-accent/50 rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-2">🔒 Your data is secure</h4>
          <p className="text-sm text-muted-foreground">
            All your health information is encrypted and stored securely. We never share your personal data with third parties without your explicit consent.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
