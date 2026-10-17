import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Conversation, Message, SessionData, ToastMessage, UserProfile } from '../types';
import {
  clearSession,
  generateSessionToken,
  generateUUID,
  getSavedProfile,
  getSavedSession,
  saveSessionAndProfile,
} from '../lib/identity';
import {
  clearConversationMessages,
  deleteMessage,
  editMessage,
  fetchMessages,
  fetchUserConversations,
  getOrCreateConversation,
  registerUserProfile,
  sendMessage,
  subscribeToRealtimeEvents,
  toggleMessageReaction,
  toggleMuteConversation,
  togglePinConversation,
  broadcastTypingStatus,
  updateUserProfileInStorage,
  getStoredBlockedUserIds,
  blockUserInStorage,
  unblockUserInStorage,
  getUserProfileByUsername,
} from '../services/db';
import { uploadVoiceAudio, playNotificationSound, playSendSound } from '../lib/audio';
import { ChatContext } from './chatContextInstance';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getSavedProfile());
  const [session, setSession] = useState<SessionData | null>(() => getSavedSession());
  const isLoadingAuth = false;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [searchQueryInChat, setSearchQueryInChat] = useState('');
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    const profile = getSavedProfile();
    return profile?.id ? getStoredBlockedUserIds(profile.id) : [];
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const currentUserRef = useRef<UserProfile | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const activeConversationRef = useRef<Conversation | null>(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Sync state during render when user changes
  const [prevUserId, setPrevUserId] = useState(currentUser?.id);
  if (currentUser?.id !== prevUserId) {
    setPrevUserId(currentUser?.id);
    if (!currentUser?.id) {
      setBlockedUserIds([]);
      setConversations([]);
      setActiveConversation(null);
      setActiveMessages([]);
    } else {
      setBlockedUserIds(getStoredBlockedUserIds(currentUser.id));
    }
  }

  // Set loading state and clear messages during render when active conversation changes
  const [prevActiveConvId, setPrevActiveConvId] = useState(activeConversation?.id);
  if (activeConversation?.id !== prevActiveConvId) {
    setPrevActiveConvId(activeConversation?.id);
    if (!activeConversation?.id) {
      setActiveMessages([]);
      setIsLoadingMessages(false);
    } else {
      setIsLoadingMessages(true);
    }
  }

  // 1. Load conversations when current user is available
  useEffect(() => {
    if (!currentUser?.id) return;
    let isCancelled = false;

    fetchUserConversations(currentUser.id).then((convs) => {
      if (!isCancelled) {
        setConversations(convs);
        if (convs.length > 0 && !activeConversationRef.current) {
          // Select first conversation by default on desktop
          if (window.innerWidth >= 768) {
            setActiveConversation(convs[0]);
          }
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  // 2. Load messages when active conversation changes
  const activeConversationId = activeConversation?.id;
  useEffect(() => {
    if (!activeConversationId) return;

    let isCancelled = false;
    fetchMessages(activeConversationId).then((msgs) => {
      if (!isCancelled) {
        setActiveMessages(msgs);
        setIsLoadingMessages(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeConversationId]);

  // 4. Realtime events listener (stays connected for the session lifetime)
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribeToRealtimeEvents((payload) => {
      const currentActive = activeConversationRef.current;
      const loggedInUser = currentUserRef.current;

      if (payload.type === 'NEW_MESSAGE' && payload.message) {
        const msg = payload.message;

        // Play chime if message came from another user
        if (loggedInUser && msg.senderId !== loggedInUser.id) {
          playNotificationSound();
        }

        // Instantly dismiss typing indicator for this conversation when a message arrives
        setTypingMap((prev) => {
          if (!prev[msg.conversationId]) return prev;
          const next = { ...prev };
          delete next[msg.conversationId];
          return next;
        });

        // If message belongs to active conversation, append
        if (currentActive && msg.conversationId === currentActive.id) {
          setActiveMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }

        // Update conversation preview and sort
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === msg.conversationId);
          if (!exists && loggedInUser?.id) {
            // New conversation arrived from another device!
            fetchUserConversations(loggedInUser.id).then(setConversations);
            return prev;
          }

          const updated = prev.map((c) => {
            if (c.id === msg.conversationId) {
              const isCurrentChat = currentActive?.id === c.id;
              return {
                ...c,
                lastMessage: msg,
                unreadCount: isCurrentChat ? 0 : (c.unreadCount || 0) + 1,
                updatedAt: msg.createdAt,
              };
            }
            return c;
          });

          return updated.sort(
            (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
          );
        });
      } else if (payload.type === 'REACTION_UPDATE' && payload.message) {
        const updatedMsg = payload.message;
        if (currentActive && updatedMsg.conversationId === currentActive.id) {
          setActiveMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      } else if (payload.type === 'EDIT_MESSAGE' && payload.message) {
        const editedMsg = payload.message;
        if (currentActive && editedMsg.conversationId === currentActive.id) {
          setActiveMessages((prev) =>
            prev.map((m) => (m.id === editedMsg.id ? editedMsg : m))
          );
        }
      } else if (payload.type === 'DELETE_MESSAGE' && payload.message) {
        const deletedMsg = payload.message;
        if (currentActive && deletedMsg.conversationId === currentActive.id) {
          setActiveMessages((prev) =>
            prev.map((m) => (m.id === deletedMsg.id ? deletedMsg : m))
          );
        }
      } else if (payload.type === 'TYPING' && payload.conversationId) {
        const { conversationId, isTyping, senderUsername, senderId } = payload;
        // Never process own typing events to avoid self-typing confusion
        if (
          (senderId && loggedInUser?.id && senderId === loggedInUser.id) ||
          (senderUsername && loggedInUser?.username && senderUsername.toLowerCase() === loggedInUser.username.toLowerCase())
        ) {
          return;
        }

        setTypingMap((prev) => {
          if (isTyping && senderUsername) {
            return { ...prev, [conversationId]: senderUsername };
          }
          if (!prev[conversationId]) return prev;
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
      } else if (payload.type === 'PROFILE_UPDATE' && payload.profile) {
        const updatedUser = payload.profile;
        setConversations((prev) =>
          prev.map((c) => {
            const hasUser =
              c.otherParticipant.userId === updatedUser.id ||
              c.participants.some((p) => p.userId === updatedUser.id);
            if (!hasUser) return c;
            return {
              ...c,
              otherParticipant:
                c.otherParticipant.userId === updatedUser.id
                  ? {
                      ...c.otherParticipant,
                      displayName: updatedUser.displayName,
                      avatarUrl: updatedUser.avatarUrl,
                      about: updatedUser.about,
                    }
                  : c.otherParticipant,
              participants: c.participants.map((p) =>
                p.userId === updatedUser.id
                  ? {
                      ...p,
                      displayName: updatedUser.displayName,
                      avatarUrl: updatedUser.avatarUrl,
                      about: updatedUser.about,
                    }
                  : p
              ),
            };
          })
        );

        setActiveConversation((prev) => {
          if (!prev || prev.otherParticipant.userId !== updatedUser.id) return prev;
          return {
            ...prev,
            otherParticipant: {
              ...prev.otherParticipant,
              displayName: updatedUser.displayName,
              avatarUrl: updatedUser.avatarUrl,
              about: updatedUser.about,
            },
          };
        });

        setActiveMessages((prev) =>
          prev.map((m) =>
            m.senderId === updatedUser.id
              ? {
                  ...m,
                  senderDisplayName: updatedUser.displayName,
                  senderAvatarUrl: updatedUser.avatarUrl,
                }
              : m
          )
        );
      } else if (payload.type === 'BLOCK_STATUS_UPDATE') {
        if (loggedInUser?.id) {
          setBlockedUserIds(getStoredBlockedUserIds(loggedInUser.id));
        }
      }
    });

    return unsubscribe;
  }, [currentUser?.id]);

  // Onboard new user with unique username and optional profile photo
  const onboardUser = async (username: string, displayName?: string, avatarUrl?: string): Promise<boolean> => {
    try {
      const sessionToken = generateSessionToken();
      const profile = await registerUserProfile(username, sessionToken, displayName, avatarUrl);
      const newSession: SessionData = {
        userId: profile.id,
        username: profile.username,
        sessionToken,
        createdAt: new Date().toISOString(),
      };

      saveSessionAndProfile(newSession, profile);
      setSession(newSession);
      setCurrentUser(profile);
      showToast(`Welcome to MessMe, @${profile.username}!`, 'success', 'Identity Established');
      return true;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Registration failed', 'error');
      return false;
    }
  };

  // Login with existing username on this or another device
  const loginWithUsername = async (username: string): Promise<boolean> => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      showToast('Please enter a username.', 'warning');
      return false;
    }

    try {
      const existing = await getUserProfileByUsername(cleanUser);
      if (!existing) {
        showToast(`User @${cleanUser} not found. Please pick a new username to register.`, 'error');
        return false;
      }

      const sessionToken = generateSessionToken();
      const newSession: SessionData = {
        userId: existing.id,
        username: existing.username,
        sessionToken,
        createdAt: new Date().toISOString(),
      };

      saveSessionAndProfile(newSession, existing);
      setSession(newSession);
      setCurrentUser(existing);
      showToast(`Welcome back, @${existing.username}!`, 'success', 'Device Connected');
      return true;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Login failed', 'error');
      return false;
    }
  };

  // Restore session using backup token or username
  const restoreSessionWithToken = async (sessionToken: string, username: string): Promise<boolean> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanToken = sessionToken.trim();

    if (!cleanUser) {
      showToast('Please provide your username.', 'warning');
      return false;
    }

    try {
      // First check if user exists in Supabase
      const existing = await getUserProfileByUsername(cleanUser);
      const profileToUse: UserProfile = existing || {
        id: generateUUID(),
        username: cleanUser,
        displayName: cleanUser,
        createdAt: new Date().toISOString(),
        isOnline: true,
      };

      const finalToken = cleanToken || generateSessionToken();
      const newSession: SessionData = {
        userId: profileToUse.id,
        username: cleanUser,
        sessionToken: finalToken,
        createdAt: new Date().toISOString(),
      };

      saveSessionAndProfile(newSession, profileToUse);
      setSession(newSession);
      setCurrentUser(profileToUse);
      showToast(`Identity for @${cleanUser} connected successfully.`, 'success', 'Session Restored');
      return true;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to restore session', 'error');
      return false;
    }
  };

  const logoutUser = () => {
    clearSession();
    setSession(null);
    setCurrentUser(null);
    setActiveConversation(null);
    setActiveMessages([]);
    showToast('Your browser session was cleared.', 'info');
  };

  const setActiveConversationById = (convId: string) => {
    if (!convId) {
      setActiveConversation(null);
      setReplyingTo(null);
      setIsSearchInChatOpen(false);
      setSearchQueryInChat('');
      return;
    }
    const found = conversations.find((c) => c.id === convId);
    if (found) {
      // Mark as read
      const updated = { ...found, unreadCount: 0 };
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? updated : c))
      );
      setActiveConversation(updated);
      setReplyingTo(null);
      setIsSearchInChatOpen(false);
      setSearchQueryInChat('');
    }
  };

  const startChatWithUser = async (targetUser: UserProfile): Promise<Conversation> => {
    if (!currentUser) throw new Error('Not logged in');
    const conv = await getOrCreateConversation(currentUser, targetUser);
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
    setActiveConversation(conv);
    return conv;
  };

  const sendText = async (content: string) => {
    if (!currentUser || !activeConversation) return;
    const clean = content.trim();
    if (!clean) return;

    const replyRef = replyingTo
      ? {
          id: replyingTo.id,
          senderId: replyingTo.senderId,
          senderUsername: replyingTo.senderUsername,
          senderDisplayName: replyingTo.senderDisplayName,
          content: replyingTo.content,
          type: replyingTo.type,
        }
      : undefined;

    setReplyingTo(null);
    playSendSound();

    // Immediately clear own typing map
    setTypingMap((prev) => {
      if (!prev[activeConversation.id]) return prev;
      const next = { ...prev };
      delete next[activeConversation.id];
      return next;
    });

    await sendMessage(activeConversation.id, currentUser, clean, 'text', undefined, undefined, replyRef);
  };

  const sendVoice = async (blob: Blob, duration: number) => {
    if (!currentUser || !activeConversation) return;

    try {
      setTypingMap((prev) => {
        if (!prev[activeConversation.id]) return prev;
        const next = { ...prev };
        delete next[activeConversation.id];
        return next;
      });

      const mediaUrl = await uploadVoiceAudio(blob, currentUser.id);
      await sendMessage(
        activeConversation.id,
        currentUser,
        'Voice message',
        'voice',
        mediaUrl,
        duration,
        undefined
      );
      showToast('Voice message sent', 'success');
      playSendSound();
    } catch {
      showToast('Failed to send voice message', 'error');
    }
  };

  const sendImageMessage = async (imageDataUrl: string, caption = '') => {
    if (!currentUser || !activeConversation) return;
    try {
      setTypingMap((prev) => {
        if (!prev[activeConversation.id]) return prev;
        const next = { ...prev };
        delete next[activeConversation.id];
        return next;
      });

      await sendMessage(
        activeConversation.id,
        currentUser,
        caption || 'Shared an image',
        'text',
        imageDataUrl,
        undefined,
        undefined,
        imageDataUrl
      );
      showToast('Photo sent', 'success');
      playSendSound();
    } catch {
      showToast('Failed to send photo', 'error');
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!currentUser || !activeConversation) return;
    await toggleMessageReaction(activeConversation.id, messageId, currentUser, emoji);
  };

  const startReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const editUserMessage = async (messageId: string, content: string) => {
    if (!currentUser || !activeConversation) return;
    const updated = await editMessage(activeConversation.id, messageId, currentUser.id, content);
    if (!updated) {
      showToast('Could not edit this message', 'error');
    }
  };

  const deleteUserMessage = async (messageId: string) => {
    if (!currentUser || !activeConversation) return;
    const success = await deleteMessage(activeConversation.id, messageId, currentUser.id);
    if (success) {
      showToast('Message deleted', 'info');
    } else {
      showToast('Could not delete message', 'error');
    }
  };

  const togglePin = async (convId: string) => {
    if (!currentUser) return;
    const updated = await togglePinConversation(currentUser.id, convId);
    setConversations([...updated]);
  };

  const toggleMute = async (convId: string) => {
    if (!currentUser) return;
    const updated = await toggleMuteConversation(currentUser.id, convId);
    setConversations([...updated]);
  };

  const clearConversation = async (convId: string) => {
    if (!currentUser) return;
    await clearConversationMessages(currentUser.id, convId);
    if (activeConversation?.id === convId) {
      setActiveMessages([]);
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, lastMessage: undefined, unreadCount: 0 } : c))
    );
    showToast('Conversation cleared', 'info');
  };

  const blockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    blockUserInStorage(currentUser.id, targetUserId);
    setBlockedUserIds(getStoredBlockedUserIds(currentUser.id));
    showToast('User has been blocked', 'info');
  };

  const unblockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    unblockUserInStorage(currentUser.id, targetUserId);
    setBlockedUserIds(getStoredBlockedUserIds(currentUser.id));
    showToast('User has been unblocked', 'success');
  };

  const isBlocked = (userId: string) => {
    return blockedUserIds.includes(userId);
  };

  const updateCurrentUserProfile = async (displayName: string, avatarUrl?: string, about?: string) => {
    if (!currentUser || !session) return;
    const updated: UserProfile = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.username,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : currentUser.avatarUrl,
      about: about !== undefined ? about : currentUser.about,
    };
    saveSessionAndProfile(session, updated);
    setCurrentUser(updated);
    await updateUserProfileInStorage(updated);

    // Refresh conversation list participant info
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p.userId === updated.id
            ? { ...p, displayName: updated.displayName, avatarUrl: updated.avatarUrl, about: updated.about }
            : p
        ),
      }))
    );

    // Refresh currently visible active messages
    setActiveMessages((prev) =>
      prev.map((m) =>
        m.senderId === updated.id
          ? {
              ...m,
              senderDisplayName: updated.displayName,
              senderAvatarUrl: updated.avatarUrl,
            }
          : m
      )
    );

    showToast('Profile updated successfully', 'success');
  };

  const setDraftForConversation = (convId: string, draft: string) => {
    setDrafts((prev) => ({ ...prev, [convId]: draft }));
  };

  const notifyTyping = (isTyping: boolean) => {
    if (!currentUser || !activeConversation) return;
    broadcastTypingStatus(activeConversation.id, currentUser, isTyping);
  };

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        session,
        isLoadingAuth,
        conversations,
        activeConversation,
        activeMessages,
        isLoadingMessages,
        typingMap,
        replyingTo,
        searchQueryInChat,
        isSearchInChatOpen,
        toasts,
        drafts,
        blockedUserIds,
        onboardUser,
        loginWithUsername,
        restoreSessionWithToken,
        logoutUser,
        setActiveConversationById,
        startChatWithUser,
        sendText,
        sendVoice,
        sendImageMessage,
        reactToMessage,
        startReply,
        cancelReply,
        editUserMessage,
        deleteUserMessage,
        togglePin,
        toggleMute,
        clearConversation,
        blockUser,
        unblockUser,
        isBlocked,
        updateCurrentUserProfile,
        setSearchQueryInChat,
        setIsSearchInChatOpen,
        setDraftForConversation,
        showToast,
        removeToast,
        notifyTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
