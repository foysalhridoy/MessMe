export interface UserProfile {
  id: string; // Internal stable UUID
  username: string; // Public unique username, 3-20 chars, lowercase
  displayName: string;
  avatarUrl?: string;
  about?: string;
  createdAt: string;
  lastSeen?: string;
  isOnline?: boolean;
  blockedUserIds?: string[];
}

export interface SessionData {
  userId: string;
  username: string;
  sessionToken: string; // Cryptographic session secret
  createdAt: string;
}

export type MessageType = 'text' | 'voice';

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  username: string;
  emoji: string;
  createdAt: string;
}

export interface MessageReplyReference {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  type: MessageType;
}

export type DisappearingDuration = 'off' | '24h' | '48h';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  content: string;
  type: MessageType;
  mediaUrl?: string; // Audio URL for voice messages
  imageUrl?: string; // Optional image attachment
  duration?: number; // Duration in seconds for voice messages
  replyTo?: MessageReplyReference;
  reactions: MessageReaction[];
  createdAt: string;
  editedAt?: string;
  expiresAt?: string; // Timestamp when message should auto-disappear to save storage
  isDeleted?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ConversationParticipant {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: string;
  isTyping?: boolean;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  otherParticipant: ConversationParticipant; // For 1:1 chat
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  disappearingDuration?: DisappearingDuration; // 'off' | '24h' | '48h'
  createdAt: string;
  updatedAt: string;
}

export interface EmojiData {
  emoji: string;
  name: string;
  category: 'smileys' | 'gestures' | 'hearts' | 'objects' | 'food' | 'activities' | 'symbols';
}

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}
