/**
 * MessMe Database & Real-Time Sync Service
 * Seamlessly interfaces with Supabase for cross-device real-time sync,
 * with resilient local caching and multi-tab broadcasting.
 */

import { getSupabaseClient } from '../lib/supabase';
import type {
  Conversation,
  Message,
  MessageReaction,
  MessageType,
  UserProfile,
} from '../types';
import { generateUUID, normalizeUsername } from '../lib/identity';

const STORAGE_USERS = 'messme_all_users_registry';
const STORAGE_CONVERSATIONS = 'messme_conversations_store';
const STORAGE_MESSAGES = 'messme_messages_store';
const STORAGE_BLOCKED = 'messme_blocked_users';

// BroadcastChannel for cross-tab real-time communication on the same device
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
    | 'BLOCK_STATUS_UPDATE'
    | 'MESSAGES_READ';
  conversationId?: string;
  senderId?: string;
  readerId?: string;
  senderUsername?: string;
  message?: Message;
  reaction?: MessageReaction;
  isTyping?: boolean;
  profile?: UserProfile;
}

type RealtimeListener = (payload: RealtimeEventPayload) => void;
const listeners = new Set<RealtimeListener>();

// Cache for user profiles fetched from Supabase
const userProfileCache = new Map<string, UserProfile>();

export function subscribeToRealtimeEvents(listener: RealtimeListener): () => void {
  listeners.add(listener);
  // Ensure Supabase realtime channel is subscribed
  ensureSupabaseRealtime();
  return () => {
    listeners.delete(listener);
  };
}

