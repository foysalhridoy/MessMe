import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send } from 'lucide-react';
import { formatAudioDuration } from '../../lib/audio';
import { useChat } from '../../context/ChatContext';

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const { showToast } = useChat();
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    setSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media recording devices not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);

      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.warn('Microphone error:', err);
      showToast('Microphone permission required to record voice notes', 'warning');
      cleanup();
      onCancel();
    }
  };

  const handleStopAndSend = () => {
    const finalDuration = Math.max(1, seconds);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        cleanup();
        onSend(audioBlob, finalDuration);
      };
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
      onCancel();
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  return (
    <div className="flex items-center justify-between gap-3 p-2 bg-rose-50/70 border border-rose-200/80 rounded-2xl animate-in fade-in select-none w-full">
      {/* Live recording indicator */}
      <div className="flex items-center gap-2.5 pl-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>

        <span className="text-sm font-mono font-bold text-rose-700 min-w-[40px]">
          {formatAudioDuration(seconds)}
        </span>

        {/* Live Audio wave bars */}
        <div className="flex items-center gap-[3px] h-5">
          <span className="w-1 bg-rose-500 rounded-full animate-wave-bar" style={{ animationDelay: '0ms', height: '60%' }} />
          <span className="w-1 bg-rose-500 rounded-full animate-wave-bar" style={{ animationDelay: '200ms', height: '100%' }} />
          <span className="w-1 bg-rose-500 rounded-full animate-wave-bar" style={{ animationDelay: '400ms', height: '40%' }} />
          <span className="w-1 bg-rose-500 rounded-full animate-wave-bar" style={{ animationDelay: '100ms', height: '80%' }} />
          <span className="w-1 bg-rose-500 rounded-full animate-wave-bar" style={{ animationDelay: '300ms', height: '50%' }} />
        </div>

        <span className="text-xs font-semibold text-rose-600 hidden sm:inline">
          Recording audio note...
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
          title="Cancel recording"
          aria-label="Cancel recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
