import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { mockEmergencyContacts, dangerSigns } from '@/data/mockData';
import { Phone, AlertTriangle, MapPin, ChevronDown, ChevronUp, Baby, Heart, Ambulance, Building2, User, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

const contactTypeIcons = {
  ambulance: Ambulance,
  hospital: Building2,
  personal: User,
  hotline: Headphones,
};

export default function Emergency() {
  const [expandedSection, setExpandedSection] = useState<string | null>('pregnancy');
  const { t } = useTranslation();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <PageLayout title={t.emergency.title} showProfile={false}>
      <div className="px-4 py-6 space-y-6">
        {/* Emergency Alert Banner */}
        <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-destructive rounded-full animate-pulse-soft">
              <AlertTriangle className="w-5 h-5 text-destructive-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-destructive mb-1">{t.emergency.inCaseOf}</h2>
              <p className="text-sm text-destructive/80">{t.emergency.immediateHelp}</p>
            </div>
          </div>
        </div>

        <Button variant="emergency" size="xl" className="w-full">
          <Phone className="w-6 h-6 mr-2" />
          {t.emergency.callEmergency}
        </Button>

        {/* Quick Contacts */}
        <section>
          <h3 className="text-lg font-bold font-display text-foreground mb-4">{t.emergency.emergencyContacts}</h3>
          <div className="space-y-3">
            {mockEmergencyContacts.map((contact) => {
              const Icon = contactTypeIcons[contact.type];
              return (
                <a key={contact.id} href={`tel:${contact.phone}`} className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-soft border border-border hover:border-primary/30 transition-all active:scale-[0.98]">
                  <div className={cn("p-3 rounded-full", contact.type === 'ambulance' ? "bg-destructive/10" : "bg-accent")}>
                    <Icon className={cn("w-5 h-5", contact.type === 'ambulance' ? "text-destructive" : "text-accent-foreground")} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{contact.name}</h4>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                  <Phone className="w-5 h-5 text-primary" />
                </a>
              );
            })}
          </div>
        </section>

        <Button variant="outline" size="lg" className="w-full">
          <MapPin className="w-5 h-5 mr-2" />
          {t.emergency.shareLocation}
        </Button>

        {/* Danger Signs */}
        <section>
          <h3 className="text-lg font-bold font-display text-foreground mb-4">{t.emergency.dangerSigns}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t.emergency.dangerSignsDesc}</p>

          <div className="space-y-3">
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <button onClick={() => toggleSection('pregnancy')} className="w-full flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full"><Heart className="w-5 h-5 text-primary" /></div>
                  <span className="font-semibold text-foreground">{t.emergency.duringPregnancy}</span>
                </div>
                {expandedSection === 'pregnancy' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
              {expandedSection === 'pregnancy' && (
                <div className="px-4 pb-4 pt-0">
                  <ul className="space-y-2">
                    {dangerSigns.pregnancy.map((sign, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />{sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <button onClick={() => toggleSection('postpartum')} className="w-full flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-full"><Heart className="w-5 h-5 text-secondary-foreground" /></div>
                  <span className="font-semibold text-foreground">{t.emergency.afterDelivery}</span>
                </div>
                {expandedSection === 'postpartum' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
              {expandedSection === 'postpartum' && (
                <div className="px-4 pb-4 pt-0">
                  <ul className="space-y-2">
                    {dangerSigns.postpartum.map((sign, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />{sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <button onClick={() => toggleSection('baby')} className="w-full flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-full"><Baby className="w-5 h-5 text-info" /></div>
                  <span className="font-semibold text-foreground">{t.emergency.babyWarning}</span>
                </div>
                {expandedSection === 'baby' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
              {expandedSection === 'baby' && (
                <div className="px-4 pb-4 pt-0">
                  <ul className="space-y-2">
                    {dangerSigns.baby.map((sign, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />{sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
