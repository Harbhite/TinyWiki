import React, { useEffect, useState } from 'react';

interface KeyboardShortcutsProps {
  onNewWiki: () => void;
  onLibrary: () => void;
  onPrint: () => void;
  onFocusInput: () => void;
}

/**
 * Feature 6: Keyboard Shortcuts
 * Global keyboard shortcuts for power users:
 *   N  — New Wiki (reset to home)
 *   L  — Library
 *   P  — Print
 *   /  — Focus topic input
 *   ?  — Toggle this help overlay
 *   Esc — Close help overlay
 */
export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onNewWiki,
  onLibrary,
  onPrint,
  onFocusInput,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      switch (e.key) {
        case '?':
          e.preventDefault();
          setShowHelp((v) => !v);
          break;
        case 'Escape':
          setShowHelp(false);
          break;
        case 'n':
        case 'N':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onNewWiki();
          }
          break;
        case 'l':
        case 'L':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onLibrary();
          }
          break;
        case 'p':
        case 'P':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onPrint();
          }
          break;
        case '/':
          e.preventDefault();
          onFocusInput();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNewWiki, onLibrary, onPrint, onFocusInput]);

  if (!showHelp) return null;

  const shortcuts = [
    { key: 'N', description: 'New Wiki' },
    { key: 'L', description: 'Open Library' },
    { key: 'P', description: 'Print current wiki' },
    { key: '/', description: 'Focus topic input' },
    { key: '?', description: 'Toggle this help' },
    { key: 'Esc', description: 'Close overlays' },
  ];

  return (
    <div
      className="fixed inset-0 bg-earth-brown/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-earth-brown">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-earth-brown/40 hover:text-terracotta transition-colors"
            aria-label="Close shortcuts help"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-earth-brown/70">{description}</span>
              <kbd className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-earth-brown font-bold">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-earth-brown/30 text-center mt-6">
          Press <kbd className="px-1 bg-gray-100 rounded text-[10px]">?</kbd> anytime to open this panel
        </p>
      </div>
    </div>
  );
};
