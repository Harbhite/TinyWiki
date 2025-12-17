import React, { useEffect, useState } from 'react';

export const LoadingScreen: React.FC = () => {
  const messages = [
    "Reading your materials...",
    "Synthesizing knowledge...",
    "Finding the connections...",
    "Formatting the wiki...",
    "Almost there..."
  ];

  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 500); // Half second fade out

    }, 3000); // Change message every 3 seconds

    return () => clearInterval(cycleInterval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 bg-beige-bg flex flex-col items-center justify-center z-50">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-soft max-w-sm w-full text-center relative overflow-hidden transform transition-all hover:scale-105 duration-700">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-soft-sage via-terracotta to-soft-yellow animate-pulse"></div>
        <svg className="absolute -left-12 -bottom-12 w-48 h-48 text-soft-sage/10 animate-spin-slow" viewBox="0 0 100 100" fill="currentColor">
           <path d="M50 0 L100 50 L50 100 L0 50 Z" />
        </svg>

        {/* Animated Icon */}
        <div className="relative w-20 h-20 mx-auto mb-10">
           <div className="absolute inset-0 border-4 border-earth-brown/10 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-terracotta border-t-transparent rounded-full animate-spin"></div>
           <div className="absolute inset-4 bg-soft-yellow/20 rounded-full animate-pulse flex items-center justify-center">
             <span className="text-2xl">✨</span>
           </div>
        </div>
        
        <h2 className="font-serif text-3xl text-earth-brown mb-4 tracking-tight">Crafting Wiki</h2>
        
        <div className="h-8 flex items-center justify-center">
          <p 
            className={`text-earth-brown/60 font-medium transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          >
            {messages[messageIndex]}
          </p>
        </div>
        
        {/* Progress bar visual */}
        <div className="mt-8 h-1 w-24 mx-auto bg-earth-brown/10 rounded-full overflow-hidden">
          <div className="h-full bg-terracotta rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <div className="absolute bottom-12 text-center">
        <p className="font-hand text-3xl md:text-4xl text-terracotta font-extrabold tracking-wide animate-bounce">tiny.wiki</p>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};