import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageSquare, Send, Phone, RefreshCw, Bell } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSMS() {
  const queryClient = useQueryClient();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sms-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_sessions')
        .select('*')
        .order('last_activity_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['sms-messages', selectedPhone],
    queryFn: async () => {
      if (!selectedPhone) return [];
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('phone_number', selectedPhone)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPhone,
  });

  const sendSmsMutation = useMutation({
    mutationFn: async ({ to, message, messageType }: { to: string; message: string; messageType?: string }) => {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to, message, messageType },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('SMS sent successfully');
      setReplyMessage('');
      setBulkMessage('');
      setBulkTo('');
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] });
    },
    onError: (e) => toast.error(`Failed to send: ${e.message}`),
  });

  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-sms-reminders');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sent ${data.sent} reminder(s)`);
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  return (
    <AdminLayout title="USSD & SMS Management" description="Manage SMS conversations and send messages to non-smartphone users">
      <div className="space-y-6">
        <div className="flex items-center justify-end mb-6">
          <Button
            onClick={() => sendRemindersMutation.mutate()}
            disabled={sendRemindersMutation.isPending}
          >
            <Bell className="w-4 h-4 mr-2" />
            {sendRemindersMutation.isPending ? 'Sending...' : 'Send Due Reminders'}
          </Button>
        </div>

        <Tabs defaultValue="conversations">
          <TabsList>
            <TabsTrigger value="conversations">SMS Conversations</TabsTrigger>
            <TabsTrigger value="bulk">Send Bulk SMS</TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
              {/* Session list */}
              <Card className="md:col-span-1">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Sessions ({sessions?.length || 0})
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="h-[520px]">
                  <CardContent className="space-y-1 p-2">
                    {sessionsLoading ? (
                      <p className="text-sm text-muted-foreground p-4">Loading...</p>
                    ) : sessions?.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4">No sessions yet. Sessions appear when users interact via USSD or SMS.</p>
                    ) : (
                      sessions?.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedPhone(s.phone_number)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedPhone === s.phone_number
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <p className="font-medium text-sm text-foreground">{s.phone_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(s.last_activity_at), 'MMM d, HH:mm')}
                          </p>
                        </button>
                      ))
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>

              {/* Messages */}
              <Card className="md:col-span-2">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {selectedPhone ? `Chat with ${selectedPhone}` : 'Select a conversation'}
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="h-[460px]">
                  <CardContent className="space-y-3 p-4">
                    {!selectedPhone ? (
                      <p className="text-muted-foreground text-sm text-center py-10">Select a session to view messages</p>
                    ) : messagesLoading ? (
                      <p className="text-muted-foreground text-sm">Loading messages...</p>
                    ) : messages?.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-10">No messages yet</p>
                    ) : (
                      messages?.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              m.direction === 'outbound'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs opacity-70">
                                {format(new Date(m.created_at), 'HH:mm')}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {m.message_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </ScrollArea>
                {selectedPhone && (
                  <div className="p-3 border-t border-border flex gap-2">
                    <Input
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type reply SMS..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && replyMessage.trim()) {
                          sendSmsMutation.mutate({ to: selectedPhone, message: replyMessage });
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      disabled={!replyMessage.trim() || sendSmsMutation.isPending}
                      onClick={() => sendSmsMutation.mutate({ to: selectedPhone, message: replyMessage })}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Bulk SMS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Recipients (comma-separated phone numbers)</label>
                  <Input
                    value={bulkTo}
                    onChange={(e) => setBulkTo(e.target.value)}
                    placeholder="+250788000001, +250788000002"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <Textarea
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder="Type your bulk SMS message..."
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{bulkMessage.length}/160 characters</p>
                </div>
                <Button
                  disabled={!bulkTo.trim() || !bulkMessage.trim() || sendSmsMutation.isPending}
                  onClick={() => {
                    const phones = bulkTo.split(',').map((p) => p.trim()).filter(Boolean);
                    phones.forEach((phone) => {
                      sendSmsMutation.mutate({ to: phone, message: bulkMessage, messageType: 'bulk' });
                    });
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to {bulkTo.split(',').filter((p) => p.trim()).length} recipient(s)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
