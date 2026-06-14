import React, { useState } from 'react';
import { WikiData, HistoricalContext } from '../types';

interface TimeTravelContextProps {
  currentWiki: WikiData;
  historicalContexts: HistoricalContext[];
  onContextSelect: (context: HistoricalContext) => void;
}

/**
 * Feature 12: "Time-Travel" Historical Context
 * A slider that allows users to see how a topic was understood at different points in history.
 * For example, a wiki on "The Atom" can be rewritten to reflect knowledge from 1900, 1950, 2000, etc.
 */
export const TimeTravelContext: React.FC<TimeTravelContextProps> = ({
  currentWiki,
  historicalContexts,
  onContextSelect,
}) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  if (!historicalContexts || historicalContexts.length === 0) {
    return null;
  }

  const sortedContexts = [...historicalContexts].sort((a, b) => a.year - b.year);
  const minYear = sortedContexts[0].year;
  const maxYear = sortedContexts[sortedContexts.length - 1].year;

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    const context = sortedContexts.find((c) => c.year === year);
    if (context) {
      onContextSelect(context);
    }
  };

  return (
    <div className="bg-gradient-to-r from-soft-sage/20 to-transparent rounded-2xl border border-soft-sage/40 p-6">
      <div className="mb-6">
        <h3 className="font-serif text-xl text-earth-brown mb-2">Historical Timeline</h3>
        <p className="text-sm text-earth-brown/60 font-light">
          See how understanding of "{currentWiki.title}" evolved over time.
        </p>
      </div>

      {/* Timeline Slider */}
      <div className="space-y-4">
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={selectedYear || minYear}
          onChange={(e) => handleYearSelect(Number(e.target.value))}
          className="w-full h-2 bg-soft-sage/20 rounded-lg appearance-none cursor-pointer accent-soft-sage"
        />

        <div className="flex items-center justify-between text-sm font-bold text-earth-brown/60">
          <span>{minYear}</span>
          <span className="text-terracotta text-lg">{selectedYear || minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>

      {/* Year Markers */}
      <div className="mt-6 grid grid-cols-auto gap-2 flex-wrap">
        {sortedContexts.map(({ year }) => (
          <button
            key={year}
            onClick={() => handleYearSelect(year)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedYear === year
                ? 'bg-soft-sage text-white'
                : 'bg-white border border-soft-sage/40 text-earth-brown hover:border-soft-sage'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Context Summary */}
      {selectedYear && (
        <div className="mt-6 bg-white rounded-xl p-4 border border-soft-sage/20">
          <p className="text-xs font-bold text-soft-sage uppercase mb-2">Understanding in {selectedYear}</p>
          <p className="text-sm text-earth-brown/70 leading-relaxed font-light">
            {sortedContexts.find((c) => c.year === selectedYear)?.summary}
          </p>
          <p className="text-xs text-earth-brown/40 mt-3 font-light">
            Click "View Historical Version" in the wiki header to see the full rewritten article for this era.
          </p>
        </div>
      )}
    </div>
  );
};
