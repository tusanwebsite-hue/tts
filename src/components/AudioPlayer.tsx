import React, { useRef, useEffect, useState, useId } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Download, Volume2, VolumeX, Sparkles, Music } from 'lucide-react';

interface AudioPlayerProps {
  audioBase64: string | null;
  mimeType?: string;
  voiceName: string;
  styleName: string;
  sentences?: string[];
  durationEstimated?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBase64,
  mimeType = 'audio/wav',
  voiceName,
  styleName,
  sentences = [],
  durationEstimated = 15,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);

  const seekInputId = useId();
  const volumeInputId = useId();

  // Create audio URL from base64
  const audioUrl = React.useMemo(() => {
    if (!audioBase64) return null;
    return `data:${mimeType};base64,${audioBase64}`;
  }, [audioBase64, mimeType]);

  // Audio setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;
    audio.load();

    const handleLoadedMetadata = () => {
      setDuration(audio.duration && !isNaN(audio.duration) ? audio.duration : durationEstimated);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (sentences.length > 0 && audio.duration) {
        const progress = audio.currentTime / audio.duration;
        const index = Math.min(
          sentences.length - 1,
          Math.floor(progress * sentences.length)
        );
        setActiveSentenceIndex(index);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setActiveSentenceIndex(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, durationEstimated, sentences.length]);

  // Handle Play / Pause
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Connect Web Audio API for visualizer upon first user interaction
    if (!audioCtxRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceNodeRef.current = source;
      } catch (e) {
        console.warn('AudioContext visualization setup error:', e);
      }
    }

    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio play error:', err);
      }
    }
  };

  // Skip forward / backward
  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(duration, audioRef.current.currentTime + seconds)
    );
  };

  // Change speed
  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Download WAV file
  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `gemini-tts-${voiceName}-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Canvas Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = 48;
    const dataArray = new Uint8Array(32);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bars) - 2;

      for (let i = 0; i < bars; i++) {
        let value = 20;
        if (isPlaying) {
          if (analyserRef.current) {
            const freqIndex = Math.floor((i / bars) * 24);
            value = (dataArray[freqIndex] / 255) * height * 0.9;
          } else {
            // Simulated waveform based on sine wave
            value = Math.sin(Date.now() * 0.005 + i * 0.3) * (height * 0.4) + height * 0.45;
          }
        } else {
          // Subtle idle wave pattern
          value = Math.abs(Math.sin(i * 0.25)) * (height * 0.25) + 6;
        }

        const barHeight = Math.max(4, value);
        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const isCurrentProgress = (i / bars) <= (currentTime / (duration || 1));

        // Create gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isCurrentProgress) {
          gradient.addColorStop(0, '#38bdf8'); // sky-400
          gradient.addColorStop(1, '#818cf8'); // indigo-400
        } else {
          gradient.addColorStop(0, '#334155'); // slate-700
          gradient.addColorStop(1, '#1e293b'); // slate-800
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration]);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!audioBase64) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center text-slate-400">
        <Music className="w-10 h-10 mx-auto mb-2 text-slate-600 animate-pulse" />
        <p className="text-sm font-medium">هنوز فایلی صوتی تولید نشده است.</p>
        <p className="text-xs text-slate-500 mt-1">با کلیک روی دکمه «تولید صوت»، صدای گوینده Gemini ایجاد می‌شود.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl transition-all">
      <audio ref={audioRef} />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-emerald-400 opacity-75' : 'bg-indigo-400 opacity-40'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              پخش‌کننده استودیویی Gemini 3.8 Flash TTS
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                صدا: {voiceName}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              کیفیت صوتی ۲۴ کیلوهرتز (WAV Studio Master) • سبک: {styleName}
            </p>
          </div>
        </div>

        <button
          onClick={downloadAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition shadow-sm"
          title="دانلود فایل صوتی WAV"
        >
          <Download className="w-3.5 h-3.5" />
          دانلود WAV
        </button>
      </div>

      {/* Waveform Visualizer Canvas */}
      <div className="relative bg-slate-950/80 rounded-xl p-3 border border-slate-800 mb-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-20 block cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            if (audioRef.current && duration) {
              audioRef.current.currentTime = clickPos * duration;
            }
          }}
        />
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="text-slate-500 text-xs">برای جابجایی روی موج کلیک کنید</span>
          <span className="font-mono">{formatTime(duration || durationEstimated)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => skip(-5)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="۵ ثانیه عقب"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
            title={isPlaying ? 'توقف' : 'پخش'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 mr-0.5" />}
          </button>

          <button
            onClick={() => skip(5)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="۵ ثانیه جلو"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Playback Speed selector */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          {[0.8, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => changeSpeed(rate)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                playbackRate === rate
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume & Seek Slider */}
        <div className="flex items-center gap-2 text-slate-400">
          <button
            onClick={() => {
              const audio = audioRef.current;
              if (!audio) return;
              audio.muted = !isMuted;
              setIsMuted(!isMuted);
            }}
            aria-label={isMuted ? 'صدا وصل شد' : 'بی‌صدا'}
            className="hover:text-slate-200 transition"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <label htmlFor={volumeInputId} className="sr-only">میزان صدا</label>
          <input
            id={volumeInputId}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              setIsMuted(val === 0);
              if (audioRef.current) {
                audioRef.current.volume = val;
              }
            }}
            className="w-16 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Synchronized sentences tracking (Karaoke effect) */}
      {sentences.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            جمله در حال خوانش توسط گوینده:
          </span>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-sm leading-relaxed min-h-[48px] flex items-center transition-colors">
            <p className="text-indigo-200 font-medium">
              «{sentences[activeSentenceIndex] || sentences[0]}»
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
