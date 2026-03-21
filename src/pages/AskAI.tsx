import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User, Sparkles, Stethoscope, Baby, Apple, Brain, Globe, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Msg = { role: 'user' | 'assistant'; content: string };
type Lang = 'en' | 'rw';

const RISK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assess-risk`;
const HEALTH_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-chat`;


const translations = {
  en: {
    title: 'Ask SafeStart AI',
    subtitle: 'Online • Instant answers',
    talkToExpert: 'Talk to Expert',
    greeting: 'Hi Mama! 👋',
    description: 'Ask me anything about pregnancy, baby care, nutrition, or child development.',
    disclaimer: '⚕️ AI assistant for guidance only. Always consult your healthcare provider for medical decisions.',
    placeholder: 'Ask about pregnancy, baby care...',
    newChat: 'New Chat',
    quickQuestions: [
      { icon: Stethoscope, label: 'Pregnancy symptoms', message: 'What are normal pregnancy symptoms in the first trimester?' },
      { icon: Baby, label: 'Breastfeeding tips', message: 'What are some tips for successful breastfeeding?' },
      { icon: Apple, label: 'Baby nutrition', message: 'What foods should I introduce to my 6-month-old baby?' },
      { icon: Brain, label: 'Child milestones', message: 'What milestones should my 1-year-old be reaching?' },
    ],
  },
  rw: {
    title: 'Baza SafeStart AI',
    subtitle: 'Kuri interineti • Ibisubizo byihuse',
    talkToExpert: 'Vugana n\'umujyanama',
    greeting: 'Muraho Mama! 👋',
    description: 'Mbaza ikibazo cyose ku gutwita, kwita ku mwana, imirire, cyangwa iterambere ry\'umwana.',
    disclaimer: '⚕️ Umufasha wa AI agufasha gusa. Buri gihe jya usabe inama umuganga wawe.',
    placeholder: 'Baza ku gutwita, kwita ku mwana...',
    newChat: 'Ikiganiro Gishya',
    quickQuestions: [
      { icon: Stethoscope, label: 'Ibimenyetso byo gutwita', message: 'Ni ibihe bimenyetso bisanzwe byo gutwita mu mezi atatu ya mbere?' },
      { icon: Baby, label: 'Inama zo konsa', message: 'Ni izihe nama zo konsa neza umwana?' },
      { icon: Apple, label: 'Imirire y\'umwana', message: 'Ni iki nakwigisha umwana wanjye w\'amezi 6 kurya?' },
      { icon: Brain, label: 'Iterambere ry\'umwana', message: 'Umwana w\'umwaka umwe akwiriye kuba yarabashije iki?' },
    ],
  },
};

export default function AskAI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Lang>('en');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'rw' : 'en');
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setConversationId(null);
    setEscalated(false);
  };

  // Create a conversation record for tracking
  const ensureConversation = async () => {
    if (conversationId || !user) return conversationId;
    const { data } = await supabase
      .from('chat_conversations')
      .insert({ user_id: user.id, subject: 'AI Health Chat', status: 'open' })
      .select()
      .single();
    if (data) {
      setConversationId(data.id);
      return data.id;
    }
    return null;
  };

  // Assess risk after AI response
  const assessRisk = async (allMessages: Msg[], convId: string | null) => {
    if (!user || !convId) return;
    try {
      const resp = await fetch(RISK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          conversation_id: convId,
          messages: allMessages,
          user_id: user.id,
        }),
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.escalated) {
          setEscalated(true);
          const escalationMsg = language === 'rw'
            ? '🚨 Twabonye ibimenyetso bikomeye. Umujyanama w\'ubuzima yabimenyeshejwe kandi azaguhamagara vuba. Niba ari ikibazo cy\'uburiri, jya ku ivuriro riri hafi.'
            : '🚨 We\'ve detected serious symptoms. A health worker has been notified and will contact you soon. If this is an emergency, please visit your nearest health facility immediately.';
          setMessages(prev => [...prev, { role: 'assistant', content: escalationMsg }]);
        }
      }
    } catch {
      // Risk assessment is non-critical, fail silently
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const convId = await ensureConversation();

    const userMsg: Msg = { role: 'user', content: content.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(HEALTH_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          language,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        const errMsg = errBody?.error || `HTTP ${resp.status}`;
        console.error('health-chat error:', errBody);
        if (resp.status === 429) {
          toast.error(language === 'rw' ? 'Ibisabwa byinshi. Tegereza akanya.' : 'Too many requests. Please wait a moment.');
        } else {
          toast.error(language === 'rw' ? 'Serivisi ya AI ntibashije. Ongera ugerageze.' : 'AI service unavailable. Please try again.');
        }
        setIsLoading(false);
        return;
      }
      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) upsertAssistant(chunk);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (const raw of textBuffer.split('\n')) {
          if (!raw || raw.startsWith(':') || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) upsertAssistant(chunk);
          } catch { /* skip malformed SSE chunks */ }
        }
      }

      // After AI responds, assess risk in background
      const finalMessages = [...allMessages, { role: 'assistant' as const, content: assistantSoFar }];
      assessRisk(finalMessages, convId);

    } catch {
      toast.error(language === 'rw' ? 'Ntibyashobotse kubona igisubizo. Ongera ugerageze.' : 'Failed to get response. Please try again.');
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border safe-top">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1.5 rounded-full bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground text-sm truncate">{t.title}</h2>
            <p className="text-[11px] text-success">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-xs font-medium text-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'en' ? 'RW' : 'EN'}
          </button>
          {messages.length > 0 && (
            <button
              onClick={resetChat}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              title={t.newChat}
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/chat')} className="text-xs gap-1 h-8 px-2">
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.talkToExpert}</span>
          </Button>
        </div>
      </header>

      {/* Escalation Banner */}
      {escalated && (
        <div className="px-4 py-2.5 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive flex-1">
            {language === 'rw'
              ? 'Umujyanama w\'ubuzima yabimenyeshejwe. Azaguhamagara vuba.'
              : 'A health worker has been alerted and will contact you soon.'}
          </p>
          <Button size="sm" variant="destructive" onClick={() => navigate('/chat')} className="text-xs h-7 px-2">
            {language === 'rw' ? 'Vugana' : 'Chat Now'}
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 pb-8">
            <div className="p-4 rounded-full bg-primary/10">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-foreground text-lg">{t.greeting}</h3>
              <p className="text-sm text-muted-foreground max-w-xs">{t.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {t.quickQuestions.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.label}
                    onClick={() => sendMessage(q.message)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                  >
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground line-clamp-2">{q.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-muted-foreground text-center max-w-xs">{t.disclaimer}</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>p:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center mt-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-card border-t border-border safe-bottom">
        <div className="flex gap-2 items-end">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className="flex-1 rounded-full"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
