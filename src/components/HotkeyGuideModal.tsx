import React from 'react';
import { X, Keyboard, Zap, Sparkles } from 'lucide-react';

interface HotkeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeyGuideModal: React.FC<HotkeyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: '⌘ + K', alt: 'Ctrl + K', action: 'Instant Quick Log Modal (Speech-to-text / Type)' },
    { key: 'N', alt: '', action: 'New accomplishment note' },
    { key: 'Shift + R', alt: '', action: 'Generate or view AI Weekly Summary' },
    { key: '1 - 9', alt: '', action: 'Quick filter by project index' },
    { key: '?', alt: 'Shift + /', action: 'Toggle keyboard shortcuts reference' },
    { key: 'Esc', alt: '', action: 'Close any active dialog or drawer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-400">
                Instant logging shortcuts for busy workdays
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-3">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl"
            >
              <span className="text-xs font-medium text-slate-200">{item.action}</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono font-bold text-indigo-300">
                  {item.key}
                </kbd>
                {item.alt && (
                  <span className="text-[10px] text-slate-500 font-mono">({item.alt})</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
