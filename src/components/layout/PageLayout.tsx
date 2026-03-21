import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showNav?: boolean;
  showProfile?: boolean;
  showBack?: boolean;
}

export function PageLayout({
  children,
  title,
  showHeader = true,
  showNav = true,
  showProfile = true,
  showBack = false,
}: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showBack ? (
        <header className="sticky top-0 z-40 glass-subtle border-b border-border/60 safe-top">
          <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold font-display text-foreground tracking-tight">{title}</h1>
          </div>
        </header>
      ) : (
        showHeader && <Header title={title} showProfile={showProfile} />
      )}
      <main className="flex-1 pb-20">{children}</main>
      {showNav && <MobileNav />}
    </div>
  );
}
