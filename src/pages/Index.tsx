import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile, isLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  if (isLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - go to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin users always go to the admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Logged in but not onboarded - go to onboarding
  if (!profile?.is_onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // Regular user - go to patient dashboard
  return <Navigate to="/dashboard" replace />;
};

export default Index;
