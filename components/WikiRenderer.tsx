import React, { useState, useEffect } from 'react';
import { WikiData } from '../types';
import { Button } from './Button';

interface WikiRendererProps {
  data: WikiData;
  onReset: () => void;
}

export const WikiRenderer: React.FC<WikiRendererProps> = ({ data, onReset }) => {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());

  // Handle deep linking on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#section-')) {
      const index = parseInt(hash.replace('#section-', ''), 10);
      if (!isNaN(index) && index >= 0 && index < data.sections.length) {
        setActiveSection(index);
        // Ensure the linked section is expanded
        setCollapsedSections(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });

        // Delay scroll slightly to ensure layout is ready
        setTimeout(() => {
          const element = document.getElementById(`section-${index}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    }
  }, [data.sections.length]);

  const toggleSection = (index: number) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleScrollToSection = (index: number) => {
    // Expand if collapsed
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
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      console.error("Failed to copy link", err);
      alert("This content is too large to generate a shareable link.");
    }
  };

  const formatContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="bg-tiny-yellow/50 px-0.5 rounded box-decoration-clone text-black font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row print:bg-white print:block print:h-auto print:min-h-0 print:overflow-visible">
      {/* Sidebar Navigation - Hidden in Print */}
      <aside className="w-full md:w-80 bg-white border-r-2 border-black md:h-screen md:sticky md:top-0 overflow-y-auto z-20 print:hidden flex flex-col">
        <div className="p-6 border-b-2 border-dashed border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-tiny-purple border border-black"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-500">Wiki Structure</span>
          </div>
          <h1 className="font-serif text-2xl font-bold leading-tight break-words line-clamp-2" title={data.title}>{data.title}</h1>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-black border border-black inline-flex px-2 py-1 rounded bg-white shadow-sm">
            <span>⏱ {data.readingTimeMinutes} min read</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {data.sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => handleScrollToSection(idx)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm font-bold flex items-start gap-3 group relative ${
                activeSection === idx
                  ? 'bg-tiny-purple border-black shadow-hard-sm'
                  : 'bg-transparent border-transparent hover:bg-gray-100 hover:border-gray-200'
              }`}
            >
              <span className={`font-mono text-xs mt-0.5 ${activeSection === idx ? 'text-black' : 'text-gray-400'}`}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="truncate leading-tight">{section.heading}</span>
              {activeSection === idx && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-lg">👉</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t-2 border-black bg-gray-50 space-y-3">
             <Button 
                variant={copyFeedback ? "primary" : "secondary"}
                fullWidth 
                onClick={handleCopyLink} 
                className={`flex items-center justify-center gap-2 transition-all text-sm py-2 ${copyFeedback ? 'bg-tiny-green' : ''}`}
             >
                {copyFeedback ? "Copied!" : "Copy Link"}
             </Button>
             
             <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => window.print()} className="text-sm py-2 px-2 flex justify-center">
                   PDF
                </Button>
                <Button variant="outline" onClick={onReset} className="text-sm py-2 px-2 border-dashed text-gray-500 hover:text-black hover:border-solid flex justify-center">
                   New
                </Button>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-16 max-w-5xl mx-auto print:max-w-none print:w-full print:p-0 print:mx-0 print:block">
        
        {/* Print-only Header */}
        <div className="hidden print:block mb-8 border-b-4 border-black pb-6">
           <h1 className="font-serif text-5xl font-bold mb-4">{data.title}</h1>
           <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
             <span className="bg-tiny-pink px-3 py-1 rounded border border-black text-black">Generated by TinyWiki</span>
             <span>⏱ {data.readingTimeMinutes} min read</span>
           </div>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-tiny-green border-2 border-black shadow-hard rounded-xl p-8 mb-20 relative overflow-hidden print:shadow-none print:border-black print:mb-8 print:break-inside-avoid">
             <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl print:hidden"></div>
             
             <div className="flex items-center gap-3 mb-6 border-b-2 border-black/10 pb-4">
                <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-xl shadow-sm">
                   ✨
                </div>
                <h3 className="font-serif text-2xl font-bold">Executive Summary</h3>
             </div>
             
            <p className="text-xl leading-relaxed font-medium relative z-10 text-gray-900 font-serif">
                {data.summary}
            </p>
        </div>

        {/* Sections */}
        <div className="space-y-16 print:space-y-12">
            {data.sections.map((section, idx) => {
                const isCollapsed = collapsedSections.has(idx);
                
                return (
                  <section key={idx} id={`section-${idx}`} className="scroll-mt-24 print:break-inside-auto relative">
                      {/* Section Number decoration */}
                      <div className="absolute -left-12 -top-10 font-serif text-9xl text-gray-200/50 select-none -z-10 print:hidden font-black">
                        {idx + 1}
                      </div>

                      {/* Interactive Header */}
                      <div 
                        className="group flex flex-col gap-4 mb-8 cursor-pointer select-none print:mb-4"
                        onClick={() => toggleSection(idx)}
                      >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <span className="bg-black text-white font-mono font-bold px-3 py-1 rounded text-sm shadow-hard-sm transform -rotate-2 group-hover:rotate-0 transition-transform print:rotate-0 print:shadow-none print:border print:border-black">
                                  SECTION {String(idx + 1).padStart(2, '0')}
                                </span>
                             </div>
                             
                             {/* Collapse Toggle Button - Hidden in Print */}
                             <button 
                                className={`
                                  w-10 h-10 rounded-full border-2 border-black flex items-center justify-center shadow-hard-sm transition-all
                                  ${isCollapsed ? 'bg-white hover:bg-gray-100 rotate-180' : 'bg-tiny-yellow hover:bg-yellow-200'}
                                  print:hidden
                                `}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSection(idx);
                                }}
                                aria-label={isCollapsed ? "Expand section" : "Collapse section"}
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                                </svg>
                             </button>
                          </div>
                          
                          <h2 className="font-serif text-4xl md:text-5xl font-bold text-black leading-tight flex items-start gap-2">
                              <span className={`bg-gradient-to-r from-transparent to-transparent group-hover:from-tiny-yellow/50 group-hover:to-tiny-yellow/50 transition-colors px-2 -ml-2 rounded ${isCollapsed ? 'opacity-70' : 'opacity-100'} print:opacity-100`}>
                                  {section.heading}
                              </span>
                          </h2>
                          
                          {isCollapsed && (
                             <p className="text-gray-400 italic font-medium ml-2 print:hidden">
                               Click to expand section...
                             </p>
                          )}
                      </div>

                      {/* Content Wrapper - Hidden when collapsed but ALWAYS BLOCK in print */}
                      <div className={`${isCollapsed ? "hidden print:block" : "block"}`}>
                          {/* Main Text Content */}
                          <div className="bg-white border-l-4 border-black pl-8 py-2 md:pr-10 mb-10 print:border-l-0 print:pl-0 print:border-0 print:mb-4">
                              <div className="prose prose-lg max-w-none font-sans text-gray-800 leading-8 text-justify print:text-black">
                                  <p className="whitespace-pre-wrap">{formatContent(section.content)}</p>
                              </div>
                          </div>

                          {/* Interactive Elements Grid */}
                          <div className="grid md:grid-cols-12 gap-8 print:gap-6 print:block print:space-y-6">
                              
                              {/* Sticky Note: Key Takeaways */}
                              <div className="md:col-span-7 relative group print:break-inside-avoid">
                                  <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 rounded-lg opacity-20 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform print:hidden"></div>
                                  <div className="bg-tiny-yellow border-2 border-black p-6 relative transform rotate-1 transition-transform hover:rotate-0 print:shadow-none print:border-black print:rotate-0">
                                      {/* Tape effect */}
                                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 border border-white/50 shadow-sm transform -rotate-1 backdrop-blur-sm print:hidden"></div>
                                      
                                      <h4 className="font-bold font-mono text-sm mb-4 uppercase tracking-widest flex items-center gap-2 border-b-2 border-black/10 pb-2">
                                          <span>🔑</span> Key Takeaways
                                      </h4>
                                      <ul className="space-y-3">
                                          {section.keyPoints.map((point, kIdx) => (
                                              <li key={kIdx} className="flex items-start gap-3">
                                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-black shrink-0"></div>
                                                  <span className="font-medium text-gray-900 leading-snug font-serif italic text-lg">{point}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              </div>

                              {/* Index Card: Citations */}
                              <div className="md:col-span-5 relative group print:break-inside-avoid">
                                  <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 rounded-lg opacity-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform print:hidden"></div>
                                  <div className="bg-white border-2 border-black p-6 h-full relative print:shadow-none print:border-black flex flex-col">
                                      <h4 className="font-bold font-mono text-sm mb-4 uppercase tracking-widest flex items-center gap-2 text-gray-500">
                                          <span>📚</span> References
                                      </h4>
                                      <ul className="space-y-2 flex-1">
                                          {section.citations && section.citations.length > 0 ? (
                                            section.citations.map((cite, cIdx) => (
                                                <li key={cIdx} className="text-xs font-bold text-gray-700 bg-gray-50 px-3 py-2 border border-gray-200 rounded flex items-center gap-2 print:border-black">
                                                    <span className="font-mono text-tiny-purple print:text-black">●</span>
                                                    {cite}
                                                </li>
                                            ))
                                          ) : (
                                            <li className="text-sm text-gray-400 italic text-center py-4">No citations provided.</li>
                                          )}
                                      </ul>
                                      <div className="mt-4 border-t-2 border-dashed border-gray-200 pt-2 flex gap-2 justify-end opacity-50 print:hidden">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </section>
                );
            })}
        </div>

        {/* Related Topics Section */}
        {data.relatedTopics && data.relatedTopics.length > 0 && (
          <div className="mt-24 pt-12 border-t-8 border-black print:break-inside-avoid print:mt-12 print:pt-6 print:border-t-4">
             <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 print:mb-4">
                 <div className="bg-tiny-orange border-2 border-black w-16 h-16 flex items-center justify-center text-3xl shadow-hard rounded-xl print:shadow-none print:w-10 print:h-10 print:text-xl">
                   🚀
                 </div>
                 <div>
                    <h3 className="font-serif text-4xl font-bold print:text-2xl">Dive Deeper</h3>
                    <p className="text-gray-600 font-medium">Continue your learning journey with these related concepts.</p>
                 </div>
             </div>
             
             <div className="flex flex-wrap gap-4">
               {data.relatedTopics.map((topic, idx) => (
                 <a 
                   key={idx}
                   href={`https://www.google.com/search?q=${encodeURIComponent(topic)}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="bg-white hover:bg-tiny-blue border-2 border-black px-6 py-4 rounded-xl font-bold shadow-hard hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center gap-3 group text-lg print:shadow-none print:px-4 print:py-2 print:text-sm"
                 >
                   {topic}
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform opacity-30 group-hover:opacity-100 print:hidden">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                   </svg>
                 </a>
               ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};