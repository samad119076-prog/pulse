import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Image as ImageIcon, Sparkles, Loader2, Play, Pause, Download, Wand2, Check } from 'lucide-react';

interface AiCreatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoDescription: string;
  onSetCustomCover?: (imageUrl: string) => void;
}

export default function AiCreatorDrawer({
  isOpen,
  onClose,
  videoTitle,
  videoDescription,
  onSetCustomCover,
}: AiCreatorDrawerProps) {
  const [activeTab, setActiveTab] = useState<'tts' | 'image'>('tts');

  // TTS State
  const [ttsText, setTtsText] = useState(
    `Welcome to this YouTube Short! ${videoTitle}. Don't forget to like and subscribe for more daily content!`
  );
  const [ttsVoice, setTtsVoice] = useState('Kore');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [ttsAudioObj, setTtsAudioObj] = useState<HTMLAudioElement | null>(null);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState(
    `Epic cinematic 9:16 vertical poster for YouTube Short: ${videoTitle}, photorealistic, vibrant color grading, high detail`
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [coverApplied, setCoverApplied] = useState(false);

  const voices = [
    { id: 'Kore', name: 'Kore (Clear & Calm)', gender: 'Female' },
    { id: 'Puck', name: 'Puck (Playful & Lively)', gender: 'Male' },
    { id: 'Fenrir', name: 'Fenrir (Deep & Resonant)', gender: 'Male' },
    { id: 'Zephyr', name: 'Zephyr (Bright & Friendly)', gender: 'Neutral' },
    { id: 'Charon', name: 'Charon (Smooth & Narrator)', gender: 'Male' },
  ];

  const handleGenerateTts = async () => {
    if (!ttsText.trim() || ttsLoading) return;
    setTtsLoading(true);
    if (ttsAudioObj) {
      ttsAudioObj.pause();
      setIsPlayingTts(false);
    }

    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText, voice: ttsVoice }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setTtsAudioUrl(data.audioUrl);
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setIsPlayingTts(false);
        setTtsAudioObj(audio);
        audio.play();
        setIsPlayingTts(true);
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setTtsLoading(false);
    }
  };

  const togglePlayTtsAudio = () => {
    if (!ttsAudioObj) return;
    if (isPlayingTts) {
      ttsAudioObj.pause();
      setIsPlayingTts(false);
    } else {
      ttsAudioObj.play();
      setIsPlayingTts(true);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || imageLoading) return;
    setImageLoading(true);
    setCoverApplied(false);

    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          imageSize,
          aspectRatio: '9:16',
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('Image generation error:', err);
    } finally {
      setImageLoading(false);
    }
  };

  const handleApplyCover = () => {
    if (generatedImageUrl && onSetCustomCover) {
      onSetCustomCover(generatedImageUrl);
      setCoverApplied(true);
      setTimeout(() => setCoverApplied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="ai-creator-backdrop" className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            id="ai-creator-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 flex h-[82vh] max-h-[720px] w-full max-w-md flex-col rounded-t-3xl bg-neutral-900 text-white shadow-2xl border-t border-red-500/20"
          >
            {/* Grabber */}
            <div className="flex w-full items-center justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-500" />
                <h3 className="text-base font-bold">AI Studio Creator</h3>
              </div>
              <button
                id="close-ai-creator-btn"
                onClick={onClose}
                className="rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="grid grid-cols-2 p-1.5 mx-4 mt-3 rounded-xl bg-neutral-800 border border-white/5">
              <button
                id="ai-tts-tab"
                onClick={() => setActiveTab('tts')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'tts'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Volume2 className="h-4 w-4 text-red-400" />
                <span>AI Voiceover (TTS)</span>
              </button>
              <button
                id="ai-image-tab"
                onClick={() => setActiveTab('image')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'image'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ImageIcon className="h-4 w-4 text-purple-400" />
                <span>AI Visual Cover</span>
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeTab === 'tts' ? (
                /* TTS Section: gemini-3.1-flash-tts-preview */
                <div className="space-y-4">
                  <div className="rounded-xl bg-red-950/20 border border-red-500/20 p-3">
                    <p className="text-xs text-neutral-300">
                      Powered by <span className="font-semibold text-red-400">gemini-3.1-flash-tts-preview</span>. Generate ultra-natural speech narration for this Short.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Narration Script
                    </label>
                    <textarea
                      rows={3}
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder="Enter narration text to convert to speech..."
                      className="w-full rounded-xl bg-neutral-800 p-3 text-xs text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-red-500 border border-white/5 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Voice Persona
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {voices.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setTtsVoice(v.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                            ttsVoice === v.id
                              ? 'border-red-500 bg-red-950/40 text-white font-medium'
                              : 'border-white/5 bg-neutral-800/80 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{v.name}</span>
                          {ttsVoice === v.id && <Check className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    id="generate-tts-btn"
                    onClick={handleGenerateTts}
                    disabled={ttsLoading || !ttsText.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 py-3 text-xs font-bold transition-colors shadow-lg shadow-red-950/50"
                  >
                    {ttsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Synthesizing Voice with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        <span>Generate Voiceover Audio</span>
                      </>
                    )}
                  </button>

                  {/* Audio Result Player */}
                  {ttsAudioUrl && (
                    <div className="rounded-2xl bg-neutral-800 p-4 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={togglePlayTtsAudio}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
                          >
                            {isPlayingTts ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
                          </button>
                          <div>
                            <p className="text-xs font-semibold text-white">Voiceover Preview ({ttsVoice})</p>
                            <p className="text-[10px] text-neutral-400">24kHz Studio Quality WAV</p>
                          </div>
                        </div>

                        <a
                          href={ttsAudioUrl}
                          download="shorts-voiceover.wav"
                          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Save WAV</span>
                        </a>
                      </div>

                      <div className="h-1.5 w-full bg-neutral-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-red-500 rounded-full ${isPlayingTts ? 'animate-pulse w-3/4' : 'w-full'}`} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Image Generation Section: gemini-3-pro-image-preview with 1K, 2K, 4K size */
                <div className="space-y-4">
                  <div className="rounded-xl bg-purple-950/20 border border-purple-500/20 p-3">
                    <p className="text-xs text-neutral-300">
                      Powered by <span className="font-semibold text-purple-400">gemini-3-pro-image-preview</span>. Generate ultra high-definition vertical 9:16 artwork.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Visual Prompt
                    </label>
                    <textarea
                      rows={3}
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the high-quality vertical image you want to generate..."
                      className="w-full rounded-xl bg-neutral-800 p-3 text-xs text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-purple-500 border border-white/5 resize-none"
                    />
                  </div>

                  {/* Affordance for image size: 1K, 2K, 4K */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Resolution Affordance (High-Quality Pro)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1K', '2K', '4K'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          id={`size-btn-${size}`}
                          onClick={() => setImageSize(size)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                            imageSize === size
                              ? 'border-purple-500 bg-purple-950/40 text-white font-bold'
                              : 'border-white/5 bg-neutral-800/80 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span className="text-sm font-black text-purple-300">{size}</span>
                          <span className="text-[10px] text-neutral-500">
                            {size === '1K' ? '1024px' : size === '2K' ? '2048px' : '3840px Ultra'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    id="generate-image-btn"
                    onClick={handleGenerateImage}
                    disabled={imageLoading || !imagePrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 py-3 text-xs font-bold transition-colors shadow-lg shadow-purple-950/50"
                  >
                    {imageLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating {imageSize} Visual with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        <span>Generate {imageSize} Short Cover</span>
                      </>
                    )}
                  </button>

                  {/* Generated Image Result */}
                  {generatedImageUrl && (
                    <div className="rounded-2xl bg-neutral-800 p-3 border border-white/10 space-y-3">
                      <div className="relative aspect-[9/16] max-h-72 mx-auto overflow-hidden rounded-xl border border-white/10 bg-black">
                        <img
                          src={generatedImageUrl}
                          alt="AI Generated Cover"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-purple-300 backdrop-blur-xs">
                          {imageSize} UHD
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onSetCustomCover && (
                          <button
                            onClick={handleApplyCover}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 py-2 text-xs font-semibold text-white transition-colors"
                          >
                            {coverApplied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Sparkles className="h-3.5 w-3.5" />}
                            <span>{coverApplied ? 'Cover Applied!' : 'Set as Short Cover'}</span>
                          </button>
                        )}
                        <a
                          href={generatedImageUrl}
                          download={`gemini-${imageSize}-cover.png`}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-semibold text-white transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
