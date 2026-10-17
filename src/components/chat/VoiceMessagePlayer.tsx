import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { formatAudioDuration } from '../../lib/audio';

interface VoiceMessagePlayerProps {
  mediaUrl?: string;
  duration?: number;
  isSender: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  mediaUrl,
  duration = 4,
  isSender,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 26 waveform bars
  const bars = [
    30, 55, 45, 80, 65, 95, 40, 75, 60, 90, 85, 45,
    70, 95, 40, 60, 85, 55, 75, 95, 65, 45, 75, 50, 65, 40
  ];

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [mediaUrl]);

  const getOrCreateAudio = () => {
    if (audioRef.current) return audioRef.current;
    if (!mediaUrl) return null;
    const audio = new Audio(mediaUrl);
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    return audio;
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (!mediaUrl) return;

    try {
      setIsLoading(true);
      const audio = getOrCreateAudio();
      if (!audio) {
        setIsLoading(false);
        return;
      }
      audio.playbackRate = playbackSpeed;
      setIsLoading(false);
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio playback error:', err);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaUrl || !totalDuration) return;
    const audio = getOrCreateAudio();
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * totalDuration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3.5 p-0.5 sm:p-1 w-full min-w-0 max-w-full select-none ${
        isSender ? 'text-white' : 'text-slate-900'
      }`}
    >
      {/* Play / Pause button */}
      <button
        type="button"
        onClick={togglePlayback}
        disabled={isLoading}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-sm active:scale-95 ${
          isSender
            ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-indigo-900/10'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform and progress */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div
          onClick={handleSeek}
          className="h-7 sm:h-8 flex items-center gap-[2.5px] sm:gap-[3.5px] cursor-pointer group overflow-hidden"
          title="Click or drag to seek"
        >
          {bars.map((heightPercent, idx) => {
            const barProgress = (idx / bars.length) * 100;
            const isPlayed = barProgress <= progressPercent;

            return (
              <span
                key={idx}
                style={{ height: `${heightPercent * 0.28}px` }}
                className={`w-[2.5px] sm:w-[3.5px] flex-shrink-0 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? isSender
                      ? `bg-white ${isPlaying ? 'scale-y-110' : ''}`
                      : `bg-indigo-600 ${isPlaying ? 'scale-y-110' : ''}`
                    : isSender
                    ? 'bg-indigo-300/60 group-hover:bg-indigo-300'
                    : 'bg-slate-300 group-hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>

        {/* Timestamps & Speed Multiplier */}
        <div
          className={`flex items-center justify-between text-[10px] sm:text-xs font-mono font-semibold mt-1 ${
            isSender ? 'text-indigo-100' : 'text-slate-500'
          }`}
        >
          <span>{formatAudioDuration(currentTime)}</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeed}
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold font-sans tracking-wide transition-all cursor-pointer active:scale-95 ${
                isSender
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Toggle playback speed (1x, 1.5x, 2x)"
            >
              {playbackSpeed}x
            </button>
            <span>{formatAudioDuration(totalDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
