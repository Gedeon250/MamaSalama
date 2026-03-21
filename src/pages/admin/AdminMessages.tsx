import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Send, Loader2, Trash2, MessageSquare, Users, Bell, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user_name?: string;
}

interface Profile {
  user_id: string;
  name: string;
  email: string | null;
}

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  reminder: Bell,
  message: MessageSquare,
};

const typeColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  reminder: 'bg-purple-100 text-purple-700',
  message: 'bg-green-100 text-green-700',
};

export default function AdminMessages() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  // New message dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isSending, setIsSending] = useState(false);
  const [sendToAll, setSendToAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [searchQuery, notifications]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      // Fetch all profiles for user selection
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .order('name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch all notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.name]));
      const notificationsWithNames = (notificationsData || []).map(n => ({
        ...n,
        user_name: profileMap.get(n.user_id) || 'Unknown',
      }));

      setNotifications(notificationsWithNames);
      setFilteredNotifications(notificationsWithNames);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    if (!searchQuery) {
      setFilteredNotifications(notifications);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = notifications.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.message.toLowerCase().includes(query) ||
      n.user_name?.toLowerCase().includes(query)
    );
    setFilteredNotifications(filtered);
  };

  const sendMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!sendToAll && !selectedUserId) {
      toast.error('Please select a recipient');
      return;
    }

    setIsSending(true);
    try {
      if (sendToAll) {
        // Send to all users
        const insertData = profiles.map(p => ({
          user_id: p.user_id,
          title: messageTitle,
          message: messageContent,
          type: messageType,
          created_by: user?.id,
        }));

        const { error } = await supabase
          .from('notifications')
          .insert(insertData);

        if (error) throw error;
        toast.success(`Message sent to ${profiles.length} users`);
      } else {
        // Send to single user
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: selectedUserId,
            title: messageTitle,
            message: messageContent,
            type: messageType,
            created_by: user?.id,
          });

        if (error) throw error;
        toast.success('Message sent successfully');
      }

      // Reset form and refresh
      setIsDialogOpen(false);
      setSelectedUserId('');
      setMessageTitle('');
      setMessageContent('');
      setMessageType('info');
      setSendToAll(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const deleteNotification = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== deleteId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout
      title="Messages & Notifications"
      description="Send messages and notifications to users"
    >
      <div className="grid gap-6 mb-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => !n.is_read).length}
                </p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>All Notifications</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => {
                  const TypeIcon = typeIcons[notification.type] || Info;
                  return (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">{notification.user_name}</TableCell>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${typeColors[notification.type] || 'bg-gray-100 text-gray-700'}`}>
                          <TypeIcon className="w-3 h-3" />
                          {notification.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          notification.is_read
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {notification.is_read ? 'Read' : 'Unread'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(notification.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No notifications match your search' : 'No notifications sent yet'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendToAll"
                checked={sendToAll}
                onChange={(e) => setSendToAll(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="sendToAll">Send to all users</Label>
            </div>

            {!sendToAll && (
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.name} {profile.email && `(${profile.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Notification title"
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Write your message here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!messageTitle.trim() || !messageContent.trim()) {
                  toast.error('Please fill in all fields');
                  return;
                }
                if (!sendToAll && !selectedUserId) {
                  toast.error('Please select a recipient');
                  return;
                }
                if (sendToAll) {
                  setShowBroadcastConfirm(true);
                } else {
                  sendMessage();
                }
              }}
              disabled={isSending}
            >
              {isSending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />{sendToAll ? `Send to ${profiles.length} users` : 'Send'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Confirmation */}
      <AlertDialog open={showBroadcastConfirm} onOpenChange={setShowBroadcastConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to All Users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send <strong>"{messageTitle}"</strong> to all <strong>{profiles.length} registered users</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowBroadcastConfirm(false); sendMessage(); }}>
              Send to All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteNotification} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
