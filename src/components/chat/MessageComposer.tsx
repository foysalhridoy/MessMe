import React, { useState, useEffect, useRef } from 'react';
import { Smile, Mic, Send, X, CornerDownRight, Image as ImageIcon, Ban } from 'lucide-react';
import { useChat } from '../../context/useChat';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';

export const MessageComposer: React.FC = () => {
  const {
    activeConversation,
    sendText,
    sendVoice,
    sendImageMessage,
    replyingTo,
    cancelReply,
    drafts,
    setDraftForConversation,
    notifyTyping,
    isBlocked,
    unblockUser,
  } = useChat();

  const [text, setText] = useState(() => (activeConversation ? drafts[activeConversation.id] || '' : ''));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (activeConversation) {
      setDraftForConversation(activeConversation.id, val);
    }

    notifyTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      notifyTyping(false);
    }, 2000);
  };

  const handleSend = async () => {
    if ((!text.trim() && !imagePreview) || isRecordingVoice) return;

    if (imagePreview) {
      await sendImageMessage(imagePreview, text.trim());
      setImagePreview(null);
      setText('');
      if (activeConversation) setDraftForConversation(activeConversation.id, '');
      return;
    }

    const content = text;
    setText('');
    if (activeConversation) {
      setDraftForConversation(activeConversation.id, '');
    }
    notifyTyping(false);
    await sendText(content);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!textareaRef.current) {
      setText((prev) => prev + emoji);
      return;
    }
    const start = textareaRef.current.selectionStart || text.length;
    const end = textareaRef.current.selectionEnd || text.length;
    const updated = text.substring(0, start) + emoji + text.substring(end);
    setText(updated);
    if (activeConversation) {
      setDraftForConversation(activeConversation.id, updated);
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVoiceSend = async (blob: Blob, duration: number) => {
    setIsRecordingVoice(false);
    await sendVoice(blob, duration);
  };

  if (!activeConversation) return null;

  const isOtherUserBlocked = isBlocked(activeConversation.otherParticipant.userId);

  if (isOtherUserBlocked) {
    return (
      <div className="p-4 sm:p-5 bg-slate-50/90 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left select-none animate-in fade-in">
        <div className="flex items-center gap-2.5 text-slate-700">
          <Ban className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">
            You have blocked <span className="font-bold text-slate-900">@{activeConversation.otherParticipant.username}</span>. You cannot send or receive messages.
          </p>
        </div>
        <button
          onClick={() => unblockUser(activeConversation.otherParticipant.userId)}
          className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
        >
          Unblock User
        </button>
      </div>
    );
  }

  return (
    <div className="relative border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-2 sm:px-4 md:px-8 pt-2 sm:pt-2.5 pb-[max(0.6rem,calc(env(safe-area-inset-bottom,0px)+0.4rem))] select-none flex-shrink-0 z-20">
      {/* 1. Quoted Reply Header if Replying */}
      {replyingTo && (
        <div className="mb-2 p-2.5 sm:p-3 bg-slate-50 border border-indigo-200/70 rounded-2xl flex items-center justify-between gap-3 text-sm animate-in slide-in-from-bottom-2 duration-150 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <CornerDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-indigo-700 block truncate text-[11px] sm:text-xs">
                Replying to @{replyingTo.senderUsername}
              </span>
              <span className="text-slate-600 block truncate text-xs sm:text-sm mt-0.5">
                {replyingTo.content}
              </span>
            </div>
          </div>
          <button
            onClick={cancelReply}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Cancel reply"
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Image attachment preview if selected */}
      {imagePreview && (
        <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl inline-flex items-center gap-3 relative animate-in fade-in">
          <img src={imagePreview} alt="Upload preview" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover" />
          <div className="text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Photo attached</p>
            <p className="text-[11px] text-slate-400">Add a message or tap send</p>
          </div>
          <button
            onClick={() => setImagePreview(null)}
            className="p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Voice Recorder Active View */}
      {isRecordingVoice ? (
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        /* 4. Main Composer Box */
        <div className="flex items-end gap-1 sm:gap-2 bg-slate-100/70 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 sm:p-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all shadow-xs">
          {/* Action icon triggers */}
          <div className="flex items-center gap-0.5 pb-0.5 sm:pb-1">
            {/* Emoji Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-200/60 active:scale-95 transition-all cursor-pointer"
                title="Add emoji"
                aria-label="Emoji picker"
              >
                <Smile className="w-5 h-5 stroke-[1.9]" />
              </button>

              {showEmojiPicker && (
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>

            {/* Photo Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-200/60 active:scale-95 transition-all cursor-pointer"
              title="Attach photo"
              aria-label="Attach photo"
            >
              <ImageIcon className="w-5 h-5 stroke-[1.9]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Multiline Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-0 text-slate-900 placeholder:text-slate-400 text-[14px] sm:text-[15px] py-2 px-1.5 resize-none focus:outline-none focus:ring-0 leading-normal max-h-32 sm:max-h-36 overflow-y-auto font-normal tracking-[-0.01em]"
          />

          {/* Voice Note Trigger */}
          {!text.trim() && !imagePreview && (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-200/60 active:scale-95 transition-all cursor-pointer pb-0.5 sm:pb-1"
              title="Record voice note"
              aria-label="Voice note"
            >
              <Mic className="w-5 h-5 stroke-[1.9]" />
            </button>
          )}

          {/* Send Button */}
          {(text.trim() || imagePreview) && (
            <button
              type="button"
              onClick={handleSend}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-600/25 cursor-pointer flex-shrink-0 active:scale-95"
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 stroke-[2.2]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
