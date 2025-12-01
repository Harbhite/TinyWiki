import React, { useEffect, useState } from 'react';

export const LoadingScreen: React.FC = () => {
  const messages = [
    "Reading your messy handwriting...",
    "Consulting the digital library...",
    "Highlighting the important stuff...",
    "Brewing a fresh pot of knowledge...",
    "Organizing the chaos...",
    "Asking Gemini for a summary..."
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 bg-tiny-yellow flex flex-col items-center justify-center z-50">
      <div className="bg-white p-8 border-2 border-black shadow-hard-lg rounded-xl max-w-md w-full text-center">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="font-serif text-3xl mb-4">Hang tight!</h2>
        <p className="text-lg font-medium animate-pulse transition-all duration-500">
          {messages[messageIndex]}
        </p>
      </div>
    </div>
  );
};