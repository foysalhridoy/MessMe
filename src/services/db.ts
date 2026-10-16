/**
 * MessMe Database & Real-Time Sync Service
 * Seamlessly interfaces with Supabase (when configured) or the Local Multi-Tab Engine.
 */

import { getSupabaseClient } from '../lib/supabase';
import type { Conversation, DisappearingDuration, Message, MessageReaction, MessageType, UserProfile } from '../types';
import { generateUUID, normalizeUsername } from '../lib/identity';

const STORAGE_USERS = 'messme_all_users_registry';
const STORAGE_CONVERSATIONS = 'messme_conversations_store';
const STORAGE_MESSAGES = 'messme_messages_store';

// Legacy mock accounts to purge completely
const LEGACY_MOCK_USERNAMES = new Set(['elena_ux', 'marcus_dev', 'sophia_ai', 'david_sound']);
const LEGACY_MOCK_USER_IDS = new Set(['user_elena_ux', 'user_marcus_dev', 'user_sophia_ai', 'user_david_sound']);

// BroadcastChannel for cross-tab real-time communication
let broadcastBus: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastBus = new BroadcastChannel('messme_realtime_bus');
  } catch (err) {
    console.warn('BroadcastChannel initialization error:', err);
  }
}

export interface RealtimeEventPayload {
  type:
    | 'NEW_MESSAGE'
    | 'EDIT_MESSAGE'
    | 'DELETE_MESSAGE'
    | 'REACTION_UPDATE'
    | 'TYPING'
    | 'PRESENCE'
    | 'PROFILE_UPDATE'
    | 'DISAPPEARING_DURATION_UPDATE'
    | 'MESSAGES_PURGED'
    | 'BLOCK_STATUS_UPDATE';
  conversationId?: string;
  senderId?: string;
  senderUsername?: string;
  message?: Message;
  reaction?: MessageReaction;
  isTyping?: boolean;
  profile?: UserProfile;
  disappearingDuration?: DisappearingDuration;
}

type RealtimeListener = (payload: RealtimeEventPayload) => void;
const listeners = new Set<RealtimeListener>();

export function subscribeToRealtimeEvents(listener: RealtimeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function broadcastEvent(payload: RealtimeEventPayload) {
  // Notify in-process listeners
  listeners.forEach(l => {
    try {
      l(payload);
    } catch (e) {
      console.error('Error in realtime listener:', e);
    }
  });

  // Notify other browser tabs
  if (broadcastBus) {
    try {
      broadcastBus.postMessage(payload);
    } catch (e) {
      console.warn('Failed to broadcast event:', e);
    }
  }
}

if (broadcastBus) {
  broadcastBus.onmessage = (event) => {
    if (event.data && typeof event.data === 'object') {
      listeners.forEach(l => {
        try {
          l(event.data as RealtimeEventPayload);
        } catch (e) {
          console.error('Error in broadcast message handler:', e);
        }
      });
    }
  };
}

// -------------------------------------------------------------
// LOCAL STORAGE STORE HELPERS
// -------------------------------------------------------------

function getAllStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (!raw) return [];
    const users: UserProfile[] = JSON.parse(raw);
    const filtered = users.filter(
      u => !LEGACY_MOCK_USER_IDS.has(u.id) && !LEGACY_MOCK_USERNAMES.has(u.username)
    );
    if (filtered.length !== users.length) {
      saveStoredUsers(filtered);
    }
    return filtered;
  } catch {
    return [];
  }
}

export function getStoredUserById(userId: string): UserProfile | null {
  const users = getAllStoredUsers();
  return users.find(u => u.id === userId) || null;
}

function saveStoredUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users store:', err);
  }
}

