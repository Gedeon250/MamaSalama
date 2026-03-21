import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Mail, Lock, User, Eye, EyeOff, Stethoscope, Baby } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type UserRole = 'patient' | 'provider';

export default function Auth() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Only redirect if already logged in on page load (not after login action)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Already logged in, redirect based on role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        const isProvider = roles?.some(r => r.role === 'admin' || r.role === 'moderator');
        navigate(isProvider ? '/admin' : '/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) { toast.error(error.errors[0].message); return; }
    }
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      if (error.message.includes('Invalid login credentials')) toast.error(t.auth.invalidCredentials);
      else if (error.message.includes('Email not confirmed')) toast.error(t.auth.confirmEmail);
      else toast.error(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user && selectedRole === 'provider') {
      // Check if user actually has provider role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);
      const isProvider = roles?.some(r => r.role === 'admin' || r.role === 'moderator');
      if (!isProvider) {
        toast.error(t.auth.notProvider);
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }
    }

    // Check actual role from DB regardless of which tab was selected
    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id);
    const hasAdminRole = allRoles?.some(r => r.role === 'admin' || r.role === 'moderator');

    toast.success(t.auth.welcomeBack + '!');
    navigate(hasAdminRole ? '/admin' : '/');
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(forgotEmail); } catch (error) {
      if (error instanceof z.ZodError) { toast.error(error.errors[0].message); return; }
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) { toast.error(error.message); } else {
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (error) {
      if (error instanceof z.ZodError) { toast.error(error.errors[0].message); return; }
    }
    if (signupPassword !== signupConfirmPassword) { toast.error(t.auth.passwordMismatch); return; }

    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { emailRedirectTo: redirectUrl, data: { name: signupName } },
    });

    if (error) {
      if (error.message.includes('User already registered')) toast.error(t.auth.accountExists);
      else toast.error(error.message);
    } else {
      toast.success(t.auth.accountCreated);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'rw' : 'en')}
            className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            {lang === 'en' ? '🇷🇼 Kinyarwanda' : '🇬🇧 English'}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
              <Heart className="w-7 h-7 text-primary-foreground" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.appName}</h1>
          <p className="text-muted-foreground mt-1">{t.auth.tagline}</p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSelectedRole('patient')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              selectedRole === 'patient'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border bg-card hover:border-primary/30'
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              selectedRole === 'patient' ? 'bg-primary/20' : 'bg-muted'
            )}>
              <Baby className={cn('w-6 h-6', selectedRole === 'patient' ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="text-center">
              <p className={cn('font-semibold text-sm', selectedRole === 'patient' ? 'text-primary' : 'text-foreground')}>
                {t.auth.patient}
              </p>
              <p className="text-[11px] text-muted-foreground">{t.auth.patientDesc}</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('provider')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              selectedRole === 'provider'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border bg-card hover:border-primary/30'
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              selectedRole === 'provider' ? 'bg-primary/20' : 'bg-muted'
            )}>
              <Stethoscope className={cn('w-6 h-6', selectedRole === 'provider' ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="text-center">
              <p className={cn('font-semibold text-sm', selectedRole === 'provider' ? 'text-primary' : 'text-foreground')}>
                {t.auth.provider}
              </p>
              <p className="text-[11px] text-muted-foreground">{t.auth.providerDesc}</p>
            </div>
          </button>
        </div>

        <Card className="border-0 shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t.auth.login}</TabsTrigger>
                {selectedRole === 'patient' && (
                  <TabsTrigger value="signup">{t.auth.signUp}</TabsTrigger>
                )}
              </TabsList>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <CardTitle className="text-xl mb-1">
                  {selectedRole === 'provider' ? t.auth.providerLogin : t.auth.welcomeBack}
                </CardTitle>
                <CardDescription className="mb-6">
                  {selectedRole === 'provider' ? t.auth.providerLoginDesc : t.auth.enterCredentials}
                </CardDescription>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t.auth.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t.auth.signingIn : t.auth.signIn}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    className="w-full text-center text-sm text-primary hover:underline mt-2"
                  >
                    Forgot password?
                  </button>
                </form>

                {showForgotPassword && (
                  <form onSubmit={handleForgotPassword} className="mt-4 space-y-3 border-t pt-4">
                    <p className="text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10" required />
                    </div>
                    <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                )}
              </TabsContent>
              
              {selectedRole === 'patient' && (
                <TabsContent value="signup" className="mt-0">
                  <CardTitle className="text-xl mb-1">{t.auth.createAccount}</CardTitle>
                  <CardDescription className="mb-6">{t.auth.joinText}</CardDescription>
                  
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t.auth.fullName}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-name" type="text" placeholder={t.auth.fullName} value={signupName} onChange={(e) => setSignupName(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t.auth.email}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t.auth.password}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder={t.auth.password} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">{t.auth.confirmPassword}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-confirm-password" type={showPassword ? 'text' : 'password'} placeholder={t.auth.confirmPassword} value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? t.auth.creatingAccount : t.auth.createAccount}
                    </Button>
                  </form>
                </TabsContent>
              )}
            </CardContent>
          </Tabs>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-6">{t.auth.termsText}</p>
      </div>
    </div>
  );
}
