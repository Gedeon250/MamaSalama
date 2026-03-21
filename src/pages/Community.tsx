import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus, MessageCircle, Heart, Users, Baby, Moon,
  Apple, Sparkles, HelpCircle, Send, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ForumTopic, ForumPost } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const topics: { id: ForumTopic | 'all'; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'breastfeeding', label: 'Breastfeeding', icon: Baby },
  { id: 'sleep-training', label: 'Sleep', icon: Moon },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'pregnancy', label: 'Pregnancy', icon: Heart },
  { id: 'postpartum', label: 'Postpartum', icon: Sparkles },
  { id: 'general', label: 'General', icon: HelpCircle },
];

interface Reply {
  id: string;
  content: string;
  is_anonymous: boolean;
  user_id: string | null;
  created_at: string;
}

export default function Community() {
  const { user } = useAuth();
  const [activeTopic, setActiveTopic] = useState<ForumTopic | 'all'>('all');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // New post dialog
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTopic, setNewTopic] = useState<ForumTopic>('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Replies sheet
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (user) fetchLikedPosts();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts_safe')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts((data || []).map((post) => ({
        id: post.id,
        userId: post.user_id || '',
        title: post.title,
        content: post.content,
        topic: post.topic as ForumTopic,
        isAnonymous: post.is_anonymous || false,
        userName: post.user_id ? 'Mama' : 'Anonymous',
        likesCount: post.likes_count || 0,
        repliesCount: post.replies_count || 0,
        createdAt: post.created_at,
      })));
    } catch {
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('forum_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .not('post_id', 'is', null);
    if (data) setLikedPosts(new Set(data.map((l) => l.post_id)));
  };

  const handleCreatePost = async () => {
    if (!user) { toast.error('Please sign in to post'); return; }
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('forum_posts').insert({
        user_id: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        topic: newTopic,
        is_anonymous: isAnonymous,
      });
      if (error) throw error;
      toast.success('Post shared with the community!');
      setShowNewPost(false);
      setNewTitle('');
      setNewContent('');
      setNewTopic('general');
      setIsAnonymous(false);
      fetchPosts();
    } catch {
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post: ForumPost) => {
    if (!user) { toast.error('Please sign in to like'); return; }
    const isLiked = likedPosts.has(post.id);
    // Optimistic update
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) { next.delete(post.id); } else { next.add(post.id); }
      return next;
    });
    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, likesCount: p.likesCount + (isLiked ? -1 : 1) } : p
    ));
    if (isLiked) {
      await supabase.from('forum_likes').delete().eq('user_id', user.id).eq('post_id', post.id);
    } else {
      await supabase.from('forum_likes').insert({ user_id: user.id, post_id: post.id });
    }
  };

  const openReplies = async (post: ForumPost) => {
    setSelectedPost(post);
    setRepliesLoading(true);
    const { data, error } = await supabase
      .from('forum_replies_safe')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (!error) setReplies(data || []);
    setRepliesLoading(false);
  };

  const handleSendReply = async () => {
    if (!user || !selectedPost) { toast.error('Please sign in to reply'); return; }
    if (!replyContent.trim()) { toast.error('Reply cannot be empty'); return; }
    setSendingReply(true);
    try {
      const { error } = await supabase.from('forum_replies').insert({
        post_id: selectedPost.id,
        user_id: user.id,
        content: replyContent.trim(),
        is_anonymous: replyAnonymous,
      });
      if (error) throw error;
      setReplyContent('');
      // Refresh replies
      const { data } = await supabase
        .from('forum_replies_safe')
        .select('*')
        .eq('post_id', selectedPost.id)
        .order('created_at', { ascending: true });
      setReplies(data || []);
      // Update replies count in posts list
      setPosts(prev => prev.map(p =>
        p.id === selectedPost.id ? { ...p, repliesCount: p.repliesCount + 1 } : p
      ));
      toast.success('Reply sent!');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    activeTopic === 'all' ? true : post.topic === activeTopic
  );

  return (
    <PageLayout title="Community" showProfile={false}>
      <div className="px-4 py-6 space-y-6">
        {/* Community Header */}
        <div className="bg-secondary/50 rounded-xl p-4 border border-secondary">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Mama Community</h3>
              <p className="text-sm text-muted-foreground">{posts.length} discussions</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect with other mothers, share experiences, and get support from our community.
          </p>
        </div>

        {/* Topics */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {topics.map((topic) => {
            const Icon = topic.icon;
            const isActive = activeTopic === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all',
                  isActive
                    ? 'gradient-primary text-primary-foreground shadow-soft'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{topic.label}</span>
              </button>
            );
          })}
        </div>

        {/* Posts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Recent Discussions</h3>
            <Button size="sm" onClick={() => setShowNewPost(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Post
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">No posts yet in this topic</p>
              <Button size="sm" className="mt-3" onClick={() => setShowNewPost(true)}>
                Be the first to post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={likedPosts.has(post.id)}
                  onLike={() => handleLike(post)}
                  onReply={() => openReplies(post)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Health Worker Chat CTA */}
        <Link
          to="/chat"
          className="block bg-card rounded-xl p-4 shadow-soft border border-border hover:shadow-medium transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-success/10 rounded-full">
              <MessageCircle className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-1">Need Expert Advice?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Chat with verified community health workers for personalized guidance.
              </p>
              <Button variant="outline" size="sm">Start Chat</Button>
            </div>
          </div>
        </Link>
      </div>

      {/* ── New Post Dialog ── */}
      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share with the Community</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                placeholder="What's your question or experience?"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="post-content">Details</Label>
              <Textarea
                id="post-content"
                placeholder="Share more details..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={4}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <Label>Topic</Label>
              <Select value={newTopic} onValueChange={v => setNewTopic(v as ForumTopic)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {topics.filter(t => t.id !== 'all').map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Post anonymously</p>
                <p className="text-xs text-muted-foreground">Your name won't be shown</p>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
            <Button
              onClick={handleCreatePost}
              disabled={submitting || !newTitle.trim() || !newContent.trim()}
              className="w-full"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {submitting ? 'Sharing...' : 'Share Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Replies Sheet ── */}
      <Sheet open={!!selectedPost} onOpenChange={open => { if (!open) setSelectedPost(null); }}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="text-left line-clamp-1">{selectedPost?.title}</SheetTitle>
          </SheetHeader>

          {/* Original post content */}
          {selectedPost && (
            <p className="text-sm text-muted-foreground border-b border-border pb-3 flex-shrink-0">
              {selectedPost.content}
            </p>
          )}

          {/* Replies list */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3">
            {repliesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : replies.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No replies yet. Be the first to respond!
              </p>
            ) : (
              replies.map(reply => (
                <div key={reply.id} className="bg-muted rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {reply.is_anonymous ? 'Anonymous' : 'Mama'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{reply.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Reply input */}
          <div className="flex-shrink-0 border-t border-border pt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                id="reply-anon"
                checked={replyAnonymous}
                onCheckedChange={setReplyAnonymous}
                className="scale-75"
              />
              <label htmlFor="reply-anon">Reply anonymously</label>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                rows={2}
                className="flex-1 resize-none text-sm"
              />
              <Button
                size="icon"
                onClick={handleSendReply}
                disabled={sendingReply || !replyContent.trim()}
                className="self-end h-10 w-10 flex-shrink-0"
              >
                {sendingReply
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}

function PostCard({
  post,
  liked,
  onLike,
  onReply,
}: {
  post: ForumPost;
  liked: boolean;
  onLike: () => void;
  onReply: () => void;
}) {
  const topicConfig = topics.find(t => t.id === post.topic);
  const Icon = topicConfig?.icon || HelpCircle;

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-accent rounded-full">
          <Icon className="w-3.5 h-3.5 text-accent-foreground" />
        </div>
        <span className="text-xs text-muted-foreground capitalize">
          {post.topic.replace('-', ' ')}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">
          {post.isAnonymous ? 'Anonymous' : post.userName}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </span>
      </div>

      <h4 className="font-semibold text-foreground mb-1">{post.title}</h4>
      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <button
          onClick={onLike}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          )}
        >
          <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
          <span className="text-sm">{post.likesCount}</span>
        </button>
        <button
          onClick={onReply}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{post.repliesCount} {post.repliesCount === 1 ? 'reply' : 'replies'}</span>
        </button>
      </div>
    </div>
  );
}