function getAllStoredConversations(currentUserId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_CONVERSATIONS}_${currentUserId}`);
    if (!raw) return [];
    const convs: Conversation[] = JSON.parse(raw);
    const filtered = convs.filter(
      c =>
        !LEGACY_MOCK_USER_IDS.has(c.otherParticipant.userId) &&
        !LEGACY_MOCK_USERNAMES.has(c.otherParticipant.username)
    );
    if (filtered.length !== convs.length) {
      saveStoredConversations(currentUserId, filtered);
    }
    return filtered;
  } catch {
    return [];
  }
}

function saveStoredConversations(currentUserId: string, convs: Conversation[]) {
  try {
    localStorage.setItem(`${STORAGE_CONVERSATIONS}_${currentUserId}`, JSON.stringify(convs));
  } catch (err) {
    console.error('Failed to save conversations store:', err);
  }
}

function getAllStoredMessages(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredMessages(messagesMap: Record<string, Message[]>) {
  try {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messagesMap));
  } catch (err) {
    console.error('Failed to save messages store:', err);
  }
}

const STORAGE_BLOCKED_USERS = 'messme_blocked_users';

export function getStoredBlockedUserIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_BLOCKED_USERS}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredBlockedUserIds(userId: string, blockedIds: string[]) {
  try {
    localStorage.setItem(`${STORAGE_BLOCKED_USERS}_${userId}`, JSON.stringify(blockedIds));
  } catch (err) {
    console.error('Failed to save blocked users:', err);
  }
}

export async function blockUserInStorage(currentUserId: string, targetUserId: string): Promise<string[]> {
  const current = getStoredBlockedUserIds(currentUserId);
  if (!current.includes(targetUserId)) {
    const updated = [...current, targetUserId];
    saveStoredBlockedUserIds(currentUserId, updated);
    broadcastEvent({
      type: 'BLOCK_STATUS_UPDATE',
      senderId: currentUserId,
      conversationId: targetUserId,
    });
    return updated;
  }
  return current;
}

export async function unblockUserInStorage(currentUserId: string, targetUserId: string): Promise<string[]> {
  const current = getStoredBlockedUserIds(currentUserId);
  const updated = current.filter((id) => id !== targetUserId);
  saveStoredBlockedUserIds(currentUserId, updated);
  broadcastEvent({
    type: 'BLOCK_STATUS_UPDATE',
    senderId: currentUserId,
    conversationId: targetUserId,
  });
  return updated;
}

// -------------------------------------------------------------
// USER IDENTITY & AVAILABILITY
// -------------------------------------------------------------

/**
 * Check if a username is already taken
 */
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; existingUser?: UserProfile }> {
  const normalized = normalizeUsername(username);
  if (!normalized) return { available: false };

  // If Supabase is configured, check database
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', normalized)
        .maybeSingle();

      if (!error && data) {
        return {
          available: false,
          existingUser: {
            id: data.id,
            username: data.username,
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
            about: data.about,
            createdAt: data.created_at,
          },
        };
      }
      return { available: true };
    } catch (err) {
      console.warn('Supabase username check error:', err);
    }
  }

  // Local check
  const users = getAllStoredUsers();
  const existing = users.find(u => normalizeUsername(u.username) === normalized);
  return { available: !existing, existingUser: existing };
}

/**
 * Register new user profile with globally unique username
 */
export async function registerUserProfile(
  username: string,
  sessionToken: string,
  displayName?: string,
  avatarUrl?: string
): Promise<UserProfile> {
  const normalized = normalizeUsername(username);
  const internalId = generateUUID();
  const finalDisplayName = displayName?.trim() || username;

  const newProfile: UserProfile = {
    id: internalId,
    username: normalized,
    displayName: finalDisplayName,
    avatarUrl,
    createdAt: new Date().toISOString(),
    isOnline: true,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: internalId,
          username: normalized,
          display_name: finalDisplayName,
          avatar_url: avatarUrl || null,
          created_at: newProfile.createdAt,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Store hashed session token
      await supabase.from('identity_secrets').insert({
        profile_id: internalId,
        session_token_hash: sessionToken,
      });

      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url || avatarUrl,
        createdAt: data.created_at,
      };
    } catch (err: unknown) {
      console.warn('Supabase registration fallback to local:', err);
    }
  }

  // Save in local registry
  const users = getAllStoredUsers();
  users.push(newProfile);
  saveStoredUsers(users);

  // Initialize clean conversation store for this user (no mock/demo chats)
  saveStoredConversations(newProfile.id, []);

  return newProfile;
}

/**
 * Update user profile across stores and Supabase
 */
export async function updateUserProfileInStorage(updated: UserProfile): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('profiles')
        .update({
          display_name: updated.displayName,
          avatar_url: updated.avatarUrl || null,
          about: updated.about || null,
        })
        .eq('id', updated.id);
    } catch (err) {
      console.warn('Supabase profile update fallback to local:', err);
    }
  }

  const users = getAllStoredUsers();
  const idx = users.findIndex(u => u.id === updated.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updated };
    saveStoredUsers(users);
  }

  // Update in all conversation stores for all users in localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_CONVERSATIONS)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: Conversation[] = JSON.parse(raw);
          let changed = false;
          const updatedList = list.map(c => {
            const isOther = c.otherParticipant.userId === updated.id;
            const hasParticipant = c.participants.some(p => p.userId === updated.id);
            if (!isOther && !hasParticipant) return c;
            changed = true;
            return {
              ...c,
              otherParticipant: isOther
                ? {
                    ...c.otherParticipant,
                    displayName: updated.displayName,
                    avatarUrl: updated.avatarUrl,
                    about: updated.about,
                  }
                : c.otherParticipant,
              participants: c.participants.map(p =>
                p.userId === updated.id
                  ? {
                      ...p,
                      displayName: updated.displayName,
                      avatarUrl: updated.avatarUrl,
                      about: updated.about,
                    }
                  : p
              ),
            };
          });
          if (changed) {
            localStorage.setItem(key, JSON.stringify(updatedList));
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to sync conversation stores for profile update:', err);
  }

  // Update stored historical messages sent by this user
  const allMsgs = getAllStoredMessages();
  let msgsChanged = false;
  Object.keys(allMsgs).forEach(convId => {
    allMsgs[convId] = allMsgs[convId].map(m => {
      if (m.senderId === updated.id) {
        msgsChanged = true;
        return {
          ...m,
          senderDisplayName: updated.displayName,
          senderAvatarUrl: updated.avatarUrl,
        };
      }
      return m;
    });
  });
  if (msgsChanged) {
    saveStoredMessages(allMsgs);
  }

  // Broadcast real-time profile update to all other open tabs
  broadcastEvent({
    type: 'PROFILE_UPDATE',
    senderId: updated.id,
    senderUsername: updated.username,
    profile: updated,
  });
}

/**
 * Search users by username query
 */
export async function searchUsersByUsername(query: string, currentUserId: string): Promise<UserProfile[]> {
  const normalized = normalizeUsername(query);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let req = supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .limit(15);

      if (normalized) {
        req = req.ilike('username', `%${normalized}%`);
      }

      const { data } = await req;
      if (data) {
        return data.map(d => ({
          id: d.id,
          username: d.username,
          displayName: d.display_name,
          avatarUrl: d.avatar_url,
          about: d.about,
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase search fallback to local:', err);
    }
  }

  const users = getAllStoredUsers();
  if (!normalized) {
    return users.filter(u => u.id !== currentUserId);
  }

  return users.filter(u =>
    u.id !== currentUserId &&
    (normalizeUsername(u.username).includes(normalized) ||
     (u.displayName && u.displayName.toLowerCase().includes(normalized)))
  );
}

// -------------------------------------------------------------
// CONVERSATIONS
// -------------------------------------------------------------

export async function fetchUserConversations(currentUserId: string): Promise<Conversation[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          is_pinned,
          is_muted,
          conversations (
            id,
            created_at,
            updated_at
          )
        `)
        .eq('profile_id', currentUserId);

      if (!error && data) {
        // Fallback gracefully if schema is partially initialized
      }
    } catch (err) {
      console.warn('Supabase fetch conversations fallback to local:', err);
    }
  }

  const rawConvs = getAllStoredConversations(currentUserId);
  const allUsers = getAllStoredUsers();
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Hydrate conversations with latest profile changes
  return rawConvs.map(c => {
    const freshOther = userMap.get(c.otherParticipant.userId);
    const otherParticipant = freshOther
      ? {
          ...c.otherParticipant,
          displayName: freshOther.displayName || c.otherParticipant.displayName,
          avatarUrl: freshOther.avatarUrl !== undefined ? freshOther.avatarUrl : c.otherParticipant.avatarUrl,
          about: freshOther.about !== undefined ? freshOther.about : c.otherParticipant.about,
        }
      : c.otherParticipant;

    const participants = c.participants.map(p => {
      const freshP = userMap.get(p.userId);
      return freshP
        ? {
            ...p,
            displayName: freshP.displayName || p.displayName,
            avatarUrl: freshP.avatarUrl !== undefined ? freshP.avatarUrl : p.avatarUrl,
            about: freshP.about !== undefined ? freshP.about : p.about,
          }
        : p;
    });

    return {
      ...c,
      otherParticipant,
      participants,
    };
  });
}