function broadcastEvent(payload: RealtimeEventPayload) {
  // Notify in-process listeners
  listeners.forEach((l) => {
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
      listeners.forEach((l) => {
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
// SUPABASE REALTIME CHANNEL (CROSS-DEVICE SYNC)
// -------------------------------------------------------------
let supabaseChannelInstance: ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null = null;
let isRealtimeSubscribed = false;

export function ensureSupabaseRealtime() {
  const supabase = getSupabaseClient();
  if (!supabase || isRealtimeSubscribed) return;

  try {
    isRealtimeSubscribed = true;
    supabaseChannelInstance = supabase.channel('messme_global_realtime', {
      config: { broadcast: { self: false } },
    });

    // 1. Listen for new messages inserted on ANY device
    supabaseChannelInstance.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      async (payload) => {
        const row = payload.new as {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          type?: string;
          media_url?: string;
          duration?: number;
          reply_to_id?: string;
          is_deleted?: boolean;
          created_at: string;
        };

        if (!row || !row.id) return;

        // Fast-path sender info from cache or query profile
        let sender = userProfileCache.get(row.sender_id) || getAllStoredUsers().find((u) => u.id === row.sender_id);
        if (!sender) {
          sender = (await getUserProfileById(row.sender_id)) || undefined;
          if (sender) userProfileCache.set(row.sender_id, sender);
        }

        const newMsg: Message = {
          id: row.id,
          conversationId: row.conversation_id,
          senderId: row.sender_id,
          senderUsername: sender?.username || '',
          senderDisplayName: sender?.displayName || sender?.username || '',
          senderAvatarUrl: sender?.avatarUrl,
          content: row.content,
          type: (row.type as MessageType) || 'text',
          mediaUrl: row.media_url || undefined,
          imageUrl: (row.media_url && !row.duration && row.type !== 'voice') ? row.media_url : undefined,
          duration: row.duration ? Number(row.duration) : undefined,
          replyTo: undefined,
          reactions: [],
          createdAt: row.created_at,
          isDeleted: row.is_deleted || false,
          status: 'sent',
        };

        if (row.reply_to_id) {
          const messagesMap = getAllStoredMessages();
          const cachedReply = (messagesMap[row.conversation_id] || []).find((m) => m.id === row.reply_to_id);
          if (cachedReply) {
            newMsg.replyTo = {
              id: cachedReply.id,
              senderId: cachedReply.senderId,
              senderUsername: cachedReply.senderUsername,
              senderDisplayName: cachedReply.senderDisplayName,
              content: cachedReply.content,
              type: cachedReply.type,
            };
          }
        }

        // Cache locally
        const messagesMap = getAllStoredMessages();
        const currentList = messagesMap[row.conversation_id] || [];
        if (!currentList.some((m) => m.id === row.id)) {
          messagesMap[row.conversation_id] = [...currentList, newMsg];
          saveStoredMessages(messagesMap);
        }

        broadcastEvent({
          type: 'NEW_MESSAGE',
          conversationId: row.conversation_id,
          senderId: row.sender_id,
          senderUsername: sender?.username,
          message: newMsg,
        });
      }
    );

    // 2. Listen for message edits and soft deletes
    supabaseChannelInstance.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      async (payload) => {
        const row = payload.new as {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          type?: string;
          media_url?: string;
          duration?: number;
          is_deleted?: boolean;
          edited_at?: string;
          created_at: string;
        };

        if (!row || !row.id) return;

        const messagesMap = getAllStoredMessages();
        const list = messagesMap[row.conversation_id] || [];
        const existing = list.find((m) => m.id === row.id);
        const updatedMsg: Message = {
          ...(existing || {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            senderUsername: 'user',
            senderDisplayName: 'User',
            reactions: [],
            createdAt: row.created_at,
            type: (row.type as MessageType) || 'text',
          }),
          content: row.content,
          isDeleted: row.is_deleted || false,
          editedAt: row.edited_at,
          mediaUrl: row.media_url || undefined,
        };

        messagesMap[row.conversation_id] = list.map((m) => (m.id === row.id ? updatedMsg : m));
        saveStoredMessages(messagesMap);

        if (row.is_deleted) {
          broadcastEvent({
            type: 'DELETE_MESSAGE',
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            message: updatedMsg,
          });
        } else {
          broadcastEvent({
            type: 'EDIT_MESSAGE',
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            message: updatedMsg,
          });
        }
      }
    );

    // 3. Listen for reactions across devices
    supabaseChannelInstance.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'message_reactions' },
      async (payload) => {
        const row = (payload.new || payload.old) as { message_id?: string };
        if (!row?.message_id) return;

        const { data: reactionsData } = await supabase
          .from('message_reactions')
          .select('id, message_id, profile_id, emoji, created_at, profiles(username)')
          .eq('message_id', row.message_id);

        if (reactionsData) {
          const reactions: MessageReaction[] = reactionsData.map((r: any) => ({
            id: r.id,
            messageId: r.message_id,
            userId: r.profile_id,
            username: r.profiles?.username || '',
            emoji: r.emoji,
            createdAt: r.created_at,
          }));

          const messagesMap = getAllStoredMessages();
          for (const convId of Object.keys(messagesMap)) {
            const target = messagesMap[convId].find((m) => m.id === row.message_id);
            if (target) {
              target.reactions = reactions;
              saveStoredMessages(messagesMap);
              broadcastEvent({
                type: 'REACTION_UPDATE',
                conversationId: convId,
                message: target,
              });
              break;
            }
          }
        }
      }
    );

    // 4. Listen for typing events across devices
    supabaseChannelInstance.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (!payload) return;
      listeners.forEach((l) => {
        try {
          l({
            type: 'TYPING',
            conversationId: payload.conversationId,
            senderId: payload.senderId,
            senderUsername: payload.senderUsername,
            isTyping: payload.isTyping,
          });
        } catch (e) {
          console.error('Error in typing broadcast handler:', e);
        }
      });
    });

    // 5. Listen for read receipts across devices
    supabaseChannelInstance.on('broadcast', { event: 'read_receipt' }, ({ payload }) => {
      if (!payload || !payload.conversationId) return;
      listeners.forEach((l) => {
        try {
          l({
            type: 'MESSAGES_READ',
            conversationId: payload.conversationId,
            readerId: payload.readerId,
          });
        } catch (e) {
          console.error('Error in read receipt broadcast handler:', e);
        }
      });
    });

    supabaseChannelInstance.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('MessMe Realtime: connected to Supabase global channel');
      } else if (err) {
        console.warn('MessMe Realtime subscription issue:', err);
      }
    });
  } catch (err) {
    console.warn('Failed to start Supabase realtime:', err);
    isRealtimeSubscribed = false;
  }
}

// -------------------------------------------------------------
// LOCAL STORAGE STORE HELPERS
// -------------------------------------------------------------

function getAllStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getStoredUserById(userId: string): UserProfile | null {
  const users = getAllStoredUsers();
  return users.find((u) => u.id === userId) || null;
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
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getCachedConversations(currentUserId: string): Conversation[] {
  return getAllStoredConversations(currentUserId);
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
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getCachedMessages(conversationId: string): Message[] {
  const messagesMap = getAllStoredMessages();
  return messagesMap[conversationId] || [];
}

function saveStoredMessages(messagesMap: Record<string, Message[]>) {
  try {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messagesMap));
  } catch (err) {
    console.error('Failed to save messages store:', err);
  }
}

export function getStoredBlockedUserIds(currentUserId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_BLOCKED}_${currentUserId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredBlockedUserIds(currentUserId: string, ids: string[]) {
  try {
    localStorage.setItem(`${STORAGE_BLOCKED}_${currentUserId}`, JSON.stringify(ids));
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

export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  if (userProfileCache.has(userId)) {
    return userProfileCache.get(userId)!;
  }
  const local = getStoredUserById(userId);
  if (local) {
    userProfileCache.set(userId, local);
    return local;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        const profile: UserProfile = {
          id: data.id,
          username: data.username,
          displayName: data.display_name || data.username,
          avatarUrl: data.avatar_url || undefined,
          about: data.about || undefined,
          createdAt: data.created_at,
          lastSeen: data.last_seen,
        };
        userProfileCache.set(userId, profile);
        return profile;
      }
    } catch (err) {
      console.warn('Failed to fetch profile by id from Supabase:', err);
    }
  }

  return null;
}

export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', normalized)
        .maybeSingle();

      if (data) {
        const profile: UserProfile = {
          id: data.id,
          username: data.username,
          displayName: data.display_name || data.username,
          avatarUrl: data.avatar_url || undefined,
          about: data.about || undefined,
          createdAt: data.created_at,
          lastSeen: data.last_seen,
        };
        userProfileCache.set(profile.id, profile);
        return profile;
      }
    } catch (err) {
      console.warn('Failed to fetch profile by username from Supabase:', err);
    }
  }

  const localUsers = getAllStoredUsers();
  return localUsers.find((u) => normalizeUsername(u.username) === normalized) || null;
}

/**
 * Check if a username is already taken
 */
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; existingUser?: UserProfile }> {
  const normalized = normalizeUsername(username);
  if (!normalized) return { available: false };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', normalized)
        .maybeSingle();

      if (!error && data) {
        const existing: UserProfile = {
          id: data.id,
          username: data.username,
          displayName: data.display_name || data.username,
          avatarUrl: data.avatar_url || undefined,
          about: data.about || undefined,
          createdAt: data.created_at,
        };
        userProfileCache.set(data.id, existing);
        return { available: false, existingUser: existing };
      }
      return { available: true };
    } catch (err) {
      console.warn('Supabase username check error:', err);
    }
  }

  // Local fallback
  const users = getAllStoredUsers();
  const existing = users.find((u) => normalizeUsername(u.username) === normalized);
  return { available: !existing, existingUser: existing };
}

/**
 * Register new user profile with globally unique username, or return existing
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

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', normalized)
        .maybeSingle();

      if (existing) {
        const profile: UserProfile = {
          id: existing.id,
          username: existing.username,
          displayName: existing.display_name || existing.username,
          avatarUrl: existing.avatar_url || avatarUrl || undefined,
          about: existing.about || undefined,
          createdAt: existing.created_at,
        };
        userProfileCache.set(profile.id, profile);
        return profile;
      }

      // Insert new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: internalId,
          username: normalized,
          display_name: finalDisplayName,
          avatar_url: avatarUrl || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Store hashed session token
      try {
        await supabase.from('identity_secrets').insert({
          profile_id: internalId,
          session_token_hash: sessionToken,
        });
      } catch (secErr) {
        console.warn('Identity secrets record skipped:', secErr);
      }

      const newProfile: UserProfile = {
        id: data.id,
        username: data.username,
        displayName: data.display_name || data.username,
        avatarUrl: data.avatar_url || avatarUrl,
        createdAt: data.created_at,
      };

      userProfileCache.set(newProfile.id, newProfile);

      // Save in local registry as cache
      const users = getAllStoredUsers();
      if (!users.some((u) => u.id === newProfile.id)) {
        users.push(newProfile);
        saveStoredUsers(users);
      }

      return newProfile;
    } catch (err: unknown) {
      console.warn('Supabase registration error, falling back to local:', err);
    }
  }

  // Local fallback
  const newProfile: UserProfile = {
    id: internalId,
    username: normalized,
    displayName: finalDisplayName,
    avatarUrl,
    createdAt: new Date().toISOString(),
    isOnline: true,
  };

  const users = getAllStoredUsers();
  users.push(newProfile);
  saveStoredUsers(users);
  return newProfile;
}

/**
 * Update user profile across stores and Supabase
 */
