import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageSquare,
  Share2,
  Music,
  Play,
  Pause,
  VolumeX,
  Volume2,
  Sparkles,
  Bot,
  Check,
  Plus,
} from 'lucide-react';
import { VideoItem } from '../types.ts';
import HeartBurst from './HeartBurst.tsx';

interface ShortVideoCardProps {
  video: VideoItem;
  index: number;
  activeIndex: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleLike: (id: string, forceState?: boolean) => void;
  onOpenComments: (video: VideoItem) => void;
  onOpenShare: (video: VideoItem) => void;
  onOpenChat: (video: VideoItem) => void;
  onOpenAiStudio: (video: VideoItem) => void;
  onVideoVisibleStateChange: (index: number, isVisible60: boolean) => void;
  customCoverUrl?: string;
}

export default function ShortVideoCard({
  video,
  index,
  activeIndex,
  isMuted,
  onToggleMute,
  onToggleLike,
  onOpenComments,
  onOpenShare,
  onOpenChat,
  onOpenAiStudio,
  onVideoVisibleStateChange,
  customCoverUrl,
}: ShortVideoCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPauseFeedback, setShowPlayPauseFeedback] = useState<'play' | 'pause' | null>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(video.isSubscribed || false);
  const [progress, setProgress] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Aggressive Preload mechanic requirement:
  // "when video index N is actively playing and visible on the screen,
  // programmatically inject a preload="auto" attribute or pre-fetch network request for video index N+1 and N+2 in the background."
  const shouldPreloadAuto = index <= activeIndex + 2;

  // Set up Intersection Observer:
  // "An Intersection Observer system that automatically triggers .play() on a HTML5 video element when it becomes 60% visible on screen,
  // and instantly pauses and resets the video to 0 seconds when it is scrolled away."
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isAtLeast60PercentVisible = entry.intersectionRatio >= 0.6;
          const vid = videoRef.current;

          if (isAtLeast60PercentVisible) {
            onVideoVisibleStateChange(index, true);
            if (vid) {
              // Trigger .play()
              const playPromise = vid.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setIsPlaying(true);
                  })
                  .catch((err) => {
                    console.warn('Auto-play was blocked or interrupted:', err);
                    setIsPlaying(false);
                  });
              }
            }
          } else {
            onVideoVisibleStateChange(index, false);
            if (vid) {
              // Instantly pauses and resets the video to 0 seconds when it is scrolled away
              vid.pause();
              vid.currentTime = 0;
              setIsPlaying(false);
              setProgress(0);
            }
          }
        });
      },
      {
        threshold: [0, 0.59, 0.6, 1.0],
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [index, onVideoVisibleStateChange]);

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Aggressive background network prefetch for N+1 and N+2
  useEffect(() => {
    if (shouldPreloadAuto && videoRef.current) {
      // Injects preload="auto" attribute
      videoRef.current.preload = 'auto';

      // Perform background network pre-fetch if next in queue
      if (index === activeIndex + 1 || index === activeIndex + 2) {
        try {
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.as = 'video';
          prefetchLink.href = video.videoUrl;
          document.head.appendChild(prefetchLink);
        } catch {
          // Pre-fetch hint best-effort
        }
      }
    }
  }, [shouldPreloadAuto, index, activeIndex, video.videoUrl]);

  // Handle double-tap and single-tap gestures
  const triggerDoubleTapHeart = useCallback(() => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);

    // Programmatically toggles the 'Like' button state to active
    onToggleLike(video.id, true);
  }, [onToggleLike, video.id]);

  const handlePointerDown = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < 320 && timeSinceLastTap > 0) {
      // Double tap confirmed!
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      triggerDoubleTapHeart();
    } else {
      lastTapTimeRef.current = now;
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
      tapTimerRef.current = setTimeout(() => {
        // Single tap -> toggle play/pause
        togglePlayPause();
        lastTapTimeRef.current = 0;
      }, 300);
    }
  };

  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
      setShowPlayPauseFeedback('play');
    } else {
      vid.pause();
      setIsPlaying(false);
      setShowPlayPauseFeedback('pause');
    }

    setTimeout(() => {
      setShowPlayPauseFeedback(null);
    }, 600);
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (vid && vid.duration) {
      setProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div
      ref={containerRef}
      id={`short-slide-${video.id}`}
      className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black flex items-center justify-center select-none"
    >
      {/* Background Poster / AI Custom Cover */}
      {(customCoverUrl || video.posterUrl) && (
        <img
          src={customCoverUrl || video.posterUrl}
          alt={video.description}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-90 transition-opacity duration-500"
        />
      )}

      {/* Main HTML5 Video Element */}
      <video
        ref={videoRef}
        id={`video-element-${video.id}`}
        src={video.videoUrl}
        poster={customCoverUrl || video.posterUrl}
        preload={shouldPreloadAuto ? 'auto' : 'metadata'}
        playsInline
        loop
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={() => {
          setIsVideoLoaded(true);
          setHasError(false);
        }}
        onCanPlay={() => {
          setIsVideoLoaded(true);
          setHasError(false);
        }}
        onError={() => setHasError(true)}
        className="h-full w-full object-cover pointer-events-none z-10"
      />

      {/* Elegant buffering spinner while video initial frames load */}
      {!isVideoLoaded && !hasError && (
        <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none bg-black/30 backdrop-blur-[2px]">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-3 border-white/20 border-t-red-600 animate-spin" />
            <div className="absolute h-5 w-5 rounded-full bg-red-600/30" />
          </div>
        </div>
      )}

      {/* Fallback Display if video network error occurs */}
      {hasError && (
        <div className="absolute inset-0 z-15 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 via-black/90 to-black text-white p-6 text-center">
          <div className="relative mb-3">
            <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center border border-red-500/40">
              <Play className="w-6 h-6 text-red-500 fill-red-500 ml-0.5" />
            </div>
          </div>
          <p className="text-sm font-bold">{video.displayName}</p>
          <p className="text-xs text-neutral-400 mt-1 max-w-[260px] line-clamp-2">{video.description}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="mt-3 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all shadow-md active:scale-95"
          >
            Retry Playback
          </button>
        </div>
      )}

      {/* Double Tap & Single Tap Touch Surface */}
      <div
        id={`video-touch-surface-${video.id}`}
        onPointerDown={handlePointerDown}
        onDoubleClick={triggerDoubleTapHeart}
        className="absolute inset-0 z-20 cursor-pointer"
        aria-label="Video interaction surface (double tap to like, single tap to play/pause)"
      />

      {/* Scale-up 'Heart Burst' Animation on double tap */}
      <HeartBurst show={showHeartBurst} />

      {/* Center Play / Pause Animated Feedback Icon */}
      <AnimatePresence>
        {showPlayPauseFeedback && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute z-40 flex h-20 w-20 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-2xl"
          >
            {showPlayPauseFeedback === 'play' ? (
              <Play className="h-10 w-10 fill-white ml-1" />
            ) : (
              <Pause className="h-10 w-10 fill-white" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Vignette Overlays for Crisp Overlay Readability */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-72 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-black/70 to-transparent" />

      {/* Bottom-Left Overlay */}
      <div
        id={`bottom-left-overlay-${video.id}`}
        className="pointer-events-auto absolute bottom-4 left-3.5 right-18 z-30 flex flex-col items-start text-white text-left max-w-[calc(100%-80px)]"
      >
        {/* Creator Identity & Subscribe Button */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={video.userAvatar}
            alt={video.displayName}
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover border-2 border-white/80 shadow-md"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white drop-shadow-md">
                {video.userHandle}
              </span>
              {video.isVerified && (
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-white">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}
            </div>
          </div>

          <button
            id={`subscribe-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsSubscribed((prev) => !prev);
            }}
            className={`ml-1 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
              isSubscribed
                ? 'bg-neutral-800/90 text-neutral-300 border border-white/20'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>

        {/* Short Description with Expandable '...more' */}
        <div className="mb-2.5 text-xs text-neutral-100 drop-shadow leading-relaxed">
          <p className={isDescriptionExpanded ? '' : 'line-clamp-2'}>
            {video.description}
          </p>
          {video.tags && video.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5 font-semibold text-neutral-300">
              {video.tags.map((tag, tIdx) => (
                <span key={tIdx} className="hover:underline cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDescriptionExpanded((prev) => !prev);
            }}
            className="mt-0.5 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors"
          >
            {isDescriptionExpanded ? 'less' : '...more'}
          </button>
        </div>

        {/* Audio / Music Track Scrolling Ticker */}
        <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-neutral-200 border border-white/10 max-w-full overflow-hidden">
          <Music className="h-3 w-3 shrink-0 text-red-400" />
          <div className="overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-marquee whitespace-nowrap">
              {video.soundTitle} • {video.soundAuthor}
            </div>
          </div>
        </div>
      </div>

      {/* Right-Side Floating Sidebar Overlay */}
      <aside
        id={`right-sidebar-overlay-${video.id}`}
        className="pointer-events-auto absolute bottom-4 right-2.5 z-30 flex flex-col items-center gap-4 text-white"
        aria-label="Video actions"
      >
        {/* 1. Like Button (Heart Icon) */}
        <div className="flex flex-col items-center">
          <button
            id={`like-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(video.id);
            }}
            aria-label="Like video"
            className={`group relative flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-80 ${
              video.isLiked
                ? 'bg-red-600/90 text-white shadow-lg shadow-red-600/50'
                : 'bg-black/50 text-white hover:bg-black/70 border border-white/15'
            }`}
          >
            <motion.div
              animate={video.isLiked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  video.isLiked ? 'fill-white text-white' : 'text-white group-hover:text-red-400'
                }`}
              />
            </motion.div>
          </button>
          <span className="mt-1 text-[11px] font-bold tracking-tight text-white drop-shadow">
            {formatNumber(video.likesCount + (video.isLiked ? 1 : 0))}
          </span>
        </div>

        {/* 2. Comment Button */}
        <div className="flex flex-col items-center">
          <button
            id={`comment-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(video);
            }}
            aria-label="Open comments"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/15 transition-all active:scale-90"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <span className="mt-1 text-[11px] font-bold tracking-tight text-white drop-shadow">
            {formatNumber(video.commentsCount)}
          </span>
        </div>

        {/* 3. Share Button */}
        <div className="flex flex-col items-center">
          <button
            id={`share-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(video);
            }}
            aria-label="Share video"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/15 transition-all active:scale-90"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <span className="mt-1 text-[11px] font-bold tracking-tight text-white drop-shadow">
            {formatNumber(video.sharesCount)}
          </span>
        </div>

        {/* 4. Gemini AI Co-Pilot Chatbot Button */}
        <div className="flex flex-col items-center">
          <button
            id={`ai-chat-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat(video);
            }}
            title="Chat with Gemini about this Short"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 backdrop-blur-md text-white border border-purple-400/40 shadow-lg shadow-purple-900/40 transition-all active:scale-90"
          >
            <Bot className="h-5 w-5" />
          </button>
          <span className="mt-1 text-[10px] font-bold text-purple-300 drop-shadow">
            AI Chat
          </span>
        </div>

        {/* 5. AI Studio Creator (TTS & Visuals) */}
        <div className="flex flex-col items-center">
          <button
            id={`ai-studio-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAiStudio(video);
            }}
            title="AI Voiceover TTS & Visual Covers"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-red-600/90 to-rose-600/90 hover:from-red-500 hover:to-rose-500 backdrop-blur-md text-white border border-red-400/40 shadow-lg shadow-red-900/40 transition-all active:scale-90"
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <span className="mt-1 text-[10px] font-bold text-red-300 drop-shadow">
            Remix AI
          </span>
        </div>

        {/* 6. Rotating Sound Vinyl Disc / Album Art */}
        <div className="mt-1">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-neutral-700 bg-neutral-900 p-0.5 shadow-lg ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '4s' }}
            title="Toggle Sound"
          >
            <img
              src={video.soundAvatar || video.userAvatar}
              alt={video.soundAuthor}
              referrerPolicy="no-referrer"
              className="h-full w-full rounded-full object-cover"
            />
            {isMuted && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                <VolumeX className="h-3.5 w-3.5 text-neutral-300" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Scrubber Timeline Progress Bar at the very bottom */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-40 h-1 bg-white/20">
        <div
          className="h-full bg-red-600 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
