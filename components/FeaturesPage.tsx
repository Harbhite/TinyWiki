import React from 'react';
import { Button } from './Button';

interface FeaturesPageProps {
  onStart: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onStart }) => {
  const features = [
    {
      title: "AI Synthesis",
      desc: "Transforms complex PDFs, Docs, and Slides into a coherent, narrative-driven Wiki entry using Gemini 2.5 Flash.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
      )
    },
    {
      title: "Smart Citations",
      desc: "Every claim is backed by a specific reference to your original files (e.g., 'Slide 4', 'Page 12'), ensuring trust and traceability.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
        </svg>
      )
    },
    {
      title: "Read Aloud (TTS)",
      desc: "Listen to your content on the go with built-in text-to-speech functionality for every section.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      )
    },
    {
      title: "Universal Export",
      desc: "Take your knowledge with you. Export your wiki to Markdown or Microsoft Word (.doc) with formatting preserved.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-beige-bg pt-12 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl text-earth-brown mb-6">
            Features designed for <br/> <span className="text-terracotta italic">deep work.</span>
          </h1>
          <p className="text-xl text-earth-brown/60 max-w-2xl mx-auto font-light">
            Everything you need to transform chaos into clarity, built for the modern learner.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-8 md:p-10 rounded-[2rem] shadow-soft border border-earth-brown/5 hover:border-terracotta/20 transition-all hover:shadow-lg group">
              <div className="w-16 h-16 rounded-2xl bg-soft-yellow/30 text-terracotta flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-serif text-2xl text-earth-brown mb-3">{feature.title}</h3>
              <p className="text-earth-brown/70 leading-relaxed font-light">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
            <Button onClick={onStart}>Start Creating</Button>
        </div>
      </div>
    </div>
  );
};