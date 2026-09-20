import { Volume2, VolumeX, Smartphone, Monitor, Zap, Sparkles } from 'lucide-react';

interface TopNavProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isDesktopFrame: boolean;
  onToggleDesktopFrame: () => void;
  activeIndex: number;
  totalCount: number;
  onOpenAiStudio: () => void;
}

export default function TopNav({
  isMuted,
  onToggleMute,
  isDesktopFrame,
  onToggleDesktopFrame,
  activeIndex,
  totalCount,
  onOpenAiStudio,
}: TopNavProps) {
  return (
    <header
      id="shorts-top-nav"
      className="pointer-events-none absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
    >
      {/* Left: YouTube Shorts Logo branding */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-red-600 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-xs font-black tracking-tight text-white">Shorts</span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {totalCount > 0 ? `${activeIndex + 1}/${totalCount}` : '0/0'}
          </span>
        </div>

        {/* Preload Engine telemetry pill */}
        {totalCount > 0 && (
          <div
            title="Zero-latency aggressive preloader: N+1 and N+2 cached"
            className="hidden sm:flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md"
          >
            <Zap className="h-3 w-3 animate-pulse" />
            <span>Preload N+1, N+2 Active</span>
          </div>
        )}
      </div>

      {/* Right: Sound toggle, Desktop Frame switch, AI Studio trigger */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        <button
          id="toggle-ai-studio-btn"
          onClick={onOpenAiStudio}
          title="Open AI Studio (TTS & Visuals)"
          className="flex items-center gap-1 rounded-full bg-red-600/80 hover:bg-red-600 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white transition-transform active:scale-95 shadow-md border border-red-400/30"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">AI Studio</span>
        </button>

        {/* Mute/Unmute sound button */}
        <button
          id="toggle-sound-btn"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
          className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md text-white transition-all active:scale-95 border ${
            isMuted
              ? 'bg-black/50 border-white/10 hover:bg-black/70'
              : 'bg-red-600/80 border-red-500/50 shadow-md'
          }`}
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-neutral-300" /> : <Volume2 className="h-4 w-4 text-white" />}
        </button>

        {/* Desktop frame toggle for responsive inspection */}
        <button
          id="toggle-frame-mode-btn"
          onClick={onToggleDesktopFrame}
          title={isDesktopFrame ? 'Switch to Full Screen Viewport' : 'Switch to Mobile Frame Mode'}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-neutral-300 hover:text-white border border-white/10 transition-all active:scale-95"
        >
          {isDesktopFrame ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
