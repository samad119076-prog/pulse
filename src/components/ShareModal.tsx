import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, Send, MessageCircle, Link2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoUrl: string;
  userHandle: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  videoTitle,
  videoUrl,
  userHandle,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: videoTitle,
          text: `Check out this Short by ${userHandle}!`,
          url: window.location.href,
        });
        onClose();
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="share-modal-backdrop" className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            id="share-modal-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-md rounded-t-3xl bg-neutral-900 text-white p-6 shadow-2xl border-t border-white/10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold">Share Short</h3>
              <button
                id="close-share-btn"
                onClick={onClose}
                className="rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Share Icons */}
            <div className="grid grid-cols-4 gap-4 py-6 text-center">
              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="h-12 w-12 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-red-500/30">
                  <Share2 className="h-5 w-5" />
                </div>
                <span className="text-xs text-neutral-300">Share via...</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="h-12 w-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                  {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Link2 className="h-5 w-5" />}
                </div>
                <span className="text-xs text-neutral-300">{copied ? 'Copied!' : 'Copy link'}</span>
              </button>

              <button
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(videoTitle)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                  onClose();
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                  <Send className="h-5 w-5" />
                </div>
                <span className="text-xs text-neutral-300">X (Twitter)</span>
              </button>

              <button
                onClick={() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent(`${videoTitle} ${window.location.href}`)}`, '_blank');
                  onClose();
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="h-12 w-12 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/30">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="text-xs text-neutral-300">WhatsApp</span>
              </button>
            </div>

            {/* Direct copy link field */}
            <div className="flex items-center gap-2 rounded-xl bg-neutral-800 p-2 border border-white/5">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent px-2 text-xs text-neutral-400 outline-none truncate"
              />
              <button
                id="copy-short-link-btn"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
