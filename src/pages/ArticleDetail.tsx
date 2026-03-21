import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Share2,
  BookOpen,
  PlayCircle,
  ExternalLink,
  GraduationCap,
  FileText,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Article, ArticleCategory, ContentType } from '@/types';

const categoryColors: Record<string, string> = {
  prenatal: 'bg-info/10 text-info',
  postnatal: 'bg-primary/10 text-primary',
  nutrition: 'bg-success/10 text-success',
  'child-development': 'bg-warning/10 text-warning',
  'mental-health': 'bg-accent text-accent-foreground',
  breastfeeding: 'bg-secondary text-secondary-foreground',
};

const contentTypeIcons = {
  article: BookOpen,
  video: PlayCircle,
  course: GraduationCap,
  lesson: FileText,
};

const contentTypeLabels = {
  article: 'Article',
  video: 'Video',
  course: 'Course',
  lesson: 'Lesson',
};

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

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['education_article', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_articles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toArticle(data as Record<string, unknown>);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <PageLayout title="" showBack>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (isError || !article) {
    return (
      <PageLayout title="Not Found" showBack>
        <div className="px-4 py-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Content not found</h2>
          <p className="text-muted-foreground mb-6">
            The article or lesson you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/education')}>Back to Library</Button>
        </div>
      </PageLayout>
    );
  }

  const ContentIcon = contentTypeIcons[article.contentType];

  const handleExternalLink = () => {
    if (article.externalUrl) {
      window.open(article.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (article.videoUrl) {
      window.open(article.videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      }).catch(() => undefined);
    }
  };

  return (
    <PageLayout title="" showBack showNav={false}>
      <div className="pb-24">
        {/* Hero Image */}
        <div className="relative aspect-video">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Play button for videos */}
          {article.contentType === 'video' && (
            <button
              onClick={handleExternalLink}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:bg-primary transition-colors">
                <PlayCircle className="w-10 h-10 text-primary-foreground" />
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-4 -mt-8 relative z-10">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className={cn('capitalize', categoryColors[article.category])}>
              {article.category.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ContentIcon className="w-3 h-3" />
              {contentTypeLabels[article.contentType]}
            </Badge>
            {article.source && (
              <Badge variant="secondary">{article.source}</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold font-display text-foreground mb-3">
            {article.title}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                {article.contentType === 'video' || article.contentType === 'course'
                  ? `${article.duration} min`
                  : `${article.readTime} min read`}
              </span>
            </div>
          </div>

          {/* Summary */}
          <p className="text-lg text-muted-foreground mb-6">{article.summary}</p>

          {/* Action buttons for external content */}
          {(article.contentType === 'video' || article.contentType === 'course') && (
            <Button onClick={handleExternalLink} className="w-full mb-6 gap-2" size="lg">
              {article.contentType === 'video' ? (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Watch Video
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" />
                  Start Course on {article.source}
                </>
              )}
            </Button>
          )}

          {/* Main content */}
          <div className="prose prose-lg max-w-none">
            {article.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-foreground mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Course curriculum preview */}
          {article.contentType === 'course' && (
            <div className="mt-8 bg-accent/50 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-3">What you'll learn:</h3>
              <ul className="space-y-2">
                {article.content.split(', ').slice(0, 6).map((topic, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span>{topic.replace('This course covers: ', '').replace('.', '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom">
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
              Share
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/education')}>
              Back to Library
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
