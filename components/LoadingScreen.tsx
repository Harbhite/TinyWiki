
import React, { useEffect, useState } from 'react';

export const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const messages = [
    "Reading your materials...",
    "Scanning for key concepts...",
    "Synthesizing deep knowledge...",
    "Building narrative structures...",
    "Applying scholarly citations...",
    "Finalizing wiki formatting...",
    "Almost ready for you..."
  ];

  useEffect(() => {
    // Progress simulation: fast start, slows down as it gets more complex
    const startTime = Date.now();
    const duration = 12000; // Estimated 12s for long-form generation

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = (elapsed / duration) * 100;
      
      // Logarithmic-style easing to never quite hit 100 until finished
      const easedProgress = Math.min(99, Math.floor(100 * (1 - Math.exp(-elapsed / 4000))));
      setProgress(easedProgress);
    }, 100);

    const messageTimer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 500);
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
    };
  }, [messages.length]);

  // SVG Circle parameters
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-beige-bg flex flex-col items-center justify-center z-50 px-6">
      <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl max-w-lg w-full text-center relative overflow-hidden border border-earth-brown/5">
        
        {/* Skeleton Stencil Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
          <div className="grid grid-cols-12 gap-4 p-8">
            <div className="col-span-8 h-4 bg-earth-brown rounded-full"></div>
            <div className="col-span-4 h-4 bg-earth-brown rounded-full"></div>
            <div className="col-span-12 h-32 bg-earth-brown rounded-3xl mt-4"></div>
            <div className="col-span-6 h-4 bg-earth-brown rounded-full mt-4"></div>
            <div className="col-span-6 h-4 bg-earth-brown rounded-full mt-4"></div>
            <div className="col-span-12 h-4 bg-earth-brown rounded-full mt-2"></div>
          </div>
        </div>

        {/* Hybrid Indicator (Circle + Percentage + Icon) */}
        <div className="relative w-48 h-48 mx-auto mb-10">
          {/* Background Ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-soft-yellow/30"
            />
            {/* Progress Ring */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
              strokeLinecap="round"
              className="text-terracotta"
            />
          </svg>
          
          {/* Centered Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="mb-1 text-terracotta animate-bounce-slow">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="text-4xl font-serif text-earth-brown font-bold leading-none">{progress}%</span>
            <span className="text-[10px] font-bold text-earth-brown/30 uppercase tracking-[0.2em] mt-2">Processing</span>
          </div>
        </div>
        
        {/* Animated Message Area */}
        <div className="space-y-4 relative z-10">
          <h2 className="font-serif text-3xl text-earth-brown tracking-tight">Crafting Your Wiki</h2>
          <div className="h-8 flex items-center justify-center">
            <p 
              className={`text-earth-brown/60 font-medium transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
              {messages[messageIndex]}
            </p>
          </div>
        </div>

        {/* Reassuring Footer */}
        <div className="mt-12 pt-8 border-t border-earth-brown/5">
          <p className="text-[11px] text-earth-brown/30 font-bold uppercase tracking-widest">
            Gemini 3 Flash &bull; High Precision Mode
          </p>
        </div>
      </div>

      <div className="absolute bottom-12 text-center pointer-events-none">
        <p className="font-hand text-4xl text-terracotta font-extrabold tracking-wide animate-pulse">tiny.wiki</p>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
