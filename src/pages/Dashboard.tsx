import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { QuickActionCard } from '@/components/cards/QuickActionCard';
import { ReminderCard } from '@/components/cards/ReminderCard';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { MilestoneCard } from '@/components/cards/MilestoneCard';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Reminder, Milestone, ReminderType, Article, ArticleCategory, ContentType } from '@/types';
import {
  Syringe, Calendar, Pill, TrendingUp, MapPin, MessageCircle,
  ChevronRight, PlayCircle, BookOpen, Clock, Loader2, Baby, Droplets, Moon, Heart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

function toArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: row.summary as string,
    content: row.content as string,
    category: row.category as ArticleCategory,
    contentType: row.content_type as ContentType,
    imageUrl: row.image_url as string | undefined,
    videoUrl: row.video_url as string | undefined,
    externalUrl: row.external_url as string | undefined,
    source: row.source as string | undefined,
    readTime: row.read_time as number,
    duration: row.duration as number | undefined,
    createdAt: row.created_at as string,
  };
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: articles = [] } = useQuery({
    queryKey: ['dashboard_articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []).map(toArticle);
    },
  });

  useEffect(() => {
    if (user) {
      Promise.all([fetchReminders(), fetchMilestones()]).finally(() => setLoading(false));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setReminders((data || []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        description: r.description || undefined,
        type: r.type as ReminderType,
        dueDate: r.due_date,
        dueTime: r.due_time || undefined,
        isCompleted: r.is_completed || false,
        isRecurring: r.is_recurring || false,
        recurringPattern: r.recurring_pattern as 'daily' | 'weekly' | 'monthly' | undefined,
      })));
    } catch {
      toast.error('Failed to load reminders');
    }
  };

  const fetchMilestones = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('age_in_months', { ascending: true })
        .limit(5);

      if (error) throw error;
      setMilestones((data || []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        ageInMonths: m.age_in_months,
        category: m.category as 'motor' | 'cognitive' | 'social' | 'language',
        isAchieved: m.is_achieved || false,
        achievedDate: m.achieved_date || undefined,
      })));
    } catch {
      toast.error('Failed to load milestones');
    }
  };

  const handleCompleteReminder = async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: !reminder.isCompleted })
        .eq('id', id);
      if (error) throw error;
      setReminders(reminders.map((r) => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
      toast.success(reminder.isCompleted ? 'Unmarked' : 'Completed!');
    } catch {
      toast.error('Failed to update reminder');
    }
  };

  const handleToggleMilestone = async (id: string) => {
    const milestone = milestones.find((m) => m.id === id);
    if (!milestone) return;
    const newAchieved = !milestone.isAchieved;
    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          is_achieved: newAchieved,
          achieved_date: newAchieved ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', id);
      if (error) throw error;
      setMilestones(milestones.map((m) => m.id === id ? { ...m, isAchieved: newAchieved } : m));
      toast.success(newAchieved ? 'Milestone achieved! 🎉' : 'Unmarked');
    } catch {
      toast.error('Failed to update milestone');
    }
  };

  const featuredArticle = articles[0];
  const recentArticles = articles.slice(1, 5);
  const isVideo = featuredArticle?.contentType === 'video';
  const isCourse = featuredArticle?.contentType === 'course';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.dashboard.goodMorning;
    if (hour < 17) return t.dashboard.goodAfternoon;
    return t.dashboard.goodEvening;
  };

  return (
    <PageLayout>
      <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
        {/* Greeting */}
        <div className="gradient-primary rounded-2xl p-5 text-primary-foreground shadow-glow relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold font-display mb-1 tracking-tight">
              {getGreeting()}, {profile?.name || t.header.defaultName}! 💕
            </h2>
            <p className="text-sm opacity-90 font-medium">
              {profile?.pregnancy_stage === 'pregnant'
                ? t.dashboard.weekOf.replace('{week}', String(profile.pregnancy_week || '?'))
                : t.dashboard.dailySummary}
            </p>
          </div>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-4 -right-2 w-16 h-16 rounded-full bg-primary-foreground/5" />
        </div>

        {/* Quick Actions */}
        <section>
          <h3 className="text-sm font-bold font-display text-foreground mb-3 tracking-tight">{t.dashboard.quickActions}</h3>
          <div className="grid grid-cols-3 gap-2.5">
            <QuickActionCard icon={Syringe} title={t.dashboard.vaccinations} to="/reminders/vaccinations" variant="primary" />
            <QuickActionCard icon={Calendar} title={t.dashboard.appointments} to="/reminders/appointments" variant="success" />
            <QuickActionCard icon={Pill} title={t.dashboard.medications} to="/reminders/medications" variant="warning" />
            <QuickActionCard icon={TrendingUp} title={t.dashboard.growthLog} to="/growth" variant="default" />
            <QuickActionCard icon={Baby} title="Kick Counter" to="/kick-counter" variant="primary" />
            <QuickActionCard icon={Droplets} title="Feeding" to="/breastfeeding" variant="success" />
            <QuickActionCard icon={Moon} title="Sleep & Diaper" to="/sleep-diaper" variant="warning" />
            <QuickActionCard icon={Heart} title="Health Journal" to="/health-journal" variant="default" />
            <QuickActionCard icon={MapPin} title={t.dashboard.nearbyCare} to="/facilities" variant="default" />
            <QuickActionCard icon={MessageCircle} title={t.dashboard.community} to="/community" variant="default" />
          </div>
        </section>

        {/* Upcoming Reminders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold font-display text-foreground tracking-tight">{t.dashboard.upcomingReminders}</h3>
            <Link to="/reminders" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
              {t.dashboard.viewAll} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : reminders.length > 0 ? (
              reminders.slice(0, 3).map((reminder) => (
                <ReminderCard key={reminder.id} reminder={reminder} onComplete={handleCompleteReminder} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">{t.dashboard.noReminders}</p>
                <Link to="/reminders" className="text-xs text-primary font-semibold mt-2 inline-block hover:underline">
                  Add your first reminder →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Milestones */}
        {profile?.pregnancy_stage === 'postpartum' && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-display text-foreground tracking-tight">{t.dashboard.babyMilestones}</h3>
              <Link to="/milestones" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
                {t.dashboard.viewAll} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : milestones.length > 0 ? (
                milestones.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} onToggle={handleToggleMilestone} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No milestones tracked yet</p>
                  <Link to="/milestones" className="text-xs text-primary font-semibold mt-2 inline-block hover:underline">
                    Start tracking milestones →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Article */}
        {featuredArticle && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold font-display text-foreground tracking-tight">{t.dashboard.featuredArticle}</h3>
            <Link to="/education" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
              {t.dashboard.explore} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <Link
            to={`/education/${featuredArticle.id}`}
            className="flex gap-3 rounded-2xl bg-card border border-border/40 overflow-hidden hover:shadow-medium transition-all group p-3"
          >
            <div className="relative w-36 sm:w-44 aspect-video rounded-xl overflow-hidden flex-shrink-0">
              <img src={featuredArticle.imageUrl} alt={featuredArticle.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
                  <PlayCircle className="w-8 h-8 text-primary-foreground drop-shadow-lg" />
                </div>
              )}
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-foreground/75 text-primary-foreground text-[10px] font-semibold">
                {isVideo || isCourse ? `${featuredArticle.duration}:00` : `${featuredArticle.readTime} min`}
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <BookOpen className="w-3 h-3" />
                {featuredArticle.contentType} · {featuredArticle.category.replace('-', ' ')}
              </span>
              <h4 className="font-bold text-foreground text-sm line-clamp-2 leading-snug mb-1">{featuredArticle.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{featuredArticle.summary}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground font-medium">
                <Clock className="w-3 h-3" />
                <span>{isVideo || isCourse ? t.dashboard.minWatch.replace('{min}', String(featuredArticle.duration)) : t.dashboard.minRead.replace('{min}', String(featuredArticle.readTime))}</span>
                {featuredArticle.source && (<><span>·</span><span>{featuredArticle.source}</span></>)}
              </div>
            </div>
          </Link>
        </section>
        )}

        {/* Recent Articles */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold font-display text-foreground tracking-tight">{t.dashboard.keepLearning}</h3>
            <Link to="/education" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
              {t.dashboard.seeMore} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {recentArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
