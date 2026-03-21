import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, AlertTriangle, Baby, MapPin, Phone, User, CheckCircle, Clock, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import PatientHistory from '@/components/admin/PatientHistory';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface CaseDetails {
  id: string;
  user_id: string;
  worker_id: string | null;
  status: string;
  subject: string | null;
  risk_level: string;
  ai_summary: string | null;
  escalated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PatientProfile {
  name: string;
  phone: string | null;
  pregnancy_stage: string | null;
  pregnancy_week: number | null;
  location: string | null;
}

export default function AdminCaseChat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) {
      fetchCase();
      fetchMessages();
    }
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`provider-chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        if (newMsg.sender_id !== user?.id) {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', newMsg.id).then();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCase = async () => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id!)
      .single();

    if (error) {
      toast.error('Case not found');
      navigate('/admin/cases');
      return;
    }
    setCaseDetails(data as unknown as CaseDetails);

    // Fetch patient profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phone, pregnancy_stage, pregnancy_week, location')
      .eq('user_id', data.user_id)
      .single();

    if (profile) setPatient(profile);
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(data);
        const unreadIds = data
          .filter((m) => !m.is_read && m.sender_id !== user?.id)
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          await supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds);
        }
      }
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !id || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('chat_messages').insert({
        conversation_id: id,
        sender_id: user.id,
        content: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage('');

      // Notify the mother
      if (caseDetails) {
        await supabase.from('notifications').insert({
          user_id: caseDetails.user_id,
          title: '💬 Health Worker Response',
          message: newMessage.trim().substring(0, 150) + (newMessage.trim().length > 150 ? '...' : ''),
          type: 'chat',
          created_by: user.id,
        });
      }

      // Auto-assign if not yet assigned
      if (caseDetails && !caseDetails.worker_id) {
        await supabase
          .from('chat_conversations')
          .update({ worker_id: user.id, status: 'assigned', updated_at: new Date().toISOString() })
          .eq('id', id);
        setCaseDetails(prev => prev ? { ...prev, worker_id: user.id, status: 'assigned' } : prev);
      } else {
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const closeCase = async () => {
    if (!id) return;
    await supabase
      .from('chat_conversations')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', id);
    setCaseDetails(prev => prev ? { ...prev, status: 'closed' } : prev);
    toast.success('Case closed');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isMyMessage = (senderId: string) => senderId === user?.id;
  const isClosed = caseDetails?.status === 'closed';
  const isHighRisk = caseDetails?.risk_level === 'high';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className={cn(
        'px-4 py-3 border-b safe-top',
        isHighRisk ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border'
      )}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin/cases')} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground text-sm truncate">
                {patient?.name || 'Patient'}
              </h2>
              {isHighRisk && <Badge variant="destructive" className="text-[10px]">High Risk</Badge>}
              <Badge variant="outline" className="text-[10px]">{caseDetails?.status}</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {caseDetails?.subject || 'Health Consultation'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowHistory(!showHistory); setShowInfo(false); }}
              className={cn("text-xs h-8", showHistory && "bg-muted")}
              title="Patient History"
            >
              <ClipboardList className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowInfo(!showInfo); setShowHistory(false); }}
              className={cn("text-xs h-8", showInfo && "bg-muted")}
            >
              <User className="w-3.5 h-3.5" />
            </Button>
            {!isClosed && (
              <Button size="sm" variant="outline" onClick={closeCase} className="text-xs h-8 gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Close
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Patient Info Panel */}
      {showInfo && (
        <div className="px-4 py-3 bg-muted/50 border-b border-border space-y-2">
          {caseDetails?.ai_summary && (
            <div className="text-xs bg-card rounded-lg p-2.5 border border-border">
              <span className="font-medium">🤖 AI Summary:</span> {caseDetails.ai_summary}
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {patient?.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {patient.location}</span>
            )}
            {patient?.pregnancy_stage && (
              <span className="flex items-center gap-1">
                <Baby className="w-3 h-3" /> {patient.pregnancy_stage}
                {patient.pregnancy_week && ` (Week ${patient.pregnancy_week})`}
              </span>
            )}
            {patient?.phone && (
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span>
            )}
            {caseDetails?.escalated_at && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                Escalated {formatDistanceToNow(new Date(caseDetails.escalated_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Patient History Panel */}
      {showHistory && caseDetails && (
        <div className="px-4 py-3 bg-muted/50 border-b border-border max-h-[50vh] overflow-y-auto">
          <h3 className="text-xs font-semibold text-foreground mb-2">📋 Patient Health History</h3>
          <PatientHistory userId={caseDetails.user_id} />
        </div>
      )}

      {/* Escalation banner */}
      {isHighRisk && !isClosed && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive flex-1">
            This case was flagged as high risk. Please respond promptly.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn('h-12 rounded-2xl animate-pulse', i % 2 === 0 ? 'bg-muted ml-auto w-3/5' : 'bg-muted w-4/5')} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet. Send a response to the patient.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const mine = isMyMessage(msg.sender_id);
            const isPatient = msg.sender_id === caseDetails?.user_id;
            const showTime = idx === 0 ||
              new Date(msg.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime() > 300000;

            return (
              <div key={msg.id}>
                {showTime && (
                  <p className="text-center text-[10px] text-muted-foreground my-2">
                    {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                  </p>
                )}
                <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                      mine
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                  >
                    {isPatient && (
                      <p className="text-[10px] font-semibold text-warning mb-0.5">
                        {patient?.name || 'Patient'}
                      </p>
                    )}
                    {!mine && !isPatient && (
                      <p className="text-[10px] font-semibold text-success mb-0.5">Provider</p>
                    )}
                    <p>{msg.content}</p>
                    <p className={cn(
                      'text-[10px] mt-1 text-right',
                      mine ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    )}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="px-4 py-3 bg-muted text-center text-sm text-muted-foreground border-t border-border safe-bottom">
          This case has been closed.
        </div>
      ) : (
        <div className="px-4 py-3 bg-card border-t border-border safe-bottom">
          <div className="flex gap-2 items-end">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response to the patient..."
              className="flex-1 rounded-full"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="rounded-full h-10 w-10 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
