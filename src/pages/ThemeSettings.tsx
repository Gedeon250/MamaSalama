import { PageLayout } from '@/components/layout/PageLayout';
import { useTheme, themeConfig, AppTheme } from '@/contexts/ThemeContext';
import { Check, Moon, Sun, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export default function ThemeSettings() {
  const { theme, setTheme, isDark, setIsDark } = useTheme();

  const themes = Object.entries(themeConfig) as [AppTheme, typeof themeConfig[AppTheme]][];

  return (
    <PageLayout title="Appearance" showBack>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Dark Mode Toggle */}
        <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted">
                {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="font-semibold text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Easier on the eyes at night</p>
              </div>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={setIsDark}
            />
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold font-display text-foreground">Choose Theme</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {themes.map(([key, config]) => {
              const isActive = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={cn(
                    "relative rounded-2xl border-2 p-4 text-left transition-all duration-200",
                    isActive
                      ? "border-primary shadow-soft bg-card"
                      : "border-border/40 bg-card hover:border-primary/30 hover:shadow-xs"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}

                  {/* Color preview dots */}
                  <div className="flex gap-2 mb-3">
                    {config.preview.map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border border-border/30 shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <h4 className="font-bold text-foreground text-sm mb-0.5">{config.name}</h4>
                  <p className="text-xs text-muted-foreground leading-snug">{config.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview hint */}
        <p className="text-center text-xs text-muted-foreground">
          Theme changes apply instantly across the entire app
        </p>
      </div>
    </PageLayout>
  );
}
