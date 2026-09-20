/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';
import { INITIAL_SHORTS } from './data/shortsData.ts';
import { VideoItem } from './types.ts';
import ShortVideoCard from './components/ShortVideoCard.tsx';
import TopNav from './components/TopNav.tsx';
import CommentsDrawer from './components/CommentsDrawer.tsx';
import ShareModal from './components/ShareModal.tsx';
import GeminiChatDrawer from './components/GeminiChatDrawer.tsx';
import AiCreatorDrawer from './components/AiCreatorDrawer.tsx';

export default function App() {
  const [shorts, setShorts] = useState<VideoItem[]>(INITIAL_SHORTS);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isDesktopFrame, setIsDesktopFrame] = useState<boolean>(true);

  // Active Modals & Drawers
  const [activeCommentsVideo, setActiveCommentsVideo] = useState<VideoItem | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<VideoItem | null>(null);
  const [activeChatVideo, setActiveChatVideo] = useState<VideoItem | null>(null);
  const [activeAiStudioVideo, setActiveAiStudioVideo] = useState<VideoItem | null>(null);

  // Custom AI covers generated per video
  const [customCovers, setCustomCovers] = useState<Record<string, string>>({});

  // Global TTS audio player state
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Play TTS audio generated via gemini-3.1-flash-tts-preview
  const handlePlayTts = async (text: string) => {
    try {
      setIsTtsLoading(true);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }

      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Kore' }),
      });

      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        currentAudioRef.current = audio;
        audio.play();
      }
    } catch (err) {
      console.error('Error in TTS playback:', err);
    } finally {
      setIsTtsLoading(false);
    }
  };

  // Intersection Observer Visibility handler:
  // Updates which short is actively 60% visible
  const handleVideoVisibleStateChange = useCallback((index: number, isVisible60: boolean) => {
    if (isVisible60) {
      setActiveIndex(index);
    }
  }, []);

  // Toggle Like state on a short
  const handleToggleLike = useCallback((videoId: string, forceState?: boolean) => {
    setShorts((prevShorts) =>
      prevShorts.map((short) => {
        if (short.id !== videoId) return short;
        const newLiked = forceState !== undefined ? forceState : !short.isLiked;
        return {
          ...short,
          isLiked: newLiked,
          likesCount: short.isLiked === newLiked
            ? short.likesCount
            : newLiked
            ? short.likesCount + 1
            : Math.max(0, short.likesCount - 1),
        };
      })
    );
  }, []);

  // Add Comment to active video
  const handleAddComment = (text: string) => {
    if (!activeCommentsVideo) return;
    const newComment = {
      id: `c-user-${Date.now()}`,
      author: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text,
      likes: 0,
      timeAgo: 'Just now',
      isLiked: false,
    };

    setShorts((prev) =>
      prev.map((s) => {
        if (s.id === activeCommentsVideo.id) {
          const updatedComments = [newComment, ...s.comments];
          return {
            ...s,
            comments: updatedComments,
            commentsCount: s.commentsCount + 1,
          };
        }
        return s;
      })
    );

    setActiveCommentsVideo((prev) =>
      prev ? { ...prev, comments: [newComment, ...prev.comments], commentsCount: prev.commentsCount + 1 } : null
    );
  };

  // Toggle like on comment
  const handleToggleCommentLike = (commentId: string) => {
    if (!activeCommentsVideo) return;
    setShorts((prev) =>
      prev.map((s) => {
        if (s.id === activeCommentsVideo.id) {
          const updatedComments = s.comments.map((c) =>
            c.id === commentId ? { ...c, isLiked: !c.isLiked } : c
          );
          return { ...s, comments: updatedComments };
        }
        return s;
      })
    );

    setActiveCommentsVideo((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments.map((c) =>
              c.id === commentId ? { ...c, isLiked: !c.isLiked } : c
            ),
          }
        : null
    );
  };

  const handleSetCustomCover = (imageUrl: string) => {
    if (activeAiStudioVideo) {
      setCustomCovers((prev) => ({
        ...prev,
        [activeAiStudioVideo.id]: imageUrl,
      }));
    }
  };

  const currentShort = shorts[activeIndex] || shorts[0];

  return (
    <div
      id="app-root-container"
      className="relative flex h-[100dvh] w-full items-center justify-center bg-neutral-950 text-white font-sans overflow-hidden select-none"
    >
      {/* Background ambient lighting matching current short */}
      <div className="absolute inset-0 z-0 bg-radial from-neutral-900 to-black opacity-80 pointer-events-none" />

      {/* Main Container:
          On mobile: 100vw x 100dvh full bleed.
          On desktop: toggleable between max-w-[420px] phone frame or full viewport.
          CSS scroll-snap-type 'y mandatory' enforces hard snapping between vertical screens!
      */}
      <div
        id="shorts-snap-viewport"
        style={{
          scrollSnapType: 'y mandatory',
        }}
        className={`relative z-10 h-[100dvh] w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory no-scrollbar transition-all duration-300 ${
          isDesktopFrame
            ? 'md:max-w-[430px] md:h-[94dvh] md:rounded-[36px] md:shadow-[0_0_60px_rgba(0,0,0,0.8)] md:border-[8px] md:border-neutral-800'
            : 'max-w-full'
        }`}
      >
        {/* Floating Top Navigation Header */}
        <TopNav
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          isDesktopFrame={isDesktopFrame}
          onToggleDesktopFrame={() => setIsDesktopFrame((prev) => !prev)}
          activeIndex={activeIndex}
          totalCount={shorts.length}
          onOpenAiStudio={() => {
            if (currentShort) setActiveAiStudioVideo(currentShort);
          }}
        />

        {/* Empty State: Shown when initialized with empty array ready for dynamic uploads */}
        {shorts.length === 0 && (
          <div
            id="empty-shorts-feed"
            className="relative flex h-[100dvh] w-full flex-col items-center justify-center p-6 text-center text-white"
          >
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-600/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">No Shorts Yet</h2>
            <p className="mt-2 max-w-xs text-xs text-neutral-400 leading-relaxed">
              The video feed has been cleared and initialized. Ready to receive dynamic uploads.
            </p>
          </div>
        )}

        {/* Vertical Feed: Each item snaps rigidly into view */}
        {shorts.map((video, idx) => (
          <ShortVideoCard
            key={video.id}
            video={video}
            index={idx}
            activeIndex={activeIndex}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted((prev) => !prev)}
            onToggleLike={handleToggleLike}
            onOpenComments={(v) => setActiveCommentsVideo(v)}
            onOpenShare={(v) => setActiveShareVideo(v)}
            onOpenChat={(v) => setActiveChatVideo(v)}
            onOpenAiStudio={(v) => setActiveAiStudioVideo(v)}
            onVideoVisibleStateChange={handleVideoVisibleStateChange}
            customCoverUrl={customCovers[video.id]}
          />
        ))}
      </div>

      {/* Comments Drawer */}
      {activeCommentsVideo && (
        <CommentsDrawer
          isOpen={!!activeCommentsVideo}
          onClose={() => setActiveCommentsVideo(null)}
          comments={activeCommentsVideo.comments}
          videoTitle={activeCommentsVideo.description}
          onAddComment={handleAddComment}
          onToggleCommentLike={handleToggleCommentLike}
          onPlayTts={handlePlayTts}
          isTtsLoading={isTtsLoading}
        />
      )}

      {/* Share Modal */}
      {activeShareVideo && (
        <ShareModal
          isOpen={!!activeShareVideo}
          onClose={() => setActiveShareVideo(null)}
          videoTitle={activeShareVideo.description}
          videoUrl={activeShareVideo.videoUrl}
          userHandle={activeShareVideo.userHandle}
        />
      )}

      {/* Gemini Chatbot Drawer */}
      {activeChatVideo && (
        <GeminiChatDrawer
          isOpen={!!activeChatVideo}
          onClose={() => setActiveChatVideo(null)}
          videoTitle={activeChatVideo.description}
          creatorHandle={activeChatVideo.userHandle}
          onPlayTts={handlePlayTts}
          isTtsLoading={isTtsLoading}
        />
      )}

      {/* AI Studio Creator (TTS Voiceover & 1K/2K/4K Visual Cover Generator) */}
      {activeAiStudioVideo && (
        <AiCreatorDrawer
          isOpen={!!activeAiStudioVideo}
          onClose={() => setActiveAiStudioVideo(null)}
          videoTitle={activeAiStudioVideo.soundTitle}
          videoDescription={activeAiStudioVideo.description}
          onSetCustomCover={handleSetCustomCover}
        />
      )}
    </div>
  );
}
