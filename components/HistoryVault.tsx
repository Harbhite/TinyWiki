import React, { useEffect, useState } from 'react';
import { WikiData } from '../types';

interface HistoryItem {
  id: string;
  timestamp: number;
  data: WikiData;
}

interface HistoryVaultProps {
  onSelect: (data: WikiData) => void;
}

export const HistoryVault: React.FC<HistoryVaultProps> = ({ onSelect }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tinywiki_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('tinywiki_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tinywiki_history');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-4xl text-earth-brown">Your Library</h2>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-earth-brown/50 hover:text-terracotta text-sm transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center shadow-soft">
          <p className="text-earth-brown/50 mb-4">Your vault is empty.</p>
          <p className="font-light">Generate a new wiki to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelect(item.data)}
              className="bg-white rounded-[1.5rem] p-6 shadow-soft hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-[#E5E0D8] relative"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-serif text-2xl text-earth-brown group-hover:text-terracotta transition-colors line-clamp-2 pr-8">
                  {item.data.title}
                </h3>
                <button 
                  onClick={(e) => deleteItem(item.id, e)}
                  className="absolute top-6 right-6 text-earth-brown/30 hover:text-terracotta transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-earth-brown/60 font-light line-clamp-3 mb-4">
                {item.data.summary}
              </p>
              <div className="text-xs text-earth-brown/40 uppercase tracking-widest font-semibold flex items-center gap-2">
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                <span>•</span>
                <span>{item.data.readingTimeMinutes} min read</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
