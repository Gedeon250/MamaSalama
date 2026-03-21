import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Clock, CheckCircle2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ConversationInfo {
  id: string;
  user_id: string;
  worker_id: string | null;
  status: string;
  subject: string | null;
}

export default function ChatConversation() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) {
      fetchConversation();
      fetchMessages();
    }
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime messages
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`chat-messages-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        // Mark as read if from other user
        if (newMsg.sender_id !== user?.id) {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', newMsg.id).then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversation = async () => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id!)
      .single();

    if (error) {
      toast.error('Conversation not found');
      navigate('/chat');
      return;
    }
    setConversation(data);
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
        // Mark unread messages as read
        const unreadIds = data
          .filter((m) => !m.is_read && m.sender_id !== user?.id)
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .in('id', unreadIds);
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

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isMyMessage = (senderId: string) => senderId === user?.id;
  const isClosed = conversation?.status === 'closed';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border safe-top">
        <button onClick={() => navigate('/chat')} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground text-sm truncate">
            {conversation?.subject || t.chat.title}
          </h2>
          <div className="flex items-center gap-1.5">
            {conversation?.status === 'assigned' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-[11px] text-success">{t.chat.healthWorkerConnected}</span>
              </>
            ) : conversation?.status === 'closed' ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{t.chat.closed}</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-warning" />
                <span className="text-[11px] text-warning">{t.chat.waitingForWorker}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Privacy notice */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-info/10 text-info text-xs mx-auto max-w-sm">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>{t.chat.privateSecure}</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn('h-12 rounded-2xl animate-pulse', i % 2 === 0 ? 'bg-muted ml-auto w-3/5' : 'bg-muted w-4/5')} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t.chat.noMessages}
          </p>
        ) : (
          messages.map((msg, idx) => {
            const mine = isMyMessage(msg.sender_id);
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
                    {!mine && (
                      <p className="text-[10px] font-semibold text-success mb-0.5">Health Worker</p>
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
          {t.chat.conversationClosed}
        </div>
      ) : (
        <div className="px-4 py-3 bg-card border-t border-border safe-bottom">
          <div className="flex gap-2 items-end">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chat.typeMessage}
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
