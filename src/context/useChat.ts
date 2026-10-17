import { useContext } from 'react';
import { ChatContext } from './chatContextInstance';
import type { ChatContextType } from './chatContextInstance';

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
