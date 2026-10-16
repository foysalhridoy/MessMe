import { useState, useEffect } from 'react';
import { useChat } from './context/ChatContext';
import { WelcomeScreen } from './components/onboarding/WelcomeScreen';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { ToastContainer } from './components/common/Toast';
import { MessageSquare, Loader2 } from 'lucide-react';

export function App() {
  const {
    currentUser,
    isLoadingAuth,
    activeConversation,
    setActiveConversationById,
    toasts,
    removeToast,
  } = useChat();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Initial Authentication Check Loader
  if (isLoadingAuth) {
    return (
      <div className="h-[100dvh] w-full bg-white flex flex-col items-center justify-center p-4 select-none">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/20 mb-3 animate-pulse">
          <MessageSquare className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">MessMe</h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Restoring session...
        </p>
      </div>
    );
  }

  // 2. Onboarding Screen if no user identity exists
  if (!currentUser) {
    return (
      <>
        <WelcomeScreen />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // 3. Main Messaging Interface
  return (
    <div className="h-[100dvh] w-full max-w-[100vw] bg-white flex overflow-hidden font-sans">
      {/* Sidebar: always visible on desktop (md+); visible on mobile when no active conversation */}
      <Sidebar
        className={`${
          isMobile && activeConversation ? 'hidden' : 'w-full md:w-80 lg:w-96 flex-shrink-0'
        }`}
        onSelectConversation={() => {
          // Handled inside sidebar
        }}
      />

      {/* Main Chat Area: always visible on desktop; visible on mobile only when active conversation is present */}
      <div
        className={`flex-1 h-full min-w-0 ${
          isMobile && !activeConversation ? 'hidden' : 'flex flex-col'
        }`}
      >
        <ChatArea
          onBackToSidebar={() => {
            // Unselect on mobile to return to sidebar list
            setActiveConversationById('');
          }}
        />
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