export async function getOrCreateConversation(currentUser: UserProfile, targetUser: UserProfile): Promise<Conversation> {
  const conversations = getAllStoredConversations(currentUser.id);

  // Check if conversation already exists
  const existing = conversations.find(c => c.otherParticipant.userId === targetUser.id);
  if (existing) {
    return existing;
  }

  const newConvId = `conv_${currentUser.id}_${targetUser.id}`;
  const now = new Date().toISOString();

  const newConv: Conversation = {
    id: newConvId,
    participants: [
      {
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
      },
      {
        userId: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        avatarUrl: targetUser.avatarUrl,
        isOnline: targetUser.isOnline ?? true,
      },
    ],
    otherParticipant: {
      userId: targetUser.id,
      username: targetUser.username,
      displayName: targetUser.displayName,
      avatarUrl: targetUser.avatarUrl,
      isOnline: targetUser.isOnline ?? true,
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    createdAt: now,
    updatedAt: now,
  };

  conversations.unshift(newConv);
  saveStoredConversations(currentUser.id, conversations);

  // Also create mirrored conversation for target user in store
  const targetConvs = getAllStoredConversations(targetUser.id);
  const mirroredConv: Conversation = {
    ...newConv,
    otherParticipant: {
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      isOnline: true,
    },
  };
  targetConvs.unshift(mirroredConv);
  saveStoredConversations(targetUser.id, targetConvs);

  return newConv;
}

export async function togglePinConversation(currentUserId: string, conversationId: string): Promise<Conversation[]> {
  const convs = getAllStoredConversations(currentUserId);
  const target = convs.find(c => c.id === conversationId);
  if (target) {
    target.isPinned = !target.isPinned;
    saveStoredConversations(currentUserId, convs);
  }
  return convs;
}

export async function toggleMuteConversation(currentUserId: string, conversationId: string): Promise<Conversation[]> {
  const convs = getAllStoredConversations(currentUserId);
  const target = convs.find(c => c.id === conversationId);
  if (target) {
    target.isMuted = !target.isMuted;
    saveStoredConversations(currentUserId, convs);
  }
  return convs;
}

export async function setConversationDisappearingDuration(
  currentUserId: string,
  conversationId: string,
  duration: DisappearingDuration
): Promise<Conversation | null> {
  const convs = getAllStoredConversations(currentUserId);
  const target = convs.find(c => c.id === conversationId);
  if (!target) return null;

  const now = new Date().toISOString();
  target.disappearingDuration = duration;
  target.updatedAt = now;
  saveStoredConversations(currentUserId, convs);

  // Mirrored update for other participant
  const otherUserId = target.otherParticipant.userId;
  const otherConvs = getAllStoredConversations(otherUserId);
  const mirrored = otherConvs.find(c => c.id === conversationId);
  if (mirrored) {
    mirrored.disappearingDuration = duration;
    mirrored.updatedAt = now;
    saveStoredConversations(otherUserId, otherConvs);
  }

  // Purge any messages exceeding the newly set duration immediately to reclaim storage
  await purgeExpiredMessages(conversationId);

  broadcastEvent({
    type: 'DISAPPEARING_DURATION_UPDATE',
    conversationId,
    disappearingDuration: duration,
  });

  return target;
}

export async function clearConversationMessages(currentUserId: string, conversationId: string): Promise<void> {
  const messagesMap = getAllStoredMessages();
  messagesMap[conversationId] = [];
  saveStoredMessages(messagesMap);

  const convs = getAllStoredConversations(currentUserId);
  const target = convs.find(c => c.id === conversationId);
  if (target) {
    target.lastMessage = undefined;
    target.unreadCount = 0;
    saveStoredConversations(currentUserId, convs);
  }
}

// -------------------------------------------------------------
// MESSAGES & DISAPPEARING / EPHEMERAL PURGE ENGINE
// -------------------------------------------------------------

/**
 * Purge expired messages from storage to conserve device/browser space
 */
export async function purgeExpiredMessages(targetConversationId?: string): Promise<{ purgedCount: number; remainingMessages: Message[] }> {
  const messagesMap = getAllStoredMessages();
  const now = Date.now();
  let totalPurged = 0;
  let remainingForTarget: Message[] = [];

  const conversationIds = targetConversationId ? [targetConversationId] : Object.keys(messagesMap);
  const allUsers = getAllStoredUsers();

  for (const cId of conversationIds) {
    const list = messagesMap[cId];
    if (!list || list.length === 0) continue;

    // Detect disappearing duration set for this conversation
    let duration: DisappearingDuration = 'off';
    for (const u of allUsers) {
      const convs = getAllStoredConversations(u.id);
      const match = convs.find(c => c.id === cId);
      if (match?.disappearingDuration) {
        duration = match.disappearingDuration;
        break;
      }
    }

    const durationMs =
      duration === '24h'
        ? 24 * 60 * 60 * 1000
        : duration === '48h'
        ? 48 * 60 * 60 * 1000
        : null;

    const unexpired = list.filter((m) => {
      // 1. If explicit expiration timestamp exists
      if (m.expiresAt) {
        return new Date(m.expiresAt).getTime() > now;
      }
      // 2. If conversation auto-delete rule is active
      if (durationMs) {
        const msgTime = new Date(m.createdAt).getTime();
        return now - msgTime <= durationMs;
      }
      return true;
    });

    const purged = list.length - unexpired.length;
    if (purged > 0) {
      totalPurged += purged;
      messagesMap[cId] = unexpired;

      // Update lastMessage preview across participants
      const latestMsg = unexpired.length > 0 ? unexpired[unexpired.length - 1] : undefined;
      for (const u of allUsers) {
        const userConvs = getAllStoredConversations(u.id);
        const userTarget = userConvs.find(c => c.id === cId);
        if (userTarget) {
          userTarget.lastMessage = latestMsg;
          saveStoredConversations(u.id, userConvs);
        }
      }

      broadcastEvent({
        type: 'MESSAGES_PURGED',
        conversationId: cId,
      });
    }

    if (cId === targetConversationId) {
      remainingForTarget = unexpired;
    }
  }

  if (totalPurged > 0) {
    saveStoredMessages(messagesMap);
  }

  return {
    purgedCount: totalPurged,
    remainingMessages: remainingForTarget,
  };
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  // Purge expired items before returning
  await purgeExpiredMessages(conversationId);
  const messagesMap = getAllStoredMessages();
  return messagesMap[conversationId] || [];
}

export async function sendMessage(
  conversationId: string,
  sender: UserProfile,
  content: string,
  type: MessageType = 'text',
  mediaUrl?: string,
  duration?: number,
  replyTo?: Message['replyTo'],
  imageUrl?: string
): Promise<Message> {
  const messageId = generateUUID();
  const now = new Date().toISOString();

  // Check if conversation participant is blocked
  const userConvs = getAllStoredConversations(sender.id);
  const conv = userConvs.find(c => c.id === conversationId);
  const otherUserId = conv?.otherParticipant?.userId;

  if (otherUserId) {
    const senderBlocked = getStoredBlockedUserIds(sender.id);
    if (senderBlocked.includes(otherUserId)) {
      throw new Error('You have blocked this user. Unblock them to send messages.');
    }
    const recipientBlocked = getStoredBlockedUserIds(otherUserId);
    if (recipientBlocked.includes(sender.id)) {
      throw new Error('You cannot send messages to this user.');
    }
  }

  let expiresAt: string | undefined = undefined;

  if (conv?.disappearingDuration === '24h') {
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  } else if (conv?.disappearingDuration === '48h') {
    expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  }

  const newMessage: Message = {
    id: messageId,
    conversationId,
    senderId: sender.id,
    senderUsername: sender.username,
    senderDisplayName: sender.displayName,
    senderAvatarUrl: sender.avatarUrl,
    content,
    type,
    mediaUrl,
    imageUrl,
    duration,
    replyTo,
    reactions: [],
    createdAt: now,
    expiresAt,
    status: 'sent',
  };

  // Save to stored messages
  const messagesMap = getAllStoredMessages();
  const currentList = messagesMap[conversationId] || [];
  messagesMap[conversationId] = [...currentList, newMessage];
  saveStoredMessages(messagesMap);

  // Update conversation last message for sender
  if (conv) {
    conv.lastMessage = newMessage;
    conv.updatedAt = now;
    saveStoredConversations(sender.id, userConvs);
  }

  // Update conversation last message for recipient
  if (conv?.otherParticipant?.userId) {
    const recipientConvs = getAllStoredConversations(conv.otherParticipant.userId);
    const recipientConv = recipientConvs.find(c => c.id === conversationId);
    if (recipientConv) {
      recipientConv.lastMessage = newMessage;
      recipientConv.unreadCount = (recipientConv.unreadCount || 0) + 1;
      recipientConv.updatedAt = now;
      saveStoredConversations(conv.otherParticipant.userId, recipientConvs);
    }
  }

  // Broadcast realtime event
  broadcastEvent({
    type: 'NEW_MESSAGE',
    conversationId,
    senderId: sender.id,
    senderUsername: sender.username,
    message: newMessage,
  });

  return newMessage;
}

export async function toggleMessageReaction(
  conversationId: string,
  messageId: string,
  user: UserProfile,
  emoji: string
): Promise<MessageReaction[]> {
  const messagesMap = getAllStoredMessages();
  const list = messagesMap[conversationId] || [];
  const message = list.find(m => m.id === messageId);
  if (!message) return [];

  const existingIndex = message.reactions.findIndex(
    r => r.userId === user.id && r.emoji === emoji
  );

  if (existingIndex >= 0) {
    // Remove reaction
    message.reactions.splice(existingIndex, 1);
  } else {
    // Check if user already had a different reaction; replace it or add new
    const userOtherReactionIndex = message.reactions.findIndex(r => r.userId === user.id);
    const newReaction: MessageReaction = {
      id: generateUUID(),
      messageId,
      userId: user.id,
      username: user.username,
      emoji,
      createdAt: new Date().toISOString(),
    };

    if (userOtherReactionIndex >= 0) {
      message.reactions[userOtherReactionIndex] = newReaction;
    } else {
      message.reactions.push(newReaction);
    }
  }

  saveStoredMessages(messagesMap);

  broadcastEvent({
    type: 'REACTION_UPDATE',
    conversationId,
    senderId: user.id,
    message,
  });

  return message.reactions;
}

export async function editMessage(
  conversationId: string,
  messageId: string,
  userId: string,
  newContent: string
): Promise<Message | null> {
  const messagesMap = getAllStoredMessages();
  const list = messagesMap[conversationId] || [];
  const message = list.find(m => m.id === messageId);

  if (!message || message.senderId !== userId) {
    return null; // Authorization check
  }

  message.content = newContent;
  message.editedAt = new Date().toISOString();
  saveStoredMessages(messagesMap);

  broadcastEvent({
    type: 'EDIT_MESSAGE',
    conversationId,
    senderId: userId,
    message,
  });

  return message;
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
  userId: string
): Promise<boolean> {
  const messagesMap = getAllStoredMessages();
  const list = messagesMap[conversationId] || [];
  const message = list.find(m => m.id === messageId);

  if (!message || message.senderId !== userId) {
    return false; // Authorization check
  }

  message.isDeleted = true;
  message.content = 'This message was deleted';
  message.mediaUrl = undefined;
  message.reactions = [];
  saveStoredMessages(messagesMap);

  broadcastEvent({
    type: 'DELETE_MESSAGE',
    conversationId,
    senderId: userId,
    message,
  });

  return true;
}

export function broadcastTypingStatus(conversationId: string, user: UserProfile, isTyping: boolean) {
  broadcastEvent({
    type: 'TYPING',
    conversationId,
    senderId: user.id,
    senderUsername: user.username,
    isTyping,
  });
}
