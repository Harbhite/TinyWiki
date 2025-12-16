import React, { useEffect, useState } from 'react';

export const LoadingScreen: React.FC = () => {
  const messages = [
    "Reading your materials...",
    "Synthesizing knowledge...",
    "Highlighting key concepts...",
    "Organizing the flow...",
    "Almost there..."
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 bg-beige-bg flex flex-col items-center justify-center z-50">
      <div className="bg-white p-10 rounded-[2rem] shadow-soft max-w-sm w-full text-center relative overflow-hidden">
        <svg className="absolute -left-10 -bottom-10 w-32 h-32 text-soft-sage opacity-20" viewBox="0 0 100 100" fill="currentColor">
           <circle cx="50" cy="50" r="50" />
        </svg>

        <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
        
        <h2 className="font-serif text-2xl text-earth-brown mb-4">Crafting Wiki</h2>
        <p className="text-gray-500 font-light animate-pulse transition-all duration-500">
          {messages[messageIndex]}
        </p>
      </div>

      <div className="absolute bottom-12 text-center">
        <p className="font-hand text-3xl md:text-4xl text-terracotta font-extrabold tracking-wide">Made by Habibi with ❤️</p>
      </div>
    </div>
  );
};