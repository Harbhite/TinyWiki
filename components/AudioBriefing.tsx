import React, { useState, useEffect } from 'react';
import { WikiData } from '../types';

interface AudioBriefingProps {
  wiki: WikiData;
}

/**
 * Feature 4: Automatic "TL;DR" Audio Briefings
 * Generates a 2-minute audio summary of the wiki using TTS.
 * Users can listen to their library during commutes or multitasking.
 */
export const AudioBriefing: React.FC<AudioBriefingProps> = ({ wiki }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  const generateAudioBriefing = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    setIsPreparing(true);

    // Create a concise 2-minute briefing from the wiki
    const briefing = `
      ${wiki.title}.
      
      ${wiki.summary}
      
      Key sections include:
      ${wiki.sections
        .slice(0, 3)
        .map((s) => `${s.heading}. ${s.keyPoints?.[0] || s.content.substring(0, 100)}`)
        .join('. ')}
      
      For more details, visit the full wiki.
    `;

    const utterance = new SpeechSynthesisUtterance(briefing);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPreparing(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPreparing(false);
      alert('Failed to generate audio. Please try again.');
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const handleResume = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-soft-yellow/20 to-transparent rounded-2xl border border-soft-yellow/40 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-soft-yellow/40 flex items-center justify-center text-2xl">
            🎧
          </div>
          <div>
            <h4 className="font-bold text-earth-brown">Audio Briefing</h4>
            <p className="text-xs text-earth-brown/50 font-light">
              Listen to a 2-minute summary of this wiki
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPlaying && !isPreparing && (
            <button
              onClick={generateAudioBriefing}
              className="px-5 py-2.5 bg-soft-yellow text-earth-brown rounded-full font-bold text-sm hover:bg-soft-yellow/80 transition-all shadow-soft"
            >
              ▶ Play
            </button>
          )}

          {isPreparing && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-soft-yellow/40 text-earth-brown rounded-full text-sm">
              <div className="w-3 h-3 border-2 border-earth-brown/30 border-t-earth-brown rounded-full animate-spin" />
              Preparing...
            </div>
          )}

          {isPlaying && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePause}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition-all"
              >
                ⏸ Pause
              </button>
              <button
                onClick={handleStop}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition-all"
              >
                ⏹ Stop
              </button>
            </div>
          )}
        </div>
      </div>

      {isPlaying && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-soft-yellow animate-pulse" style={{ width: '33%' }} />
          </div>
          <span className="text-xs text-earth-brown/50 font-light">~2 min</span>
        </div>
      )}
    </div>
  );
};
