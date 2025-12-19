
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WikiData } from '../types';
import { Button } from './Button';

// Component for interactive text with tooltip
const GlossaryTerm: React.FC<{ term: string, definition?: string }> = ({ term, definition }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span 
      className="relative inline-block cursor-help group z-10"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
         e.stopPropagation();
         setShowTooltip(!showTooltip);
      }}
    >
      <strong className="text-terracotta border-b border-dotted border-terracotta/40 font-semibold px-0.5 hover:bg-terracotta/5 rounded transition-colors">{term}</strong>
      
      {/* Tooltip */}
      <div 
         className={`
           absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 md:w-96 p-6
           bg-white rounded-2xl shadow-2xl border border-earth-brown/5
           text-sm text-earth-brown font-normal leading-relaxed
           transition-all duration-300 pointer-events-none transform origin-bottom
           ${showTooltip ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}
         `}
      >
        <div className="flex items-center gap-2 mb-3 border-b border-earth-brown/5 pb-2">
            <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse"></span>
            <span className="font-serif text-lg leading-none text-earth-brown">{term}</span>
        </div>
        <p className="text-earth-brown/80">{definition || "Context-specific technical term."}</p>
        
        {/* Arrow Pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-6 h-3 overflow-hidden">
             <div className="w-3 h-3 bg-white border-r border-b border-earth-brown/5 transform rotate-45 mx-auto -translate-y-2 box-content"></div>
        </div>
      </div>
    </span>
  );
};

// Define the missing WikiRendererProps interface
interface WikiRendererProps {
  data: WikiData;
  onReset: () => void;
  onTopicSelect: (topic: string) => void;
}

export const WikiRenderer: React.FC<WikiRendererProps> = ({ data, onReset, onTopicSelect }) => {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  
  const [history, setHistory] = useState<number[]>([0]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [ttsState, setTtsState] = useState<{ idx: number, status: 'playing' | 'paused' | 'stopped' }>({ idx: -1, status: 'stopped' });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setActiveSection(0);
    setCollapsedSections(new Set());
    setHistory([0]);
    setHistoryIndex(0);
    setTtsState({ idx: -1, status: 'stopped' });
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
  }, [data]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#section-')) {
      const index = parseInt(hash.replace('#section-', ''), 10);
      if (!isNaN(index) && index >= 0 && index < (data.sections?.length || 0)) {
        setActiveSection(index);
        setHistory([index]);
        setHistoryIndex(0);
        setTimeout(() => handleScrollToSection(index), 100);
      }
    }
  }, [data.sections]);

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
            
            const lowerTerm = term.toLowerCase();
            const existingKey = Array.from(map.keys()).find(k => k.toLowerCase() === lowerTerm);
            if (existingKey) continue;

            const restOfText = section.content.slice(match.index! + match[0].length);
            // Look for a descriptive sentence following the bold term
            const defRegex = /^([:,\s—–-]+(?:is|are|refers to|means|represents)?\s*)([^.\n]+)/i;
            const defMatch = restOfText.match(defRegex);
            
            let definition = "";
            if (defMatch && defMatch[2]) {
                definition = defMatch[2].trim();
                if (definition.length > 250) definition = definition.substring(0, 250) + "...";
                definition = definition.charAt(0).toUpperCase() + definition.slice(1);
            }
            map.set(term, definition);
        }
    });
    return map;
  }, [data]);

  const handleScrollToSection = (index: number) => {
    if (collapsedSections.has(index)) {
      setCollapsedSections(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
    
    setActiveSection(index);
    const element = document.getElementById(`section-${index}`);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      window.history.replaceState(null, '', `#section-${index}`);
    }
  };

  const handleCopyLink = () => {
    try {
      const jsonStr = JSON.stringify(data);
      const encoded = btoa(encodeURIComponent(jsonStr));
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}#section-${activeSection}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      });
    } catch (err) {
      console.error("Link too long", err);
      alert("Note: This wiki is very detailed and might exceed link length limits for sharing.");
    }
  };

  const handleTTS = (index: number, text: string) => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    if (ttsState.idx === index) {
      if (ttsState.status === 'playing') synth.pause();
      else if (ttsState.status === 'paused') synth.resume();
      return;
    }

    synth.cancel();
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    const u = new SpeechSynthesisUtterance(cleanText);
    u.rate = 1.0;
    u.onend = () => setTtsState({ idx: -1, status: 'stopped' });
    u.onstart = () => setTtsState({ idx: index, status: 'playing' });
    synth.speak(u);
  };

  const formatContent = (content: string) => {
    if (!content) return [];
    // Split by markdown bold tags
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const term = part.slice(2, -2);
        const matchedKey = Array.from(glossaryMap.keys()).find((k: string) => k.toLowerCase() === term.toLowerCase());
        const definition = matchedKey ? glossaryMap.get(matchedKey) : undefined;
        return <GlossaryTerm key={index} term={term} definition={definition} />;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-beige-bg flex flex-col md:flex-row print:bg-white print:block">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-80 bg-[#F7F5EE] md:h-[calc(100vh-5rem)] md:sticky md:top-20 overflow-y-auto z-20 print:hidden flex flex-col border-r border-[#EBE8DE] scrollbar-hide">
        <div className="p-8">
          <div className="font-serif text-2xl text-earth-brown mb-6 leading-tight tracking-tight border-b border-earth-brown/5 pb-6">{data.title}</div>
          
          <div className="mb-4 flex items-center justify-between text-xs font-bold text-terracotta uppercase tracking-[0.2em]">
             <span>Navigation</span>
             <span className="bg-terracotta/10 px-2 py-1 rounded">{data.readingTimeMinutes}m Read</span>
          </div>

          <nav className="space-y-1 mb-10">
            {data.sections?.map((section, idx) => (
              <button
                key={idx}
                onClick={() => handleScrollToSection(idx)}
                className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 text-sm flex items-start gap-3 group ${
                  activeSection === idx
                    ? 'bg-white text-earth-brown font-semibold shadow-md ring-1 ring-earth-brown/5'
                    : 'text-earth-brown/50 hover:bg-earth-brown/5'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] mt-0.5 shrink-0 transition-colors duration-300 ${activeSection === idx ? 'bg-terracotta text-white' : 'bg-earth-brown/10'}`}>
                  {idx + 1}
                </span>
                <span className="leading-tight">{section.heading}</span>
              </button>
            ))}
          </nav>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-earth-brown/5">
             <div className="text-[10px] font-bold text-earth-brown/30 uppercase tracking-widest mb-3">Quick Actions</div>
             <div className="flex gap-2">
                 <button onClick={() => window.print()} className="flex-1 p-2 rounded-lg bg-beige-bg hover:bg-soft-yellow/20 transition-colors text-[10px] font-bold text-earth-brown/60 flex flex-col items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2-2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print
                 </button>
                 <button onClick={handleCopyLink} className="flex-1 p-2 rounded-lg bg-beige-bg hover:bg-soft-yellow/20 transition-colors text-[10px] font-bold text-earth-brown/60 flex flex-col items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share
                 </button>
             </div>
          </div>
        </div>

        <div className="mt-auto p-8 bg-[#F0EEE5] border-t border-[#EBE8DE]">
             <Button variant="outline" fullWidth onClick={onReset} className="text-xs py-3 font-bold uppercase tracking-widest">New Session</Button>
             <p className="font-hand text-2xl text-terracotta font-bold text-center mt-6 transform -rotate-1">tiny.wiki</p>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-20 max-w-5xl mx-auto print:max-w-none print:w-full print:p-0">
        
        {/* Deep Header */}
        <header className="mb-24">
             <div className="inline-block bg-terracotta/10 text-terracotta px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">Executive Summary</div>
             <h1 className="font-serif text-5xl md:text-7xl text-earth-brown mb-10 leading-[1.1] tracking-tight">{data.title}</h1>
             <div className="max-w-3xl">
                <p className="text-xl md:text-2xl leading-relaxed text-earth-brown/70 font-light italic">
                    {data.summary}
                </p>
             </div>
        </header>

        {/* Detailed Sections */}
        <div className="space-y-32 print:space-y-16">
            {data.sections?.map((section, idx) => {
                const isSpeaking = ttsState.idx === idx;
                const isActive = activeSection === idx;
                
                return (
                  <section 
                      key={idx} 
                      id={`section-${idx}`} 
                      className={`relative scroll-mt-32 transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'}`}
                  >
                      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-earth-brown text-white font-serif text-xl shadow-lg">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h2 className="font-serif text-3xl md:text-5xl text-earth-brown mb-6 leading-tight tracking-tight">
                                {section.heading}
                            </h2>
                            
                            <div className="flex gap-4 print:hidden mb-8">
                                <button
                                    onClick={() => handleTTS(idx, section.content || '')}
                                    className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-earth-brown/10 text-xs font-bold text-earth-brown/60 hover:border-terracotta hover:text-terracotta transition-all shadow-sm"
                                >
                                    {isSpeaking ? 'Pause Audio' : 'Listen to Section'}
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                                </button>
                            </div>

                            <div className="prose prose-xl prose-p:text-earth-brown/80 prose-p:font-light prose-p:leading-relaxed max-w-none mb-12">
                                <p className="whitespace-pre-wrap">{formatContent(section.content || '')}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mt-12">
                                {/* Extended Key Points */}
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-earth-brown/5 ring-1 ring-earth-brown/5">
                                    <h4 className="font-serif text-xl text-earth-brown mb-6 flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-soft-sage/20 flex items-center justify-center text-soft-sage">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </span> 
                                        Insights & Core Values
                                    </h4>
                                    <ul className="space-y-4">
                                        {section.keyPoints?.map((point, kIdx) => (
                                            <li key={kIdx} className="flex items-start gap-4 group">
                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-soft-sage shrink-0 group-hover:scale-150 transition-transform"></span>
                                                <span className="text-sm text-earth-brown/70 leading-relaxed font-light">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Source Attribution */}
                                <div className="bg-[#F7F5EE] p-8 rounded-3xl border border-earth-brown/5">
                                    <h4 className="font-serif text-xl text-earth-brown mb-6 flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-terracotta/20 flex items-center justify-center text-terracotta">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </span> 
                                        Document Sources
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {section.citations?.map((cite, cIdx) => (
                                            <span key={cIdx} className="text-[10px] font-bold text-terracotta/80 bg-white border border-terracotta/10 px-3 py-1.5 rounded-full shadow-sm">
                                                {cite}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                          </div>
                      </div>
                  </section>
                );
            })}
        </div>

        {/* Global Glossary */}
        {glossaryMap.size > 0 && (
            <div id="glossary-section" className="mt-48 pt-24 border-t border-earth-brown/10 print:break-inside-avoid">
                <div className="flex items-center gap-4 mb-12">
                   <h3 className="font-serif text-4xl text-earth-brown">Technical Index</h3>
                   <div className="h-px flex-1 bg-earth-brown/5"></div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {Array.from(glossaryMap.entries()).map(([term, definition], idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-earth-brown/5 hover:border-terracotta/30 transition-colors">
                            <h4 className="font-serif text-xl text-terracotta mb-3">{term}</h4>
                            <p className="text-sm text-earth-brown/60 font-light leading-relaxed">
                                {definition || "Defined within the specific context of the provided materials."}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Deep Learning Suggestions */}
        {data.relatedTopics && data.relatedTopics.length > 0 && (
          <div className="mt-32 pt-24 border-t border-earth-brown/10 print:break-inside-avoid">
             <h3 className="font-serif text-3xl text-earth-brown mb-8 text-center">Expand Your Horizon</h3>
             <div className="flex flex-wrap gap-4 justify-center">
               {data.relatedTopics.map((topic, idx) => (
                 <button 
                   key={idx}
                   onClick={() => onTopicSelect(topic)}
                   className="bg-white hover:bg-terracotta text-earth-brown/70 hover:text-white px-8 py-4 rounded-2xl border border-earth-brown/10 hover:border-terracotta transition-all text-sm font-bold shadow-sm hover:shadow-xl hover:-translate-y-1"
                 >
                   {topic}
                 </button>
               ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};
