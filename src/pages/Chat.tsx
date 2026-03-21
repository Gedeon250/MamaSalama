import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  user_id: string;
  worker_id: string | null;
  status: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  last_message?: string;
  unread_count?: number;
}

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('chat-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (data) {
        // Fetch last message for each conversation
        const withMessages = await Promise.all(
          data.map(async (conv) => {
            const { data: msgs } = await supabase
              .from('chat_messages')
              .select('content, is_read, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const lastMsg = msgs?.[0];
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('is_read', false)
              .neq('sender_id', user!.id);

            return {
              ...conv,
              last_message: lastMsg?.content,
              unread_count: count || 0,
            };
          })
        );
        setConversations(withMessages);
      }
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          subject: 'Health Consultation',
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        // Send initial system-like message
        await supabase.from('chat_messages').insert({
          conversation_id: data.id,
          sender_id: user.id,
          content: 'Hello, I need help with a health question.',
        });
        navigate(`/chat/${data.id}`);
      }
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const statusConfig: Record<string, { label: string; icon: LucideIcon; className: string }> = {
    open: { label: 'Waiting', icon: Clock, className: 'text-warning bg-warning/10' },
    assigned: { label: 'Active', icon: MessageCircle, className: 'text-success bg-success/10' },
    escalated: { label: 'Urgent', icon: MessageCircle, className: 'text-destructive bg-destructive/10' },
    closed: { label: 'Closed', icon: CheckCircle, className: 'text-muted-foreground bg-muted' },
  };

  return (
    <PageLayout title="Health Chat" showBack>
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
        {/* Header card */}
        <div className="bg-secondary/50 rounded-xl p-4 border border-secondary">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-success/10 rounded-full">
              <MessageCircle className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-sm">Community Health Workers</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get personalized health guidance from verified professionals.
              </p>
            </div>
          </div>
        </div>

        {/* New chat button */}
        <Button onClick={startNewConversation} className="w-full gap-2" size="lg">
          <Plus className="w-5 h-5" />
          Start New Consultation
        </Button>

        {/* Conversations list */}
        <section>
          <h3 className="text-sm font-bold font-display text-foreground mb-3">
            Your Conversations
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a consultation to chat with a health worker
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const status = statusConfig[conv.status] || statusConfig.open;
                const StatusIcon = status.icon;
                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:shadow-medium transition-all text-left"
                  >
                    <div className={cn('p-2 rounded-full', status.className)}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-semibold text-foreground text-sm truncate">
                          {conv.subject || 'Health Consultation'}
                        </h4>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message || 'No messages yet'}
                        </p>
                        {(conv.unread_count ?? 0) > 0 && (
                          <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

export default Chat;
