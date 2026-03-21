import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Baby, Calendar, MapPin, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Stage = 'trying' | 'pregnant' | 'postpartum';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stage: '' as Stage,
    pregnancyWeek: '',
    childDOB: '',
    location: '',
  });

  const totalSteps = 4;

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding - save to database
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          pregnancy_stage: formData.stage,
          pregnancy_week: formData.pregnancyWeek ? parseInt(formData.pregnancyWeek) : null,
          child_dob: formData.childDOB || null,
          location: formData.location || null,
          is_onboarded: true,
        })
        .eq('user_id', user?.id);

      if (error) {
        toast.error('Failed to save profile. Please try again.');
      } else {
        await refreshProfile();
        toast.success('Welcome to MamaCare!');
        navigate('/dashboard');
      }
      
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // Welcome screen
      case 1: return formData.name.trim().length > 0;
      case 2: {
        if (!formData.stage) return false;
        if (formData.stage === 'pregnant' && !formData.pregnancyWeek) return false;
        if (formData.stage === 'postpartum' && !formData.childDOB) return false;
        return true;
      }
      case 3: return true; // Location is optional
      default: return true;
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="animate-fade-in text-center">
            <div className="w-24 h-24 mx-auto mb-6 gradient-primary rounded-full flex items-center justify-center shadow-glow animate-float">
              <Heart className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display text-foreground mb-3">
              Welcome to MamaCare
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-sm mx-auto">
              Your trusted companion for a healthy pregnancy and motherhood journey
            </p>
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <div className="flex items-center gap-3 p-4 bg-card rounded-xl shadow-soft">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Personalized health guidance</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card rounded-xl shadow-soft">
                <Baby className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Track your baby's growth</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card rounded-xl shadow-soft">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Never miss a checkup</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">
              Let's get to know you
            </h2>
            <p className="text-muted-foreground mb-8">
              What should we call you?
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-base">Your name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 h-14 text-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Stage */}
        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">
              Where are you on your journey?
            </h2>
            <p className="text-muted-foreground mb-8">
              This helps us personalize your experience
            </p>
            <div className="space-y-3">
              {[
                { value: 'trying', label: 'Trying to conceive', icon: Heart },
                { value: 'pregnant', label: 'Currently pregnant', icon: Baby },
                { value: 'postpartum', label: 'Already a mother', icon: Sparkles },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, stage: option.value as Stage })}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                      formData.stage === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-full",
                      formData.stage === option.value ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        formData.stage === option.value ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <span className={cn(
                      "font-medium",
                      formData.stage === option.value ? "text-primary" : "text-foreground"
                    )}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {formData.stage === 'pregnant' && (
              <div className="mt-6 animate-fade-in">
                <Label htmlFor="week" className="text-base">How many weeks pregnant?</Label>
                <Input
                  id="week"
                  type="number"
                  placeholder="e.g., 12"
                  min="1"
                  max="42"
                  value={formData.pregnancyWeek}
                  onChange={(e) => setFormData({ ...formData, pregnancyWeek: e.target.value })}
                  className="mt-2 h-14 text-lg"
                />
              </div>
            )}

            {formData.stage === 'postpartum' && (
              <div className="mt-6 animate-fade-in">
                <Label htmlFor="dob" className="text-base">Baby's date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.childDOB}
                  onChange={(e) => setFormData({ ...formData, childDOB: e.target.value })}
                  className="mt-2 h-14 text-lg"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">
              Where are you located?
            </h2>
            <p className="text-muted-foreground mb-8">
              We'll help you find nearby health facilities
            </p>
            <div>
              <Label htmlFor="location" className="text-base">Your city or area</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="e.g., Kigali, Gasabo"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="h-14 text-lg pl-12"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You can skip this and add it later
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleBack}
            className="flex-shrink-0"
            disabled={isLoading}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!canProceed() || isLoading}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : step === totalSteps - 1 ? 'Get Started' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
