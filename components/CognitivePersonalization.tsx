import React, { useState } from 'react';
import { WikiData } from '../types';
import { generateWikiFromTopic } from '../services/geminiService';

interface CognitivePersonalizationProps {
  currentWiki: WikiData;
  onWikiUpdate: (wiki: WikiData) => void;
  onLoading: (isLoading: boolean) => void;
}

/**
 * Feature 1: Cognitive Load Personalization (Level-Up Mode)
 * Allows users to re-render the same wiki at different cognitive levels:
 * - Basic: Simplified vocabulary, visual descriptions, foundational concepts
 * - Standard: Balanced depth and clarity (default)
 * - Advanced: Technical jargon, proofs, deep structural analysis
 */
export const CognitivePersonalization: React.FC<CognitivePersonalizationProps> = ({
  currentWiki,
  onWikiUpdate,
  onLoading,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<WikiData['cognitiveLevel']>(
    currentWiki.cognitiveLevel || 'Standard'
  );
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleLevelChange = async (level: WikiData['cognitiveLevel']) => {
    if (level === selectedLevel || isRegenerating) return;

    setSelectedLevel(level);
    setIsRegenerating(true);
    onLoading(true);

    try {
      // Regenerate the wiki at the new cognitive level
      const updatedWiki = await generateWikiFromTopic(currentWiki.title, level);
      updatedWiki.cognitiveLevel = level;
      onWikiUpdate(updatedWiki);
    } catch (error) {
      console.error('Failed to regenerate wiki at new cognitive level:', error);
      // Revert to previous level on error
      setSelectedLevel(currentWiki.cognitiveLevel || 'Standard');
    } finally {
      setIsRegenerating(false);
      onLoading(false);
    }
  };

  const levels: Array<{ value: WikiData['cognitiveLevel']; label: string; description: string }> = [
    {
      value: 'Basic',
      label: 'Beginner',
      description: 'Simple words, visual explanations, foundational concepts only',
    },
    {
      value: 'Standard',
      label: 'Standard',
      description: 'Balanced depth and clarity (default)',
    },
    {
      value: 'Advanced',
      label: 'Advanced',
      description: 'Technical jargon, proofs, deep structural analysis',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
      <div className="mb-6">
        <h3 className="font-serif text-xl text-earth-brown mb-2">Cognitive Level</h3>
        <p className="text-sm text-earth-brown/60 font-light">
          Re-render this wiki at a different complexity level to match your learning pace.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {levels.map(({ value, label, description }) => (
          <button
            key={value}
            onClick={() => handleLevelChange(value)}
            disabled={isRegenerating}
            className={`p-4 rounded-xl transition-all border-2 text-left ${
              selectedLevel === value
                ? 'bg-terracotta/10 border-terracotta text-earth-brown'
                : 'bg-white border-gray-200 text-earth-brown/60 hover:border-terracotta/50'
            } ${isRegenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="font-bold text-sm mb-1">{label}</div>
            <div className="text-xs font-light leading-tight">{description}</div>
          </button>
        ))}
      </div>

      {isRegenerating && (
        <div className="mt-4 flex items-center gap-2 text-terracotta text-sm">
          <div className="w-4 h-4 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
          Regenerating wiki at {selectedLevel} level...
        </div>
      )}
    </div>
  );
};
