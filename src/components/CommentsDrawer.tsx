import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Send, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { CommentItem } from '../types.ts';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CommentItem[];
  videoTitle: string;
  onAddComment: (text: string) => void;
  onToggleCommentLike: (commentId: string) => void;
  onPlayTts: (text: string) => void;
  isTtsLoading?: boolean;
}

export default function CommentsDrawer({
  isOpen,
  onClose,
  comments,
  videoTitle,
  onAddComment,
  onToggleCommentLike,
  onPlayTts,
  isTtsLoading = false,
}: CommentsDrawerProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [generatingAiThought, setGeneratingAiThought] = useState(false);
  const [activeSpeakingCommentId, setActiveSpeakingCommentId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim());
    setNewCommentText('');
  };

  const handleAiSuggestComment = async () => {
    try {
      setGeneratingAiThought(true);
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.1-flash-lite',
          role: 'copilot',
          messages: [
            {
              role: 'user',
              content: `Write a short, engaging 1-sentence YouTube Shorts comment for a video titled: "${videoTitle}". Make it positive, natural, and modern with an emoji.`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.reply) {
        // Strip outer quotes if any
        const cleaned = data.reply.replace(/^["']|["']$/g, '').trim();
        setNewCommentText(cleaned);
      }
    } catch (err) {
      console.error('Failed to generate AI comment:', err);
    } finally {
      setGeneratingAiThought(false);
    }
  };

  const handleListenComment = async (comment: CommentItem) => {
    setActiveSpeakingCommentId(comment.id);
    await onPlayTts(`${comment.author} says: ${comment.text}`);
    setActiveSpeakingCommentId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="comments-drawer-backdrop" className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
          {/* Dismiss overlay tap */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Drawer Sheet */}
          <motion.div
            id="comments-drawer-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 flex h-[70vh] max-h-[640px] w-full max-w-md flex-col rounded-t-3xl bg-neutral-900 text-white shadow-2xl border-t border-white/10"
          >
            {/* Grabber Handle */}
            <div className="flex w-full items-center justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Comments</h3>
                <span className="text-xs font-semibold text-neutral-400 bg-white/10 px-2 py-0.5 rounded-full">
                  {comments.length}
                </span>
              </div>
              <button
                id="close-comments-btn"
                onClick={onClose}
                className="rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close comments"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable comments list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 divide-y divide-white/5">
              {comments.map((comment) => {
                const isSpeakingThis = activeSpeakingCommentId === comment.id;
                return (
                  <div key={comment.id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 rounded-full object-cover shrink-0 border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-neutral-300">
                          @{comment.author}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {comment.timeAgo}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-100 break-words leading-relaxed">
                        {comment.text}
                      </p>

                      {/* Comment Actions */}
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => onToggleCommentLike(comment.id)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            comment.isLiked ? 'text-red-500 font-semibold' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${comment.isLiked ? 'fill-red-500' : ''}`} />
                          <span>{comment.likes + (comment.isLiked ? 1 : 0)}</span>
                        </button>

                        <button
                          onClick={() => handleListenComment(comment)}
                          disabled={isTtsLoading}
                          title="Listen with Gemini TTS"
                          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-blue-400 transition-colors"
                        >
                          {isSpeakingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                          <span>Read aloud</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comment input footer */}
            <div className="p-4 border-t border-white/10 bg-neutral-950/80">
              {/* Quick AI suggestion button */}
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  id="ai-suggest-comment-btn"
                  onClick={handleAiSuggestComment}
                  disabled={generatingAiThought}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-500/30 px-2.5 py-1 rounded-full transition-colors"
                >
                  {generatingAiThought ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>AI Comment Idea</span>
                </button>
                <span className="text-[11px] text-neutral-500">Gemini-assisted</span>
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  id="new-comment-input"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 rounded-full bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-red-500 border border-white/5"
                />
                <button
                  type="submit"
                  id="submit-comment-btn"
                  disabled={!newCommentText.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white disabled:bg-neutral-800 disabled:text-neutral-600 hover:bg-red-500 transition-colors shrink-0"
                  aria-label="Post comment"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
