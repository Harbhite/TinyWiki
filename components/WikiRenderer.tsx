import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WikiData } from '../types';
import { Button } from './Button';

interface WikiRendererProps {
  data: WikiData;
  onReset: () => void;
  onTopicSelect: (topic: string) => void;
}

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
      <strong className="text-terracotta border-b border-dotted border-terracotta/40 font-medium px-0.5 hover:bg-terracotta/5 rounded transition-colors">{term}</strong>
      
      {showTooltip && (
        <div 
           className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-5 bg-[#FAF9F5] rounded-xl shadow-soft-hover border border-earth-brown/5 text-sm text-earth-brown font-normal animate-in fade-in zoom-in duration-200"
        >
          <div className="flex items-center gap-2 mb-3 border-b border-earth-brown/5 pb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta"></span>
              <span className="font-serif text-lg leading-none text-earth-brown">{term}</span>
          </div>
          <p className="leading-relaxed text-earth-brown/80">{definition || "A key concept from your learning material."}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-6 h-3 overflow-hidden">
               <div className="w-3 h-3 bg-[#FAF9F5] border-r border-b border-earth-brown/5 transform rotate-45 mx-auto -translate-y-2"></div>
          </div>
        </div>
      )}
    </span>
  );
};

export const WikiRenderer: React.FC<WikiRendererProps> = ({ data, onReset, onTopicSelect }) => {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [ttsState, setTtsState] = useState<{ idx: number, status: 'playing' | 'paused' | 'stopped' }>({ idx: -1, status: 'stopped' });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setActiveSection(0);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, [data]);

  const glossaryMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!data?.sections) return map;
    
    data.sections.forEach(section => {
        if (!section.content) return;
        const regex = /\*\*([^*]+)\*\*/g;
        let match;
        while ((match = regex.exec(section.content)) !== null) {
            const term = match[1].trim();
            if (term.length < 2) continue;
            
            const rest = section.content.slice(match.index + match[0].length);
            const defMatch = rest.match(/^([:,\s—–-]+(?:is|are|refers to|means)?\s*)([^.\n]{5,200})/i);
            if (defMatch) map.set(term, defMatch[2].trim() + "...");
            else if (!map.has(term)) map.set(term, "");
        }
    });
    return map;
  }, [data]);

  const handleScrollToSection = (index: number) => {
    setActiveSection(index);
    const element = document.getElementById(`section-${index}`);
    if (element) {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.pageYOffset - 100,
        behavior: "smooth"
      });
    }
  };

  const handleCopyLink = () => {
    try {
      const jsonStr = JSON.stringify(data);
      const encoded = btoa(encodeURIComponent(jsonStr));
      const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      });
    } catch (e) { alert("Content too large to share via link."); }
  };

  const handleTTS = (index: number, text: string) => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (ttsState.idx === index && ttsState.status === 'playing') {
      synth.cancel();
      setTtsState({ idx: -1, status: 'stopped' });
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\*\*|\*/g, ''));
    u.onend = () => setTtsState({ idx: -1, status: 'stopped' });
    u.onstart = () => setTtsState({ idx: index, status: 'playing' });
    utteranceRef.current = u;
    synth.speak(u);
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-4" />;

      if (trimmed.startsWith('### ')) return <h4 key={idx} className="text-xl font-serif mt-6 mb-3 text-earth-brown">{formatLine(trimmed.slice(4))}</h4>;
      if (trimmed.startsWith('## ')) return <h3 key={idx} className="text-2xl font-serif mt-8 mb-4 text-earth-brown">{formatLine(trimmed.slice(3))}</h3>;
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <li key={idx} className="ml-6 list-disc mb-2 text-earth-brown/80 font-light">{formatLine(trimmed.slice(2))}</li>;
      if (/^\d+\. /.test(trimmed)) return <li key={idx} className="ml-6 list-decimal mb-2 text-earth-brown/80 font-light">{formatLine(trimmed.replace(/^\d+\. /, ''))}</li>;

      return <p key={idx} className="mb-4 leading-relaxed text-earth-brown/80 font-light">{formatLine(line)}</p>;
    });
  };

  const formatLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const term = part.slice(2, -2);
        return <GlossaryTerm key={i} term={term} definition={glossaryMap.get(term)} />;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-terracotta/80">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-beige-bg flex flex-col md:flex-row print:bg-white print:block">
      <aside className="w-full md:w-72 bg-[#F7F5EE] md:h-[calc(100vh-5rem)] md:sticky md:top-20 overflow-y-auto z-20 print:hidden flex flex-col border-r border-[#EBE8DE]">
        <div className="p-8 flex-1">
          <div className="font-serif text-2xl text-earth-brown mb-2 leading-tight">{data.title}</div>
          <div className="text-xs font-semibold text-terracotta uppercase tracking-widest mb-8">{data.readingTimeMinutes} min read</div>
          <nav className="space-y-1">
            {data.sections?.map((section, idx) => (
              <button
                key={idx}
                onClick={() => handleScrollToSection(idx)}
                className={`w-full text-left py-2 px-3 rounded-lg transition-all text-sm flex items-center gap-3 ${activeSection === idx ? 'bg-earth-brown/5 text-earth-brown font-semibold' : 'text-earth-brown/60 hover:bg-earth-brown/5'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeSection === idx ? 'bg-earth-brown text-white' : 'bg-earth-brown/10'}`}>{idx + 1}</span>
                <span className="truncate">{section.heading}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 bg-white border-t border-[#EBE8DE] space-y-3">
             <div className="relative">
               <Button variant="secondary" fullWidth onClick={() => setExportMenuOpen(!exportMenuOpen)} className="text-sm py-2">
                  Export & Save
                  <svg className={`w-4 h-4 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </Button>
               {exportMenuOpen && (
                 <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-earth-brown/5 overflow-hidden z-50">
                    <button onClick={() => { window.print(); setExportMenuOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-red-50/5 flex items-center gap-3 text-sm text-earth-brown group">
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Save as PDF
                    </button>
                    <button onClick={() => { window.print(); setExportMenuOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-emerald-50/5 flex items-center gap-3 text-sm text-earth-brown border-t border-earth-brown/5">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print Wiki
                    </button>
                 </div>
               )}
             </div>
             <Button variant="outline" fullWidth onClick={handleCopyLink} className="text-sm py-2 bg-white">
                {copyFeedback ? "Link Copied!" : "Share Link"}
             </Button>
             <button onClick={onReset} className="w-full text-xs text-earth-brown/40 py-2 hover:text-earth-brown transition-colors">Start New</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-16 max-w-4xl mx-auto print:max-w-none print:w-full print:p-0">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 mb-16 shadow-soft border border-earth-brown/5">
             <h3 className="font-serif text-3xl text-earth-brown mb-6">Overview</h3>
             <p className="text-xl leading-relaxed text-earth-brown/80 font-light italic">"{data.summary}"</p>
        </div>

        <div className="space-y-24">
            {data.sections?.map((section, idx) => (
              <section key={idx} id={`section-${idx}`} className={`relative scroll-mt-24 transition-opacity duration-500 ${activeSection === idx ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
                  <div className="flex items-center gap-6 mb-8">
                      <span className="font-serif text-6xl text-terracotta/10 font-bold hidden md:block">{String(idx + 1).padStart(2, '0')}</span>
                      <h2 className="font-serif text-3xl md:text-5xl text-earth-brown flex-1 leading-tight">{section.heading}</h2>
                      <button onClick={() => handleTTS(idx, section.content)} className="p-3 rounded-full border border-earth-brown/10 hover:bg-earth-brown hover:text-white transition-all active:scale-95 print:hidden">
                        {ttsState.idx === idx && ttsState.status === 'playing' ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" /></svg>}
                      </button>
                  </div>
                  <div className="prose prose-lg max-w-none mb-12">{renderContent(section.content)}</div>
                  <div className="grid md:grid-cols-2 gap-8 print:block print:space-y-6">
                      <div className="bg-soft-sage/10 rounded-[2rem] p-8 border border-soft-sage/20 print:break-inside-avoid">
                          <h4 className="font-serif text-xl text-earth-brown mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-soft-sage"></span> Key Takeaways</h4>
                          <ul className="space-y-4">
                            {section.keyPoints?.map((p, i) => (<li key={i} className="flex gap-4 text-base text-earth-brown/80 font-light leading-relaxed"><span className="w-1 h-1 rounded-full bg-soft-sage mt-2.5 shrink-0"></span>{p}</li>))}
                          </ul>
                      </div>
                      <div className="bg-white p-8 rounded-[2rem] border border-earth-brown/5 shadow-sm print:break-inside-avoid">
                          <h4 className="font-serif text-xl text-earth-brown mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-terracotta"></span> Sources</h4>
                          <ul className="space-y-3">
                            {section.citations?.map((c, i) => (<li key={i} className="text-xs font-medium text-earth-brown/60 bg-beige-bg px-4 py-3 rounded-xl border border-dotted border-terracotta/20">{c}</li>))}
                          </ul>
                      </div>
                  </div>
              </section>
            ))}
        </div>

        {data.relatedTopics?.length > 0 && (
          <div className="mt-32 pt-16 border-t border-earth-brown/10 print:hidden">
             <h3 className="font-serif text-3xl text-earth-brown mb-8">Dive Deeper</h3>
             <div className="flex flex-wrap gap-4">
                {data.relatedTopics.map((t, i) => (
                  <button key={i} onClick={() => onTopicSelect(t)} className="px-6 py-4 rounded-full bg-white border border-earth-brown/10 text-lg font-medium text-earth-brown/70 hover:border-terracotta transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                    {t} <span className="text-terracotta opacity-50">↗</span>
                  </button>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};