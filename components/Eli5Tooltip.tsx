import React, { useState } from 'react';
import { getEli5Explanation } from '../services/geminiService';

interface Eli5TooltipProps {
  term: string;
  context: string;
  children: React.ReactNode;
}

/**
 * Feature 8: "Explain Like I'm 5" (ELI5) Hover Tooltips
 * Users can highlight any complex term or sentence to get an instant,
 * simplified "ELI5" pop-up explanation.
 */
export const Eli5Tooltip: React.FC<Eli5TooltipProps> = ({ term, context, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMouseEnter = async () => {
    setShowTooltip(true);
    if (!explanation && !isLoading) {
      setIsLoading(true);
      try {
        const eli5 = await getEli5Explanation(term, context);
        setExplanation(eli5);
      } catch (error) {
        console.error('Failed to get ELI5 explanation:', error);
        setExplanation('Could not generate an explanation. Try again later.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <span
      className="relative inline-block group cursor-help border-b-2 border-dashed border-terracotta/40 hover:border-terracotta/60 transition-colors"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip(!showTooltip);
      }}
    >
      {children}

      {/* Tooltip */}
      <div
        className={`
          absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4
          bg-white text-earth-brown rounded-xl shadow-2xl border border-terracotta/20
          text-xs leading-relaxed font-sans
          transition-all duration-300 pointer-events-none transform origin-bottom
          z-50
          ${showTooltip ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}
        `}
      >
        <div className="font-bold mb-2 border-b border-earth-brown/10 pb-2 flex items-center justify-between text-terracotta">
          <span>Simple Explanation</span>
          {isLoading && <div className="w-3 h-3 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />}
        </div>
        <p className="text-earth-brown/90 font-medium">
          {isLoading ? 'Loading...' : explanation || 'Click to load explanation'}
        </p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-4 h-2 overflow-hidden">
          <div className="w-2 h-2 bg-white border-r border-b border-terracotta/20 transform rotate-45 mx-auto -translate-y-1"></div>
        </div>
      </div>
    </span>
  );
};
