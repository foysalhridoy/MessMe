import { useState } from 'react';
import { Radio, Server } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { isSupabaseConfigured, SUPABASE_URL, updateSupabaseCredentials } from '../../lib/supabase';
import { useChat } from '../../context/ChatContext';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useChat();
  const isLive = isSupabaseConfigured();

  const [url, setUrl] = useState(localStorage.getItem('messme_supabase_url') || '');
  const [anonKey, setAnonKey] = useState(localStorage.getItem('messme_supabase_key') || '');

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      updateSupabaseCredentials('', '');
      showToast('Switched to Direct Local Realtime Engine.', 'info');
      onClose();
      return;
    }

    if (!url.startsWith('https://')) {
      showToast('Supabase URL must start with https://', 'error');
      return;
    }

    updateSupabaseCredentials(url.trim(), anonKey.trim());
    showToast('Supabase credentials saved. Reloading...', 'success');
  };

  const handleResetToLocal = () => {
    updateSupabaseCredentials('', '');
    showToast('Switched to Direct Local Realtime Engine.', 'info');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Backend & Realtime Connection"
      description="Inspect active architecture or configure your own Supabase instance."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Active Engine Card */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50 flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
            }`}
          >
            {isLive ? <Server className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                {isLive ? 'Supabase PostgreSQL' : 'Local Multi-Tab Realtime Engine'}
              </h4>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isLive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {isLive ? 'Live DB' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {isLive
                ? `Connected to Supabase project at ${SUPABASE_URL}. Real-time channels and storage enabled.`
                : 'Using browser BroadcastChannel bus and isolated local storage. Real-time messaging runs directly between tabs and sessions with zero external delay.'}
            </p>
          </div>
        </div>

        {/* Runtime Supabase Connect Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-3 pt-1">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Connect Custom Supabase Backend
          </h5>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            To set up your tables, run the provided <code className="text-indigo-600">supabase/schema.sql</code> script in your Supabase SQL editor.
          </p>

          <div className="flex items-center justify-between pt-2">
            {isLive ? (
              <button
                type="button"
                onClick={handleResetToLocal}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Reset to Local Engine
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save &amp; Connect
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
