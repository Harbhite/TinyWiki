import React, { useState } from 'react';
import { WikiGlossaryItem } from '../types';

interface FlashcardsProps {
  glossary: WikiGlossaryItem[];
  onClose: () => void;
}

/**
 * Feature 4: Wiki Flashcards
 * An interactive study mode that presents glossary terms as flip-cards.
 * Users can flip each card to reveal the definition, then navigate with
 * Previous / Next buttons or keyboard arrow keys.
 */
export const Flashcards: React.FC<FlashcardsProps> = ({ glossary, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const total = glossary.length;
  const current = glossary[currentIndex];

  const goNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((i) => (i + 1) % total), 150);
  };

  const goPrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((i) => (i - 1 + total) % total), 150);
  };

  const toggleMastered = () => {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex]);

  const masteredCount = mastered.size;

  return (
    <div className="fixed inset-0 bg-earth-brown/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-beige-bg rounded-[2rem] shadow-2xl max-w-xl w-full p-8 flex flex-col items-center gap-8">

        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-earth-brown">Flashcards</h2>
            <p className="text-xs text-earth-brown/40 mt-1">
              {masteredCount} / {total} mastered
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-earth-brown/40 hover:text-terracotta transition-colors"
            aria-label="Close flashcards"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-terracotta h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>

        {/* Flip Card */}
        <div
          className="w-full cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={() => setIsFlipped((f) => !f)}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '200px',
            }}
          >
            {/* Front — Term */}
            <div
              className="absolute inset-0 bg-white rounded-2xl shadow-soft flex flex-col items-center justify-center p-8 text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4">
                Term {currentIndex + 1} of {total}
              </span>
              <p className="font-serif text-3xl text-earth-brown">{current.term}</p>
              <p className="text-xs text-earth-brown/30 mt-6">Click to reveal definition</p>
            </div>

            {/* Back — Definition */}
            <div
              className="absolute inset-0 bg-earth-brown rounded-2xl shadow-soft flex flex-col items-center justify-center p-8 text-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
                Definition
              </span>
              <p className="text-white/90 leading-relaxed font-light">{current.definition}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 w-full justify-between">
          <button
            onClick={goPrev}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-earth-brown hover:border-earth-brown transition-all"
          >
            ← Prev
          </button>

          <button
            onClick={toggleMastered}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              mastered.has(currentIndex)
                ? 'bg-soft-sage text-earth-brown'
                : 'bg-white border border-gray-200 text-earth-brown hover:border-soft-sage'
            }`}
          >
            {mastered.has(currentIndex) ? '✓ Mastered' : 'Mark Mastered'}
          </button>

          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-earth-brown text-white rounded-full text-sm hover:bg-terracotta transition-all"
          >
            Next →
          </button>
        </div>

        <p className="text-[10px] text-earth-brown/30 text-center">
          Space / Enter to flip &bull; ← → to navigate &bull; Esc to close
        </p>
      </div>
    </div>
  );
};
