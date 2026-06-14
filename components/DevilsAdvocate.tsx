import React, { useState } from 'react';
import { WikiSection } from '../types';

interface DevilsAdvocateProps {
  section: WikiSection;
  sectionNumber: number;
}

/**
 * Feature 3: The "Devil's Advocate" Debate Mode
 * Displays critical perspectives, counter-arguments, and alternative theories
 * for each section of the wiki, encouraging critical thinking.
 */
export const DevilsAdvocate: React.FC<DevilsAdvocateProps> = ({
  section,
  sectionNumber,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!section.criticalPerspectives || section.criticalPerspectives.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 bg-gradient-to-r from-terracotta/5 to-transparent rounded-2xl border-l-4 border-terracotta p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta font-bold text-sm">
            ⚖️
          </div>
          <div className="text-left">
            <h4 className="font-bold text-earth-brown group-hover:text-terracotta transition-colors">
              Critical Perspectives
            </h4>
            <p className="text-xs text-earth-brown/50 font-light">
              Counter-arguments and alternative theories
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-earth-brown/40 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-terracotta/10 pt-4">
          {section.criticalPerspectives.map((perspective, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta text-xs font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-sm text-earth-brown/70 leading-relaxed font-light">
                {perspective}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
