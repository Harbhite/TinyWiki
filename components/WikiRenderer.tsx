import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WikiData } from '../types';
import { Button } from './Button';

// Component for interactive text with tooltip
const GlossaryTerm: React.FC<{ term: string, definition?: string }> = ({ term, definition }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span 
      className="relative inline-block group z-10"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
         e.stopPropagation();
         setShowTooltip(!showTooltip);
      }}
    >
      <strong className="text-terracotta cursor-help border-b-2 border-terracotta/20 font-bold px-0.5 hover:bg-terracotta/5 transition-all">{term}</strong>
      
      {/* Elegant Tooltip */}
      <div 
         className={`
           absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 md:w-80 p-5
           bg-[#272320] text-white rounded-2xl shadow-2xl
           text-sm leading-relaxed
           transition-all duration-300 pointer-events-none transform origin-bottom
           ${showTooltip ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}
         `}
      >
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
            <span className="font-serif text-lg leading-none">{term}</span>
        </div>
        <p className="text-white/80 font-light">{definition || "A key concept identified from your materials."}</p>
        
        {/* Arrow Pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-4 h-2 overflow-hidden">
             <div className="w-2 h-2 bg-[#272320] transform rotate-45 mx-auto -translate-y-1"></div>
        </div>
      </div>
    </span>
  );
};

interface WikiRendererProps {
  data: WikiData;
  onReset: () => void;
  onTopicSelect: (topic: string) => void;
}

export const WikiRenderer: React.FC<WikiRendererProps> = ({ data, onReset, onTopicSelect }) => {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [ttsState, setTtsState] = useState<{ idx: number, status: 'playing' | 'paused' | 'stopped' }>({ idx: -1, status: 'stopped' });

  useEffect(() => {
    setActiveSection(0);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, [data]);

  const glossaryMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!data || !data.sections) return map;
    
    data.sections.forEach(section => {
        if (!section.content) return;
        const regex = /\*\*([^*]+)\*\*/g;
        let match;
        while ((match = regex.exec(section.content)) !== null) {
            const term = match[1].trim();
            if (term.length < 2 || !isNaN(Number(term))) continue;
            
            const restOfText = section.content.slice(match.index! + match[0].length);
            const defRegex = /^([:,\s—–-]+(?:is|are|refers to|means|represents)?\s*)([^.\n]+)/i;
            const defMatch = restOfText.match(defRegex);
            
            if (defMatch && defMatch[2]) {
                let definition = defMatch[2].trim();
                map.set(term, definition);
            } else if (!map.has(term)) {
                map.set(term, "Explained within this context.");
            }
        }
    });
    return map;
  }, [data]);

  const handleScrollToSection = (index: number) => {
    setActiveSection(index);
    const element = document.getElementById(`section-${index}`);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const handleCopyLink = () => {
    try {
      const jsonStr = JSON.stringify(data);
      const encoded = btoa(encodeURIComponent(jsonStr));
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      });
    } catch (err) {
      alert("Note: This Wiki is very long! Use browser print/save instead for full sharing.");
    }
  };

  const handleTTS = (index: number, text: string) => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (ttsState.idx === index && ttsState.status === 'playing') {
      synth.pause();
      setTtsState({ ...ttsState, status: 'paused' });
      return;
    }
    if (ttsState.idx === index && ttsState.status === 'paused') {
      synth.resume();
      setTtsState({ ...ttsState, status: 'playing' });
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''));
    u.onend = () => setTtsState({ idx: -1, status: 'stopped' });
    u.onstart = () => setTtsState({ idx: index, status: 'playing' });
    synth.speak(u);
  };

  const formatContent = (content: string) => {
    if (!content) return [];
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const term = part.slice(2, -2);
        return <GlossaryTerm key={index} term={term} definition={glossaryMap.get(term)} />;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      
      {/* Clean Left Navigation */}
      <aside className="w-full md:w-72 md:sticky md:top-20 md:h-[calc(100vh-5rem)] border-r border-gray-100 p-8 flex flex-col bg-white print:hidden">
        <div className="mb-10">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">On this page</h2>
          <nav className="space-y-3">
            {data.sections?.map((section, idx) => (
              <button
                key={idx}
                onClick={() => handleScrollToSection(idx)}
                className={`w-full text-left text-sm transition-all duration-300 flex items-center gap-3 ${
                  activeSection === idx ? 'text-terracotta font-bold' : 'text-gray-400 hover:text-earth-brown'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeSection === idx ? 'bg-terracotta' : 'bg-transparent'}`}></span>
                {section.heading}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto space-y-4">
          <Button variant="outline" fullWidth onClick={handleCopyLink} className="text-xs py-2 px-4">
            {copyFeedback ? 'Link Copied!' : 'Share Wiki'}
          </Button>
          <Button variant="text" fullWidth onClick={onReset} className="text-[10px] font-bold uppercase text-gray-400">
            Start New Session
          </Button>
        </div>
      </aside>

      {/* Neat Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto px-8 md:px-20 py-16 md:py-24">
        
        {/* Header Section */}
        <header className="mb-24 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-terracotta text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <span className="w-8 h-[1px] bg-terracotta/30"></span>
            Comprehensive Guide
            <span className="w-8 h-[1px] bg-terracotta/30"></span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-earth-brown mb-10 leading-[1.05] tracking-tight italic">
            {data.title}
          </h1>
          <div className="bg-soft-yellow/20 p-8 rounded-3xl border border-soft-yellow/50">
            <p className="text-xl leading-relaxed text-earth-brown/70 font-light text-left">
              {data.summary}
            </p>
          </div>
          <div className="mt-8 text-[11px] font-bold text-gray-300 uppercase tracking-widest">
            Approx. {data.readingTimeMinutes} minute read
          </div>
        </header>

        {/* Sections */}
        <div className="space-y-40">
          {data.sections?.map((section, idx) => (
            <section key={idx} id={`section-${idx}`} className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-10 opacity-30">
                <span className="font-serif text-4xl text-earth-brown italic">0{idx + 1}</span>
                <div className="h-px flex-1 bg-earth-brown"></div>
              </div>

              <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between group">
                    <h2 className="font-serif text-4xl text-earth-brown leading-tight tracking-tight">
                      {section.heading}
                    </h2>
                    <button 
                      onClick={() => handleTTS(idx, section.content)}
                      className="p-3 rounded-full hover:bg-terracotta/10 text-terracotta transition-colors print:hidden"
                      title="Listen to this section"
                    >
                      {ttsState.idx === idx && ttsState.status === 'playing' ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                      )}
                    </button>
                  </div>

                  <div className="prose prose-lg prose-p:text-earth-brown/70 prose-p:leading-[1.8] prose-p:font-light max-w-none whitespace-pre-wrap">
                    {formatContent(section.content || '')}
                  </div>

                  {/* Neatly Organized Section Footer */}
                  <div className="grid md:grid-cols-2 gap-8 pt-10 border-t border-gray-50">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Key Insights</h4>
                      <ul className="space-y-3">
                        {section.keyPoints?.map((point, kIdx) => (
                          <li key={kIdx} className="flex gap-3 text-sm text-earth-brown/60 leading-relaxed font-light">
                            <span className="text-terracotta mt-1.5 shrink-0">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Sources</h4>
                      <div className="flex flex-wrap gap-2">
                        {section.citations?.map((cite, cIdx) => (
                          <span key={cIdx} className="px-3 py-1 bg-beige-bg border border-earth-brown/5 text-[10px] font-medium text-gray-400 rounded-full">
                            {cite}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Suggestions Area */}
        {data.relatedTopics && data.relatedTopics.length > 0 && (
          <footer className="mt-48 pt-24 border-t border-gray-100 text-center">
            <h3 className="font-serif text-3xl text-earth-brown mb-12 italic">Keep exploring</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {data.relatedTopics.map((topic, idx) => (
                <button 
                  key={idx}
                  onClick={() => onTopicSelect(topic)}
                  className="px-6 py-3 bg-white hover:bg-terracotta border border-gray-100 hover:border-terracotta text-sm text-gray-400 hover:text-white rounded-full transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  {topic}
                </button>
              ))}
            </div>
          </footer>
        )}
      </main>
    </div>
  );
};