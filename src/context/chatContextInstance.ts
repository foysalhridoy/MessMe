import { createContext } from 'react';
import type { Conversation, Message, SessionData, ToastMessage, UserProfile } from '../types';

export interface ChatContextType {
  currentUser: UserProfile | null;
  session: SessionData | null;
  isLoadingAuth: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeMessages: Message[];
  isLoadingMessages: boolean;
  typingMap: Record<string, string>; // conversationId -> typing username
  replyingTo: Message | null;
  searchQueryInChat: string;
  isSearchInChatOpen: boolean;
  toasts: ToastMessage[];
  drafts: Record<string, string>;
  blockedUserIds: string[];

  // Actions
  onboardUser: (username: string, displayName?: string, avatarUrl?: string) => Promise<boolean>;
  loginWithUsername: (username: string) => Promise<boolean>;
  restoreSessionWithToken: (sessionToken: string, username: string) => Promise<boolean>;
  logoutUser: () => void;
  setActiveConversationById: (convId: string) => void;
  startChatWithUser: (user: UserProfile) => Promise<Conversation>;
  sendText: (content: string) => Promise<void>;
  sendVoice: (blob: Blob, duration: number) => Promise<void>;
  sendImageMessage: (imageDataUrl: string, caption?: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  startReply: (msg: Message) => void;
  cancelReply: () => void;
  editUserMessage: (messageId: string, content: string) => Promise<void>;
  deleteUserMessage: (messageId: string) => Promise<void>;
  togglePin: (convId: string) => Promise<void>;
  toggleMute: (convId: string) => Promise<void>;
  clearConversation: (convId: string) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;
  updateCurrentUserProfile: (displayName: string, avatarUrl?: string, about?: string) => Promise<void>;
  setSearchQueryInChat: (query: string) => void;
  setIsSearchInChatOpen: (open: boolean) => void;
  setDraftForConversation: (convId: string, draft: string) => void;
  showToast: (message: string, type?: ToastMessage['type'], title?: string) => void;
  removeToast: (id: string) => void;
  notifyTyping: (isTyping: boolean) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
