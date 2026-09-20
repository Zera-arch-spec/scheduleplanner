import { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, RotateCcw, X, Loader2, Sparkles, Check } from 'lucide-react';
import { Plan } from '../types';

interface AudioBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: Plan[];
  selectedDate: string;
}

export const AudioBriefingModal = ({
  isOpen,
  onClose,
  plans,
  selectedDate,
}: AudioBriefingModalProps) => {
  const [voiceName, setVoiceName] = useState('Kore');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [briefingText, setBriefingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate default daily script from plans
  useEffect(() => {
    if (!isOpen) return;
    const dayPlans = plans.filter((p) => p.date === selectedDate);
    let text = `Here is your schedule briefing for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}. `;

    if (dayPlans.length === 0) {
      text += `You currently have no scheduled plans for this date. It's a great opportunity for deep focus or team coordination.`;
    } else {
      text += `You have ${dayPlans.length} collaborative ${dayPlans.length === 1 ? 'plan' : 'plans'} scheduled. `;
      dayPlans.forEach((p, idx) => {
        const timeStr = p.timeStart ? `at ${p.timeStart}${p.timeEnd ? ` to ${p.timeEnd}` : ''}` : 'during the day';
        text += `Item ${idx + 1}: ${p.title}, scheduled ${timeStr}. `;
        const descBlock = p.blocks.find((b) => b.type === 'text');
        if (descBlock && 'content' in descBlock && descBlock.content) {
          text += `${descBlock.content.slice(0, 100)}. `;
        }
      });
      text += `Have a productive and collaborative day!`;
    }
    setBriefingText(text);
    setAudioUrl(null);
    setIsPlaying(false);
    setError(null);
  }, [isOpen, selectedDate, plans]);

  const handleGenerateAudio = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: briefingText,
          voiceName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize speech audio.');
      }
      setAudioUrl(data.audioUrl);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini TTS.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="audio-briefing-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display text-base">Daily Schedule Audio Briefing</h3>
              <p className="text-xs text-slate-500">Synthesized with Gemini TTS (gemini-3.1-flash-tts-preview)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Briefing Script (Customizable)</label>
              <span className="text-[10px] text-slate-400">Date: {selectedDate}</span>
            </div>
            <textarea
              value={briefingText}
              onChange={(e) => setBriefingText(e.target.value)}
              rows={4}
              className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              placeholder="Enter briefing text..."
            />
          </div>

          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Voice Persona</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Kore', label: 'Kore (Warm)' },
                { id: 'Puck', label: 'Puck (Upbeat)' },
                { id: 'Zephyr', label: 'Zephyr (Calm)' },
                { id: 'Fenrir', label: 'Fenrir (Deep)' },
                { id: 'Charon', label: 'Charon (Narrative)' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoiceName(v.id)}
                  className={`px-3 py-2 text-xs rounded-xl border font-medium text-left transition-all ${
                    voiceName === v.id
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 font-semibold ring-1 ring-indigo-500/30'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{v.label}</span>
                    {voiceName === v.id && <Check className="w-3 h-3 text-indigo-600" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Audio Player Card */}
          {audioUrl && (
            <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-transform active:scale-95 shadow-md shadow-indigo-500/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {isPlaying ? 'Playing Audio Briefing...' : 'Audio Ready'}
                  </div>
                  <div className="text-[11px] text-slate-500">Voice: {voiceName} • 24kHz Studio Output</div>
                </div>
              </div>
              <button
                onClick={handleReplay}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-white transition-colors"
                title="Replay from start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Gemini Multimodal Speech</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              id="generate-tts-btn"
              onClick={handleGenerateAudio}
              disabled={loading || !briefingText.trim()}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Synthesizing Speech...
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  {audioUrl ? 'Regenerate Briefing' : 'Generate & Listen'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