export async function updateUserProfileInStorage(updated: UserProfile): Promise<void> {
  userProfileCache.set(updated.id, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('profiles')
        .update({
          display_name: updated.displayName,
          avatar_url: updated.avatarUrl || null,
          about: updated.about || null,
          last_seen: new Date().toISOString(),
        })
        .eq('id', updated.id);
    } catch (err) {
      console.warn('Supabase profile update fallback to local:', err);
    }
  }

  const users = getAllStoredUsers();
  const idx = users.findIndex((u) => u.id === updated.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updated };
    saveStoredUsers(users);
  }

  broadcastEvent({
    type: 'PROFILE_UPDATE',
    senderId: updated.id,
    senderUsername: updated.username,
    profile: updated,
  });
}

/**
 * Search users by username query in Supabase (global discovery)
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
        .limit(20);

      if (normalized) {
        req = req.ilike('username', `%${normalized}%`);
      }

      const { data } = await req;
      if (data) {
        return data.map((d) => {
          const u: UserProfile = {
            id: d.id,
            username: d.username,
            displayName: d.display_name || d.username,
            avatarUrl: d.avatar_url || undefined,
            about: d.about || undefined,
            createdAt: d.created_at,
          };
          userProfileCache.set(u.id, u);
          return u;
        });
      }
    } catch (err) {
      console.warn('Supabase search fallback to local:', err);
    }
  }

  const users = getAllStoredUsers();
  if (!normalized) {
    return users.filter((u) => u.id !== currentUserId);
  }

  return users.filter(
    (u) =>
      u.id !== currentUserId &&
      (normalizeUsername(u.username).includes(normalized) ||
        (u.displayName && u.displayName.toLowerCase().includes(normalized)))
  );
}

// -------------------------------------------------------------
// CONVERSATIONS
// -------------------------------------------------------------

export async function fetchUserConversations(currentUserId: string): Promise<Conversation[]> {
  ensureSupabaseRealtime();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: partRows, error: pErr } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          is_pinned,
          is_muted,
          conversations (
            id,
            created_at,
            updated_at,
            last_message_at
          )
        `)
        .eq('profile_id', currentUserId);

      if (!pErr && partRows && partRows.length > 0) {
        const convIds = partRows.map((r: any) => r.conversation_id);

        // Get participants in these conversations
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            profile_id,
            profiles (
              id,
              username,
              display_name,
              avatar_url,
              about,
              last_seen
            )
          `)
          .in('conversation_id', convIds);

        // Get recent messages for previews
        const { data: recentMsgs } = await supabase
          .from('messages')
          .select('*, profiles(id, username, display_name, avatar_url)')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false });

        const latestMsgMap = new Map<string, Message>();
        const messagesMap = getAllStoredMessages();
        let hasNewCached = false;

        if (recentMsgs) {
          for (const m of recentMsgs) {
            const parsedMsg: Message = {
              id: m.id,
              conversationId: m.conversation_id,
              senderId: m.sender_id,
              senderUsername: m.profiles?.username || 'user',
              senderDisplayName: m.profiles?.display_name || m.profiles?.username || 'User',
              senderAvatarUrl: m.profiles?.avatar_url || undefined,
              content: m.content,
              type: (m.type as MessageType) || 'text',
              mediaUrl: m.media_url || undefined,
              imageUrl: (m.media_url && !m.duration && m.type !== 'voice') ? m.media_url : undefined,
              duration: m.duration ? Number(m.duration) : undefined,
              reactions: [],
              createdAt: m.created_at,
              isDeleted: m.is_deleted || false,
              status: m.is_read ? 'read' : 'sent',
            };

            if (!latestMsgMap.has(m.conversation_id)) {
              latestMsgMap.set(m.conversation_id, parsedMsg);
            }

            const currentConvMsgs = messagesMap[m.conversation_id] || [];
            if (!currentConvMsgs.some((x) => x.id === m.id)) {
              messagesMap[m.conversation_id] = [...currentConvMsgs, parsedMsg];
              hasNewCached = true;
            }
          }
        }

        if (hasNewCached) {
          saveStoredMessages(messagesMap);
        }

        const partMap = new Map<string, any[]>();
        if (allParticipants) {
          for (const ap of allParticipants) {
            const list = partMap.get(ap.conversation_id) || [];
            list.push(ap);
            partMap.set(ap.conversation_id, list);
          }
        }

        const convs: Conversation[] = partRows.map((pr: any) => {
          const convData = pr.conversations || {};
          const parts = partMap.get(pr.conversation_id) || [];
          const otherPartRow = parts.find((p: any) => p.profile_id !== currentUserId) || parts[0];
          const otherProfile = otherPartRow?.profiles || {};

          const participantsList = parts.map((p: any) => ({
            userId: p.profile_id,
            username: p.profiles?.username || 'user',
            displayName: p.profiles?.display_name || p.profiles?.username || 'User',
            avatarUrl: p.profiles?.avatar_url,
            about: p.profiles?.about,
            isOnline: true,
          }));

          const otherParticipant = {
            userId: otherPartRow?.profile_id || '',
            username: otherProfile.username || 'user',
            displayName: otherProfile.display_name || otherProfile.username || 'User',
            avatarUrl: otherProfile.avatar_url,
            about: otherProfile.about,
            isOnline: true,
          };

          const lastMsg = latestMsgMap.get(pr.conversation_id);

          return {
            id: pr.conversation_id,
            participants: participantsList,
            otherParticipant,
            lastMessage: lastMsg,
            unreadCount: 0,
            isPinned: Boolean(pr.is_pinned),
            isMuted: Boolean(pr.is_muted),
            createdAt: convData.created_at || new Date().toISOString(),
            updatedAt:
              lastMsg?.createdAt ||
              convData.updated_at ||
              convData.created_at ||
              new Date().toISOString(),
          };
        });

        convs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        saveStoredConversations(currentUserId, convs);
        return convs;
      }
    } catch (err) {
      console.warn('Supabase fetch conversations fallback to local:', err);
    }
  }

  // Local fallback
  return getAllStoredConversations(currentUserId);
}

export async function getOrCreateConversation(
  currentUser: UserProfile,
  targetUser: UserProfile
): Promise<Conversation> {
  ensureSupabaseRealtime();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // 1. Check if conversation already exists between both users in Supabase
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('profile_id', currentUser.id);

      if (myConvs && myConvs.length > 0) {
        const convIds = myConvs.map((c) => c.conversation_id);
        const { data: shared } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('profile_id', targetUser.id)
          .limit(1)
          .maybeSingle();

        if (shared?.conversation_id) {
          const convId = shared.conversation_id;
          const now = new Date().toISOString();
          const conv: Conversation = {
            id: convId,
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
                isOnline: true,
              },
            ],
            otherParticipant: {
              userId: targetUser.id,
              username: targetUser.username,
              displayName: targetUser.displayName,
              avatarUrl: targetUser.avatarUrl,
              isOnline: true,
            },
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            createdAt: now,
            updatedAt: now,
          };
          return conv;
        }
      }

      // 2. Create new conversation in Supabase
      const { data: newConvRow, error: convErr } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (newConvRow && !convErr) {
        await supabase.from('conversation_participants').insert([
          { conversation_id: newConvRow.id, profile_id: currentUser.id },
          { conversation_id: newConvRow.id, profile_id: targetUser.id },
        ]);

        const conv: Conversation = {
          id: newConvRow.id,
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
              isOnline: true,
            },
          ],
          otherParticipant: {
            userId: targetUser.id,
            username: targetUser.username,
            displayName: targetUser.displayName,
            avatarUrl: targetUser.avatarUrl,
            isOnline: true,
          },
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          createdAt: newConvRow.created_at,
          updatedAt: newConvRow.updated_at,
        };

        const localConvs = getAllStoredConversations(currentUser.id);
        saveStoredConversations(currentUser.id, [conv, ...localConvs.filter((c) => c.id !== conv.id)]);
        return conv;
      }
    } catch (err) {
      console.warn('Supabase getOrCreateConversation error, falling back:', err);
    }
  }

  // Local fallback
  const conversations = getAllStoredConversations(currentUser.id);
  const existing = conversations.find((c) => c.otherParticipant.userId === targetUser.id);
  if (existing) return existing;

  const newConvId = generateUUID();
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
  return newConv;
}

export async function togglePinConversation(currentUserId: string, conversationId: string): Promise<Conversation[]> {
  const convs = getAllStoredConversations(currentUserId);
  const target = convs.find((c) => c.id === conversationId);
  if (target) {
    target.isPinned = !target.isPinned;
    saveStoredConversations(currentUserId, convs);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('conversation_participants')
          .update({ is_pinned: target.isPinned })
          .eq('conversation_id', conversationId)
          .eq('profile_id', currentUserId);
      } catch (e) {
        console.warn('Error updating pin status in Supabase:', e);
      }
    }
  }
  return convs;
}

export async function toggleMuteConversation(currentUserId: string, conversationId: string): Promise<Conversation[]> {
  const convs = getAllStoredConversations(currentUserId);
  const target = convs.find((c) => c.id === conversationId);
  if (target) {
    target.isMuted = !target.isMuted;
    saveStoredConversations(currentUserId, convs);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('conversation_participants')
          .update({ is_muted: target.isMuted })
          .eq('conversation_id', conversationId)
          .eq('profile_id', currentUserId);
      } catch (e) {
        console.warn('Error updating mute status in Supabase:', e);
      }
    }
  }
  return convs;
}

export async function clearConversationMessages(currentUserId: string, conversationId: string): Promise<void> {
  const messagesMap = getAllStoredMessages();
  messagesMap[conversationId] = [];
  saveStoredMessages(messagesMap);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('messages').delete().eq('conversation_id', conversationId);
    } catch (e) {
      console.warn('Failed to clear Supabase messages:', e);
    }
  }

  const convs = getAllStoredConversations(currentUserId);
  const target = convs.find((c) => c.id === conversationId);
  if (target) {
    target.lastMessage = undefined;
    target.unreadCount = 0;
    saveStoredConversations(currentUserId, convs);
  }
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  ensureSupabaseRealtime();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(id, username, display_name, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const messageIds = data.map((m: any) => m.id);
        const reactionsMap: Record<string, MessageReaction[]> = {};

        if (messageIds.length > 0) {
          const { data: rData } = await supabase
            .from('message_reactions')
            .select('id, message_id, profile_id, emoji, created_at, profiles(username)')
            .in('message_id', messageIds);

          if (rData) {
            for (const r of rData) {
              const list = reactionsMap[r.message_id] || [];
              list.push({
                id: r.id,
                messageId: r.message_id,
                userId: r.profile_id,
                username: (r as any).profiles?.username || '',
                emoji: r.emoji,
                createdAt: r.created_at,
              });
              reactionsMap[r.message_id] = list;
            }
          }
        }

        const messagesMap = getAllStoredMessages();
        const existingLocal = messagesMap[conversationId] || [];

        const messages: Message[] = data.map((m: any) => {
          let replyRef: Message['replyTo'] = undefined;
          if (m.reply_to_id) {
            const found = data.find((x: any) => x.id === m.reply_to_id);
            if (found) {
              replyRef = {
                id: found.id,
                senderId: found.sender_id,
                senderUsername: found.profiles?.username || 'user',
                senderDisplayName: found.profiles?.display_name || found.profiles?.username || 'User',
                content: found.content,
                type: found.type as MessageType,
              };
            }
          }

          const cached = existingLocal.find((x) => x.id === m.id);

          return {
            id: m.id,
            conversationId: m.conversation_id,
            senderId: m.sender_id,
            senderUsername: m.profiles?.username || 'user',
            senderDisplayName: m.profiles?.display_name || m.profiles?.username || 'User',
            senderAvatarUrl: m.profiles?.avatar_url || undefined,
            content: m.content,
            type: (m.type as MessageType) || 'text',
            mediaUrl: m.media_url || undefined,
            imageUrl: (m.media_url && !m.duration && m.type !== 'voice') ? m.media_url : undefined,
            duration: m.duration ? Number(m.duration) : undefined,
            replyTo: replyRef,
            reactions: reactionsMap[m.id] || [],
            createdAt: m.created_at,
            editedAt: m.edited_at || undefined,
            isDeleted: m.is_deleted || false,
            status: (m.is_read || cached?.status === 'read') ? 'read' : 'sent',
          };
        });

        // Merge to ensure no locally saved / realtime messages are dropped
        const mergedMap = new Map<string, Message>();
        for (const msg of existingLocal) {
          mergedMap.set(msg.id, msg);
        }
        for (const msg of messages) {
          mergedMap.set(msg.id, msg);
        }

        const mergedMessages = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        messagesMap[conversationId] = mergedMessages;
        saveStoredMessages(messagesMap);
        return mergedMessages;
      }
    } catch (err) {
      console.warn('Supabase fetch messages fallback to local:', err);
    }
  }

  // Local fallback
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

  // Check blocked status
  const senderBlocked = getStoredBlockedUserIds(sender.id);
  const userConvs = getAllStoredConversations(sender.id);
  const conv = userConvs.find((c) => c.id === conversationId);
  const otherUserId = conv?.otherParticipant?.userId;

  if (otherUserId && senderBlocked.includes(otherUserId)) {
    throw new Error('You have blocked this user. Unblock them to send messages.');
  }

  const finalMediaUrl = mediaUrl || imageUrl || undefined;

  const newMessage: Message = {
    id: messageId,
    conversationId,
    senderId: sender.id,
    senderUsername: sender.username,
    senderDisplayName: sender.displayName,
    senderAvatarUrl: sender.avatarUrl,
    content,
    type,
    mediaUrl: finalMediaUrl,
    imageUrl: imageUrl || (type !== 'voice' && !duration ? finalMediaUrl : undefined),
    duration,
    replyTo,
    reactions: [],
    createdAt: now,
    status: 'sent',
  };

  // 1. Immediately save to local stored messages cache (0ms)
  const messagesMap = getAllStoredMessages();
  const currentList = messagesMap[conversationId] || [];
  if (!currentList.some((m) => m.id === newMessage.id)) {
    messagesMap[conversationId] = [...currentList, newMessage];
    saveStoredMessages(messagesMap);
  }

  // 2. Immediately update conversation in local cache (0ms)
  if (conv) {
    conv.lastMessage = newMessage;
    conv.updatedAt = now;
    saveStoredConversations(sender.id, userConvs);
  }

  // 3. Immediately broadcast locally and across tabs (0ms)
  broadcastEvent({
    type: 'NEW_MESSAGE',
    conversationId,
    senderId: sender.id,
    senderUsername: sender.username,
    message: newMessage,
  });

  // 4. Background sync to Supabase without blocking the return
  const supabase = getSupabaseClient();
  if (supabase) {
    (async () => {
      try {
        const { data: insertedMsg, error: insertError } = await supabase
          .from('messages')
          .insert({
            id: messageId,
            conversation_id: conversationId,
            sender_id: sender.id,
            content,
            type: type === 'voice' ? 'voice' : 'text',
            media_url: finalMediaUrl || null,
            duration: duration || null,
            reply_to_id: replyTo?.id || null,
            is_deleted: false,
            created_at: now,
          })
          .select('*, profiles(id, username, display_name, avatar_url)')
          .single();

        if (insertError) {
          console.warn('Supabase message insert notice:', insertError.message);
        } else if (insertedMsg) {
          await supabase
            .from('conversations')
            .update({
              last_message_at: now,
              updated_at: now,
            })
            .eq('id', conversationId);
        }
      } catch (err: unknown) {
        console.warn('Supabase background send notice:', err);
      }
    })();
  }

  return newMessage;
}

export async function toggleMessageReaction(
  conversationId: string,
  messageId: string,
  user: UserProfile,
  emoji: string
): Promise<MessageReaction[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('profile_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from('message_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('message_reactions').insert({
          id: generateUUID(),
          message_id: messageId,
          profile_id: user.id,
          emoji,
        });
      }

      const { data: refreshed } = await supabase
        .from('message_reactions')
        .select('id, message_id, profile_id, emoji, created_at, profiles(username)')
        .eq('message_id', messageId);

      if (refreshed) {
        const reactions: MessageReaction[] = refreshed.map((r: any) => ({
          id: r.id,
          messageId: r.message_id,
          userId: r.profile_id,
          username: r.profiles?.username || user.username,
          emoji: r.emoji,
          createdAt: r.created_at,
        }));

        const messagesMap = getAllStoredMessages();
        const list = messagesMap[conversationId] || [];
        const message = list.find((m) => m.id === messageId);
        if (message) {
          message.reactions = reactions;
          saveStoredMessages(messagesMap);
          broadcastEvent({
            type: 'REACTION_UPDATE',
            conversationId,
            senderId: user.id,
            message,
          });
        }
        return reactions;
      }
    } catch (err) {
      console.warn('Supabase toggle reaction error:', err);
    }
  }

  // Local fallback
  const messagesMap = getAllStoredMessages();
  const list = messagesMap[conversationId] || [];
  const message = list.find((m) => m.id === messageId);
  if (!message) return [];

  const existingIndex = message.reactions.findIndex((r) => r.userId === user.id && r.emoji === emoji);
  if (existingIndex >= 0) {
    message.reactions.splice(existingIndex, 1);
  } else {
    const newReaction: MessageReaction = {
      id: generateUUID(),
      messageId,
      userId: user.id,
      username: user.username,
      emoji,
      createdAt: new Date().toISOString(),
    };
    message.reactions.push(newReaction);
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
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      await supabase
        .from('messages')
        .update({
          content: newContent,
          edited_at: now,
        })
        .eq('id', messageId)
        .eq('sender_id', userId);
    } catch (err) {
      console.warn('Supabase edit message error:', err);
    }
  }

  const messagesMap = getAllStoredMessages();
  const list = messagesMap[conversationId] || [];
  const message = list.find((m) => m.id === messageId);

  if (!message || message.senderId !== userId) {
    return null;
  }

  message.content = newContent;
  message.editedAt = now;
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
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('messages')
        .update({
          is_deleted: true,
          content: 'This message was deleted',
          media_url: null,
        })
        .eq('id', messageId)
        .eq('sender_id', userId);

      await supabase.from('message_reactions').delete().eq('message_id', messageId);
    } catch (err) {
      console.warn('Supabase delete message error:', err);
    }
  }

  const messagesMap = getAllStoredMessages();
  const list = messagesMap[conversationId] || [];
  const message = list.find((m) => m.id === messageId);

  if (!message || message.senderId !== userId) {
    return false;
  }

  message.isDeleted = true;
  message.content = 'This message was deleted';
  message.mediaUrl = undefined;
  message.imageUrl = undefined;
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
  // Broadcast locally
  broadcastEvent({
    type: 'TYPING',
    conversationId,
    senderId: user.id,
    senderUsername: user.username,
    isTyping,
  });

  // Broadcast across devices via Supabase channel
  if (supabaseChannelInstance) {
    try {
      supabaseChannelInstance.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversationId,
          senderId: user.id,
          senderUsername: user.username,
          isTyping,
        },
      });
    } catch (e) {
      console.warn('Failed to broadcast typing via Supabase:', e);
    }
  }
}

export function markConversationMessagesAsRead(conversationId: string, currentUserId: string): boolean {
  const messagesMap = getAllStoredMessages();
  const list = messagesMap[conversationId];
  if (!list || list.length === 0) return false;

  let hasUnread = false;
  const updatedList = list.map((msg) => {
    // If sent by someone else and not yet marked as read, mark it as read
    if (msg.senderId !== currentUserId && msg.status !== 'read') {
      hasUnread = true;
      return { ...msg, status: 'read' as const };
    }
    return msg;
  });

  if (!hasUnread) return false;

  messagesMap[conversationId] = updatedList;
  saveStoredMessages(messagesMap);

  // Broadcast locally and to other tabs
  broadcastEvent({
    type: 'MESSAGES_READ',
    conversationId,
    readerId: currentUserId,
  });

  // Broadcast to other devices via Supabase channel
  if (supabaseChannelInstance) {
    try {
      supabaseChannelInstance.send({
        type: 'broadcast',
        event: 'read_receipt',
        payload: {
          conversationId,
          readerId: currentUserId,
        },
      });
    } catch (e) {
      console.warn('Failed to broadcast read receipt via Supabase:', e);
    }
  }

  // Also update Supabase in background if supported
  const supabase = getSupabaseClient();
  if (supabase) {
    (async () => {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', currentUserId);
      } catch {
        // Silent catch if is_read column doesn't exist
      }
    })();
  }

  return true;
}

