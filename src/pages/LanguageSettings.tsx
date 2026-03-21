import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

const languages = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'rw', label: 'Kinyarwanda', native: 'Ikinyarwanda', flag: '🇷🇼' },
];

export default function LanguageSettings() {
  const { profile, refreshProfile } = useAuth();
  const { t, lang, setLang } = useTranslation();

  const handleLanguageChange = async (langCode: string) => {
    // Update local state immediately
    setLang(langCode as 'en' | 'rw');
    
    // Persist to profile
    if (profile?.user_id) {
      const { error } = await supabase
        .from('profiles')
        .update({ language: langCode })
        .eq('user_id', profile.user_id);
      
      if (error) {
        toast.error(lang === 'rw' ? 'Ntibyashobotse guhindura ururimi' : 'Failed to update language');
      } else {
        await refreshProfile();
        toast.success(lang === 'rw' ? 'Ururimi rwahinduwe!' : 'Language updated!');
      }
    }
  };

  return (
    <PageLayout title={t.settings.language} showBack>
      <div className="px-4 py-6 space-y-4">
        <p className="text-muted-foreground text-sm">
          {lang === 'rw' ? 'Hitamo ururimi ukunda koreramo porogaramu.' : 'Select your preferred language for the app interface.'}
        </p>
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
          {languages.map((l, index) => (
            <button
              key={l.code}
              onClick={() => handleLanguageChange(l.code)}
              className={`w-full flex items-center justify-between p-4 hover:bg-accent transition-colors text-left ${index !== languages.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{l.flag}</span>
                <div>
                  <span className="font-medium text-foreground block">{l.label}</span>
                  <span className="text-sm text-muted-foreground">{l.native}</span>
                </div>
              </div>
              {lang === l.code && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
