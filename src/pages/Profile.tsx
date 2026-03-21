import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { User, Baby, MapPin, Globe, Bell, Shield, HelpCircle, LogOut, ChevronRight, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: vaccineCount = 0 } = useQuery({
    queryKey: ['profile_vaccine_count', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // vaccinations are linked to children, not directly to user_id
      // count all completed vaccinations across user's children
      const { data: children } = await supabase
        .from('children')
        .select('id')
        .eq('user_id', user!.id);
      if (!children || children.length === 0) return 0;
      const childIds = children.map(c => c.id);
      const { count } = await supabase
        .from('vaccinations')
        .select('*', { count: 'exact', head: true })
        .in('child_id', childIds)
        .eq('is_completed', true);
      return count ?? 0;
    },
  });

  const { data: milestoneCount = 0 } = useQuery({
    queryKey: ['profile_milestone_count', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from('milestones')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_achieved', true);
      return count ?? 0;
    },
  });

  const menuItems = [
    { icon: User, label: t.profile.editProfile, to: '/profile/edit' },
    { icon: Baby, label: t.profile.manageChildren, to: '/profile/children' },
    { icon: MapPin, label: t.profile.locationSettings, to: '/profile/location' },
    { icon: Globe, label: t.profile.language, to: '/settings/language' },
    { icon: Bell, label: t.profile.notifications, to: '/settings/notifications' },
    { icon: Shield, label: t.profile.privacy, to: '/settings/privacy' },
    { icon: HelpCircle, label: t.profile.helpSupport, to: '/help' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getStageLabel = () => {
    switch (profile?.pregnancy_stage) {
      case 'trying': return t.profile.tryingToConceive;
      case 'pregnant': return t.profile.weeksPregnant.replace('{weeks}', String(profile.pregnancy_week || '?'));
      case 'postpartum': return t.profile.mother;
      default: return '';
    }
  };

  return (
    <PageLayout title={t.profile.title} showProfile={false}>
      <div className="px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-bold">
                {profile?.name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>
            <Link to="/profile/edit" className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-soft">
              <Edit2 className="w-4 h-4" />
            </Link>
          </div>
          <h2 className="text-xl font-bold font-display text-foreground">{profile?.name || t.header.defaultName}</h2>
          <p className="text-muted-foreground">{getStageLabel()}</p>
          {profile?.location && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />{profile.location}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 text-center shadow-soft border border-border">
            <p className="text-2xl font-bold text-success">{vaccineCount}</p>
            <p className="text-xs text-muted-foreground">{t.profile.vaccinesDone}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-soft border border-border">
            <p className="text-2xl font-bold text-info">{milestoneCount}</p>
            <p className="text-xs text-muted-foreground">{t.profile.milestones}</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className={`flex items-center justify-between p-4 hover:bg-accent transition-colors ${index !== menuItems.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            );
          })}
        </div>

        <Button variant="outline" size="lg" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-2" />{t.profile.logOut}
        </Button>

        <p className="text-center text-xs text-muted-foreground">MamaSalama v1.0.0</p>
      </div>
    </PageLayout>
  );
}
