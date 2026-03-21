import { Article } from '@/types';
import { Clock, Download, PlayCircle, GraduationCap, FileText, BookOpen, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'featured';
}

const contentTypeIcons = {
  article: BookOpen,
  video: PlayCircle,
  course: GraduationCap,
  lesson: FileText,
};

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const ContentIcon = contentTypeIcons[article.contentType];
  const isVideo = article.contentType === 'video';
  const isCourse = article.contentType === 'course';

  if (variant === 'featured') {
    return (
      <Link
        to={`/education/${article.id}`}
        className="block rounded-2xl overflow-hidden group"
      >
        <div className="relative aspect-video rounded-2xl overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 group-hover:bg-foreground/15 transition-colors">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <PlayCircle className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-foreground/75 text-primary-foreground text-[10px] font-semibold backdrop-blur-sm">
            {isVideo || isCourse ? `${article.duration}:00` : `${article.readTime} min`}
          </div>
        </div>
        <div className="flex gap-3 pt-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ContentIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground line-clamp-2 text-sm leading-snug tracking-tight">
              {article.title}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              {article.source || article.category.replace('-', ' ')} · {isVideo || isCourse ? `${article.duration} min` : `${article.readTime} min read`}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/education/${article.id}`}
        className="flex gap-3 group"
      >
        <div className="relative w-40 aspect-video rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 group-hover:bg-foreground/15 transition-colors">
              <PlayCircle className="w-8 h-8 text-primary-foreground drop-shadow-lg" />
            </div>
          )}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-foreground/75 text-primary-foreground text-[10px] font-semibold backdrop-blur-sm">
            {isVideo || isCourse ? `${article.duration}:00` : `${article.readTime} min`}
          </div>
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <h4 className="font-bold text-foreground line-clamp-2 text-sm leading-snug tracking-tight">
            {article.title}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1.5 capitalize font-medium">
            {article.source || article.category.replace('-', ' ')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
            {isVideo || isCourse ? `${article.duration} min` : `${article.readTime} min read`}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/education/${article.id}`}
      className="block group"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 group-hover:bg-foreground/15 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
              <PlayCircle className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-foreground/75 text-primary-foreground text-[10px] font-semibold backdrop-blur-sm">
          {isVideo || isCourse ? `${article.duration}:00` : `${article.readTime} min`}
        </div>
        <div className={cn(
          "absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm",
          isVideo ? "bg-destructive/90 text-destructive-foreground" : isCourse ? "bg-primary/90 text-primary-foreground" : "bg-background/80 text-foreground"
        )}>
          <ContentIcon className="w-3 h-3" />
          {article.contentType}
        </div>
      </div>
      <div className="flex gap-2.5 pt-2.5">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <ContentIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground line-clamp-2 text-[13px] leading-snug tracking-tight">
            {article.title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 capitalize font-medium">
            {article.source || article.category.replace('-', ' ')}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium">
            {isVideo || isCourse ? `${article.duration} min` : `${article.readTime} min read`}
          </p>
        </div>
      </div>
    </Link>
  );
}
