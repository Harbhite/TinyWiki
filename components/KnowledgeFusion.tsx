import React, { useState } from 'react';
import { WikiData } from '../types';
import { chatWithWiki } from '../services/geminiService';

interface KnowledgeFusionProps {
  library: Array<{ id: string; data: WikiData }>;
  onFusionComplete: (fusedWiki: WikiData) => void;
  onClose: () => void;
}

/**
 * Feature 9: Multi-Wiki "Knowledge Fusion"
 * Allows users to select two or more wikis and "Fuse" them.
 * The AI generates a new "Synthesis Wiki" exploring intersections and contradictions.
 */
export const KnowledgeFusion: React.FC<KnowledgeFusionProps> = ({
  library,
  onFusionComplete,
  onClose,
}) => {
  const [selectedWikis, setSelectedWikis] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [synthesisTitle, setSynthesisTitle] = useState('');

  const toggleWikiSelection = (id: string) => {
    setSelectedWikis((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const handleFuse = async () => {
    if (selectedWikis.length < 2) {
      alert('Please select at least 2 wikis to fuse.');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedData = selectedWikis
        .map((id) => library.find((item) => item.id === id)?.data)
        .filter(Boolean) as WikiData[];

      const prompt = `
        I have ${selectedData.length} wikis:
        ${selectedData.map((w, i) => `${i + 1}. "${w.title}": ${w.summary.substring(0, 100)}`).join('\n')}
        
        Create a synthesis wiki that explores:
        1. How these topics intersect and relate
        2. Contradictions or different perspectives
        3. Combined insights that emerge from understanding both
        
        Title the synthesis: "${synthesisTitle || 'Synthesis: ' + selectedData.map((w) => w.title).join(' & ')}"
      `;

      // Use the first wiki as context for the fusion
      const response = await chatWithWiki(
        [{ role: 'user', content: prompt }],
        selectedData[0]
      );

      // Parse the response as a new wiki structure
      // For now, create a simple synthesis wiki
      const fusedWiki: WikiData = {
        title: synthesisTitle || `Synthesis: ${selectedData.map((w) => w.title).join(' & ')}`,
        summary: response.text.substring(0, 200),
        readingTimeMinutes: selectedData.reduce((sum, w) => sum + w.readingTimeMinutes, 0),
        difficulty: 'Intermediate',
        sections: [
          {
            heading: 'Synthesis Overview',
            content: response.text,
            keyPoints: [
              'Explores intersections between the selected topics',
              'Identifies contradictions and alternative perspectives',
              'Synthesizes combined insights',
            ],
            citations: selectedData.map((w) => `From: ${w.title}`),
          },
        ],
        relatedTopics: [
          ...new Set(selectedData.flatMap((w) => w.relatedTopics)),
        ],
        glossary: [
          ...new Map(
            selectedData.flatMap((w) => w.glossary || []).map((g) => [g.term, g])
          ).values(),
        ],
      };

      onFusionComplete(fusedWiki);
    } catch (error) {
      console.error('Failed to fuse wikis:', error);
      alert('Failed to create synthesis wiki. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-earth-brown/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-earth-brown">Knowledge Fusion</h2>
          <button
            onClick={onClose}
            className="text-earth-brown/40 hover:text-terracotta transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-earth-brown/60 font-light">
          Select 2 or more wikis from your library to create a synthesis that explores their intersections and contradictions.
        </p>

        {/* Wiki Selection */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {library.map(({ id, data }) => (
            <label
              key={id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all"
            >
              <input
                type="checkbox"
                checked={selectedWikis.includes(id)}
                onChange={() => toggleWikiSelection(id)}
                className="w-5 h-5 rounded border-gray-300 text-terracotta"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-earth-brown truncate">{data.title}</p>
                <p className="text-xs text-earth-brown/50 truncate">{data.summary.substring(0, 60)}...</p>
              </div>
            </label>
          ))}
        </div>

        {/* Synthesis Title Input */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
            Synthesis Title (Optional)
          </label>
          <input
            type="text"
            value={synthesisTitle}
            onChange={(e) => setSynthesisTitle(e.target.value)}
            placeholder="e.g., Ancient Rome & Modern Economics"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-terracotta"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full font-bold text-earth-brown hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleFuse}
            disabled={selectedWikis.length < 2 || isProcessing}
            className="flex-1 px-4 py-3 bg-terracotta text-white rounded-full font-bold hover:bg-earth-brown transition-all disabled:opacity-50"
          >
            {isProcessing ? '⏳ Fusing...' : `Fuse ${selectedWikis.length} Wikis`}
          </button>
        </div>
      </div>
    </div>
  );
};
