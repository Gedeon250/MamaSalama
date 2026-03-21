import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, Baby, Heart, Apple, Brain, Smile, PlayCircle, GraduationCap, FileText, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Article, ArticleCategory, ContentType } from '@/types';

const categories: { id: ArticleCategory | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All', icon: BookOpen },
  { id: 'prenatal', label: 'Prenatal', icon: Heart },
  { id: 'postnatal', label: 'Postnatal', icon: Baby },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'child-development', label: 'Development', icon: Brain },
  { id: 'mental-health', label: 'Mental Health', icon: Smile },
];

const contentTypes: { id: ContentType | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Types', icon: Filter },
  { id: 'article', label: 'Articles', icon: BookOpen },
  { id: 'video', label: 'Videos', icon: PlayCircle },
  { id: 'course', label: 'Courses', icon: GraduationCap },
  { id: 'lesson', label: 'Lessons', icon: FileText },
];

// Map DB row → Article shape used by components
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

export default function Education() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | 'all'>('all');
  const [activeContentType, setActiveContentType] = useState<ContentType | 'all'>('all');

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['education_articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toArticle);
    },
  });

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
    const matchesType = activeContentType === 'all' || article.contentType === activeContentType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const featuredContent =
    articles.find((a) => a.contentType === 'video' || a.contentType === 'course') || articles[0];

  const videoCount = articles.filter((a) => a.contentType === 'video').length;
  const courseCount = articles.filter((a) => a.contentType === 'course').length;
  const articleCount = articles.filter((a) => a.contentType === 'article').length;
  const lessonCount = articles.filter((a) => a.contentType === 'lesson').length;

  const isVideo = featuredContent?.contentType === 'video';
  const isCourse = featuredContent?.contentType === 'course';

  return (
    <PageLayout title="Health Library" showProfile={false}>
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search articles, videos, courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-card border-border/50 shadow-xs text-base"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { type: 'article' as ContentType, icon: BookOpen, count: articleCount, label: 'Articles' },
            { type: 'video' as ContentType, icon: PlayCircle, count: videoCount, label: 'Videos' },
            { type: 'course' as ContentType, icon: GraduationCap, count: courseCount, label: 'Courses' },
            { type: 'lesson' as ContentType, icon: FileText, count: lessonCount, label: 'Lessons' },
          ].map(({ type, icon: Icon, count, label }) => (
            <button
              key={type}
              onClick={() => setActiveContentType(activeContentType === type ? 'all' : type)}
              className={cn(
                'py-4 px-3 rounded-2xl text-center transition-all duration-200 border',
                activeContentType === type
                  ? 'gradient-primary text-primary-foreground border-transparent shadow-soft'
                  : 'bg-card border-border/40 hover:border-primary/20'
              )}
            >
              <Icon className="w-6 h-6 mx-auto mb-1.5" />
              <p className="text-xl font-bold leading-tight">{count}</p>
              <p className="text-[11px] font-medium opacity-80 mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Content Type Filter Clear */}
        {activeContentType !== 'all' && (
          <button
            onClick={() => setActiveContentType('all')}
            className="text-sm text-primary font-semibold hover:underline"
          >
            ✕ Clear: {contentTypes.find((t) => t.id === activeContentType)?.label}
          </button>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 text-sm font-semibold',
                  isActive
                    ? 'gradient-primary text-primary-foreground shadow-soft'
                    : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/20'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">Loading articles...</div>
        )}

        {/* Featured */}
        {!isLoading && featuredContent && activeCategory === 'all' && activeContentType === 'all' && !searchQuery && (
          <section className="animate-fade-in">
            <h3 className="text-base font-bold font-display text-foreground mb-3 tracking-tight">
              Featured
            </h3>
            <a
              href={`/education/${featuredContent.id}`}
              className="block rounded-2xl bg-card border border-border/40 overflow-hidden hover:shadow-medium transition-all group"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={featuredContent.imageUrl}
                  alt={featuredContent.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 group-hover:bg-foreground/15 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm shadow-lg">
                      <PlayCircle className="w-7 h-7 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-foreground/75 text-primary-foreground text-xs font-semibold backdrop-blur-sm">
                  {isVideo || isCourse ? `${featuredContent.duration}:00` : `${featuredContent.readTime} min`}
                </div>
              </div>
              <div className="p-4">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <PlayCircle className="w-3.5 h-3.5" />
                  {featuredContent.contentType} · {featuredContent.category.replace('-', ' ')}
                </span>
                <h4 className="font-bold text-foreground text-base line-clamp-2 leading-snug tracking-tight mb-1.5">
                  {featuredContent.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {featuredContent.summary}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-medium">
                  {featuredContent.source && <span>{featuredContent.source}</span>}
                  <span>·</span>
                  <span>{isVideo || isCourse ? `${featuredContent.duration} min` : `${featuredContent.readTime} min read`}</span>
                </div>
              </div>
            </a>
          </section>
        )}

        {/* Content Grid */}
        {!isLoading && (
          <section>
            <h3 className="text-base font-bold font-display text-foreground mb-3 tracking-tight">
              {activeContentType !== 'all'
                ? contentTypes.find((t) => t.id === activeContentType)?.label
                : activeCategory === 'all'
                ? 'All Content'
                : categories.find((c) => c.id === activeCategory)?.label}
              <span className="text-muted-foreground font-normal ml-2 text-sm">
                ({filteredArticles.length})
              </span>
            </h3>

            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-base text-muted-foreground">No content found</p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setActiveContentType('all');
                    setSearchQuery('');
                  }}
                  className="text-sm text-primary font-semibold mt-3 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </PageLayout>
  );
}
