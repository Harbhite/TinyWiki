import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WikiData } from '../types';
import { Button } from './Button';

interface WikiRendererProps {
  data: WikiData;
  onReset: () => void;
  onTopicSelect: (topic: string) => void;
}

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
      <strong className="text-terracotta border-b border-dotted border-terracotta/40 font-medium px-0.5 hover:bg-terracotta/5 rounded transition-colors">{term}</strong>
      
      {/* Tooltip */}
      <div 
         className={`
           absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 md:w-80 p-5
           bg-[#FAF9F5] rounded-xl shadow-soft-hover border border-earth-brown/5
           text-sm text-earth-brown font-normal
           transition-all duration-300 pointer-events-none transform origin-bottom
           ${showTooltip ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}
         `}
      >
        <div className="flex items-center gap-2 mb-3 border-b border-earth-brown/5 pb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta"></span>
            <span className="font-serif text-lg leading-none text-earth-brown">{term}</span>
        </div>
        <p className="leading-relaxed text-earth-brown/80">{definition || "No specific definition found in context."}</p>
        
        {/* Arrow Pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-6 h-3 overflow-hidden">
             <div className="w-3 h-3 bg-[#FAF9F5] border-r border-b border-earth-brown/5 transform rotate-45 mx-auto -translate-y-2 box-content"></div>
        </div>
      </div>
    </span>
  );
};

export const WikiRenderer: React.FC<WikiRendererProps> = ({ data, onReset, onTopicSelect }) => {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  
  // History Navigation State
  const [history, setHistory] = useState<number[]>([0]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // TTS State
  const [ttsState, setTtsState] = useState<{ idx: number, status: 'playing' | 'paused' | 'stopped' }>({ idx: -1, status: 'stopped' });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Reset state when data changes (e.g. new topic loaded)
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

  // Handle deep linking on mount or data change
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#section-')) {
      const index = parseInt(hash.replace('#section-', ''), 10);
      if (!isNaN(index) && index >= 0 && index < (data.sections?.length || 0)) {
        setActiveSection(index);
        setCollapsedSections(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        
        // Initialize history with this deep-linked section
        setHistory([index]);
        setHistoryIndex(0);

        setTimeout(() => {
          const element = document.getElementById(`section-${index}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    }
  }, [data.sections]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Extract Glossary Terms from content
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
            const defRegex = /^([:,\s—–-]+(?:is|are|refers to|means)?\s*)([^.\n]+)/i;
            const defMatch = restOfText.match(defRegex);
            
            let definition = "";
            if (defMatch && defMatch[2]) {
                definition = defMatch[2].trim();
                if (definition.length > 200) definition = definition.substring(0, 200) + "...";
                definition = definition.charAt(0).toUpperCase() + definition.slice(1);
            }
            map.set(term, definition);
        }
    });
    return map;
  }, [data]);

  const toggleSection = (index: number) => {
    const isCollapsed = collapsedSections.has(index);

    if (isCollapsed) {
        // Expand
        setCollapsedSections(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
        
        // Also update history/active if expanding via click and not already active
        if (activeSection !== index) {
            handleScrollToSection(index);
        } else {
             setTimeout(() => {
                const el = document.getElementById(`section-${index}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }

    } else {
        // Collapse
        setCollapsedSections(prev => {
            const next = new Set(prev);
            next.add(index);
            return next;
        });
    }
  };

  const updateHistory = (index: number) => {
    // If we are navigating to the same section as current, do nothing
    if (history[historyIndex] === index) return;

    // Slice history up to current point (remove forward history if any)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(index);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleScrollToSection = (index: number) => {
    // Ensure section is expanded when navigating to it
    if (collapsedSections.has(index)) {
      setCollapsedSections(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
    
    updateHistory(index);
    setActiveSection(index);
    
    const element = document.getElementById(`section-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#section-${index}`);
    }
  };

  const handleHistoryBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const sectionIdx = history[newIndex];
      setActiveSection(sectionIdx);
      
      // Ensure we expand the section we are going back to
      setCollapsedSections(prev => {
        const next = new Set(prev);
        next.delete(sectionIdx);
        return next;
      });

      setTimeout(() => {
        const element = document.getElementById(`section-${sectionIdx}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.replaceState(null, '', `#section-${sectionIdx}`);
        }
      }, 0);
    }
  };

  const handleHistoryForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const sectionIdx = history[newIndex];
      setActiveSection(sectionIdx);

      // Ensure we expand the section we are going forward to
      setCollapsedSections(prev => {
        const next = new Set(prev);
        next.delete(sectionIdx);
        return next;
      });

      setTimeout(() => {
        const element = document.getElementById(`section-${sectionIdx}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.replaceState(null, '', `#section-${sectionIdx}`);
        }
      }, 0);
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
  
  const handleAnchorCopy = (index: number) => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#section-${index}`;
    navigator.clipboard.writeText(url).then(() => {
       // Optional: could show a small tooltip feedback here
    });
  };

  const handlePrint = () => window.print();

  // TTS Logic
  const handleTTS = (index: number, text: string) => {
    if (!('speechSynthesis' in window)) {
        alert("Text-to-speech is not supported in this browser.");
        return;
    }
    const synth = window.speechSynthesis;

    if (ttsState.idx === index) {
      if (ttsState.status === 'playing') {
        synth.pause();
        setTtsState({ ...ttsState, status: 'paused' });
      } else if (ttsState.status === 'paused') {
        synth.resume();
        setTtsState({ ...ttsState, status: 'playing' });
      }
      return;
    }

    synth.cancel();
    // Clean text for speech (remove markdown symbols mostly)
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    const u = new SpeechSynthesisUtterance(cleanText);
    
    u.onend = () => setTtsState({ idx: -1, status: 'stopped' });
    u.onpause = () => setTtsState(prev => ({ ...prev, status: 'paused' }));
    u.onresume = () => setTtsState(prev => ({ ...prev, status: 'playing' }));
    u.onstart = () => setTtsState({ idx: index, status: 'playing' });
    u.onerror = (e) => {
        console.error("Speech error", e);
        setTtsState({ idx: -1, status: 'stopped' });
    };

    utteranceRef.current = u;
    synth.speak(u);
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    setTtsState({ idx: -1, status: 'stopped' });
  };

  const handleExportMD = () => {
    let mdContent = `# ${data.title}\n\n${data.summary}\n\n`;
    data.sections?.forEach(section => {
      mdContent += `## ${section.heading}\n\n${section.content}\n\n### Key Points\n${section.keyPoints?.map(p => `- ${p}`).join('\n') || ''}\n\n`;
    });
    
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to convert basic markdown to HTML for Word export
  const markdownToHtml = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*\*/gim, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const handleExportWord = () => {
    // Construct valid HTML for Word with minimal namespaces
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${data.title}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000000; }
h1 { font-size: 24pt; color: #C56E47; margin-bottom: 12pt; }
h2 { font-size: 18pt; color: #272320; margin-top: 18pt; margin-bottom: 6pt; }
h3 { font-size: 14pt; color: #94A795; margin-top: 12pt; }
p { margin-bottom: 12pt; line-height: 1.5; }
li { margin-bottom: 4pt; }
.citation { font-size: 10pt; color: #666; border: 1px dotted #ccc; padding: 2px 4px; }
</style>
</head>
<body>
<h1>${data.title}</h1>
<p><em>${data.summary}</em></p>
<hr/>
${data.sections?.map(section => `
<h2>${section.heading}</h2>
<p>${markdownToHtml(section.content || '')}</p>
<h3>Key Takeaways</h3>
<ul>${section.keyPoints?.map(p => `<li>${p}</li>`).join('') || ''}</ul>
<h3>Sources</h3>
<ul>${section.citations?.map(c => `<li><span class="citation">${c}</span></li>`).join('') || ''}</ul>
`).join('')}
</body>
</html>`;
    
    // Use application/vnd.ms-word to indicate Word content
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/vnd.ms-word'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatContent = (content: string) => {
    if (!content) return [];
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

  if (!data) return null;

  return (
    <div className="min-h-screen bg-beige-bg flex flex-col md:flex-row print:bg-white print:block">
      
      {/* Navigation Sidebar */}
      <aside className="w-full md:w-72 bg-[#F7F5EE] md:h-screen md:sticky md:top-0 overflow-y-auto z-20 print:hidden flex flex-col border-r border-[#EBE8DE]">
        <div className="p-8">
          <div className="font-serif text-2xl text-earth-brown mb-2 leading-tight">{data.title}</div>
          
          {/* History Navigation */}
          <div className="flex items-center gap-3 mb-6">
            <button 
                onClick={handleHistoryBack}
                disabled={historyIndex <= 0}
                className={`p-2 rounded-full border border-earth-brown/10 flex items-center justify-center transition-colors ${
                    historyIndex > 0 
                    ? "hover:bg-terracotta hover:text-white text-earth-brown cursor-pointer" 
                    : "opacity-30 cursor-not-allowed text-earth-brown/50"
                }`}
                title="Back"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button 
                onClick={handleHistoryForward}
                disabled={historyIndex >= history.length - 1}
                className={`p-2 rounded-full border border-earth-brown/10 flex items-center justify-center transition-colors ${
                    historyIndex < history.length - 1
                    ? "hover:bg-terracotta hover:text-white text-earth-brown cursor-pointer" 
                    : "opacity-30 cursor-not-allowed text-earth-brown/50"
                }`}
                title="Forward"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
            <div className="text-xs font-medium text-terracotta uppercase tracking-widest ml-auto">
                {data.readingTimeMinutes} min read
            </div>
          </div>
          
          <nav className="space-y-1 mb-8">
            {data.sections?.map((section, idx) => (
              <button
                key={idx}
                onClick={() => handleScrollToSection(idx)}
                className={`w-full text-left py-2 px-3 rounded-lg transition-all duration-300 text-sm font-medium flex items-center gap-3 ${
                  activeSection === idx
                    ? 'bg-earth-brown/5 text-earth-brown font-semibold shadow-sm translate-x-1'
                    : 'text-earth-brown/60 hover:bg-earth-brown/5 hover:translate-x-1'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-300 ${activeSection === idx ? 'bg-earth-brown text-white' : 'bg-earth-brown/10 text-earth-brown/60'}`}>
                  {idx + 1}
                </span>
                <span className="truncate opacity-90">{section.heading}</span>
              </button>
            ))}
            {glossaryMap.size > 0 && (
                <button
                    onClick={() => {
                        const el = document.getElementById('glossary-section');
                        if(el) el.scrollIntoView({behavior: 'smooth'})
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg transition-all text-sm font-medium flex items-center gap-3 text-earth-brown/60 hover:bg-earth-brown/5 hover:translate-x-1"
                >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-earth-brown/10 text-earth-brown/60">G</span>
                    <span className="truncate">Glossary</span>
                </button>
            )}
          </nav>

          <div className="space-y-2">
             <div className="text-xs font-semibold text-earth-brown/40 uppercase tracking-widest mb-2">Export</div>
             <div className="grid grid-cols-3 gap-2">
                 <button onClick={handlePrint} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-earth-brown/10 hover:border-terracotta transition-colors text-xs text-earth-brown/70">
                    <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print
                 </button>
                 <button onClick={handleExportMD} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-earth-brown/10 hover:border-terracotta transition-colors text-xs text-earth-brown/70">
                    <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    MD
                 </button>
                 <button onClick={handleExportWord} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-earth-brown/10 hover:border-terracotta transition-colors text-xs text-earth-brown/70">
                    <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Word
                 </button>
             </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#EBE8DE] space-y-3">
             <Button variant="secondary" fullWidth onClick={handleCopyLink} className="text-sm py-2">
                {copyFeedback ? "Link Copied!" : "Share Link"}
             </Button>
             <Button variant="outline" fullWidth onClick={onReset} className="text-sm py-2 px-2">Start Over</Button>
             <div className="pt-4 text-center">
                <p className="font-hand text-xl text-terracotta font-bold tracking-wide transform -rotate-2">Made by Habibi with ❤️</p>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-16 max-w-4xl mx-auto print:max-w-none print:w-full print:p-0">
        
        <div className="hidden print:block mb-8">
           <h1 className="font-serif text-4xl text-black mb-2">{data.title}</h1>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-10 mb-16 shadow-soft border border-earth-brown/5 relative overflow-hidden print:shadow-none print:border print:border-gray-200">
             <h3 className="font-serif text-2xl text-earth-brown mb-4 relative z-10">Overview</h3>
             <p className="text-lg leading-relaxed text-earth-brown/80 font-light relative z-10">
                {data.summary}
             </p>
        </div>

        {/* Sections */}
        <div className="space-y-20 print:space-y-12">
            {data.sections?.map((section, idx) => {
                const isCollapsed = collapsedSections.has(idx);
                const isSpeaking = ttsState.idx === idx;
                const isActive = activeSection === idx;
                
                return (
                  <section 
                      key={idx} 
                      id={`section-${idx}`} 
                      className={`relative scroll-mt-24 group/section transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                  >
                      
                      <div className="flex items-baseline gap-4 mb-6 select-none relative">
                          <span className="font-serif text-5xl text-terracotta/20 font-bold -ml-12 w-12 text-right hidden md:block group-hover/section:text-terracotta/40 transition-colors">
                            {idx + 1}.
                          </span>
                          
                          <div className="flex-1">
                            <h2 
                                className="font-serif text-3xl md:text-4xl text-earth-brown group-hover:text-terracotta transition-colors cursor-pointer inline-flex items-center gap-3 group/header"
                                onClick={() => toggleSection(idx)}
                            >
                                {section.heading}
                                
                                {/* Anchor Link */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAnchorCopy(idx); }}
                                    className="opacity-0 group-hover/header:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-earth-brown/5 text-earth-brown/40 hover:text-terracotta print:hidden"
                                    title="Copy link to section"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-4.5 4.5a3.75 3.75 0 0 0 1.035 6.037.75.75 0 0 1-.646 1.353 5.25 5.25 0 0 1-1.449-8.45l4.5-4.5a5.25 5.25 0 1 1 7.424 7.424l-1.757 1.757a.75.75 0 1 1-1.06-1.06l1.757-1.757a3.75 3.75 0 0 0 0-5.304Zm-7.389 4.291a3.75 3.75 0 0 0 5.304 0l4.5 4.5a3.75 3.75 0 0 0-1.035 6.037.75.75 0 0 1 .646 1.353 5.25 5.25 0 0 1 1.449-8.45l-4.5-4.5a5.25 5.25 0 1 1-7.424-7.424l1.757 1.757a.75.75 0 1 1 1.06 1.06l-1.757-1.757a3.75 3.75 0 0 0 0 5.304Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </h2>
                          </div>
                          
                          <div className="flex items-center gap-2 print:hidden">
                            {/* Read Aloud Controls */}
                            <div className="flex items-center bg-white border border-earth-brown/10 rounded-full px-2 py-1 shadow-sm mr-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleTTS(idx, section.content || ''); }}
                                    className="p-1.5 rounded-full hover:bg-earth-brown/5 text-earth-brown/70 hover:text-terracotta transition-colors"
                                    title={isSpeaking && ttsState.status === 'playing' ? "Pause" : "Read Aloud"}
                                >
                                    {isSpeaking && ttsState.status === 'playing' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                                {isSpeaking && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); stopTTS(); }}
                                        className="p-1.5 rounded-full hover:bg-red-50 text-earth-brown/70 hover:text-red-500 transition-colors"
                                        title="Stop"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                             {/* Collapse/Expand */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleSection(idx); }}
                                className="w-8 h-8 rounded-full border border-earth-brown/10 flex items-center justify-center text-earth-brown/40 group-hover:border-terracotta group-hover:text-terracotta transition-all"
                                title={isCollapsed ? "Expand Section" : "Collapse Section"}
                            >
                                <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                                </svg>
                            </button>
                          </div>
                      </div>

                      <div className={`${isCollapsed ? "hidden print:block" : "block"}`}>
                          <div className="prose prose-lg prose-p:text-earth-brown/80 prose-p:font-light prose-headings:font-serif prose-headings:text-earth-brown max-w-none mb-10">
                              <p className="whitespace-pre-wrap">{formatContent(section.content || '')}</p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6 print:block print:space-y-6">
                              {/* Key Takeaways */}
                              <div className="bg-[#94A795]/10 rounded-xl p-6 print:break-inside-avoid border border-[#94A795]/20">
                                  <h4 className="font-serif text-lg text-earth-brown mb-4 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-soft-sage"></span> Key Takeaways
                                  </h4>
                                  <ul className="space-y-3">
                                      {section.keyPoints && section.keyPoints.length > 0 ? (
                                          section.keyPoints.map((point, kIdx) => (
                                              <li key={kIdx} className="flex items-start gap-3 text-sm text-earth-brown/90">
                                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-soft-sage shrink-0"></span>
                                                  <span>{point}</span>
                                              </li>
                                          ))
                                      ) : (
                                          <li className="text-sm italic opacity-50">No key points available.</li>
                                      )}
                                  </ul>
                              </div>

                              {/* Citations */}
                              <div className="bg-white p-6 rounded-xl print:break-inside-avoid border border-earth-brown/5 shadow-sm">
                                  <h4 className="font-serif text-lg text-earth-brown mb-4 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-terracotta"></span> Sources
                                  </h4>
                                  <ul className="space-y-2">
                                      {section.citations && section.citations.length > 0 ? (
                                        section.citations.map((cite, cIdx) => (
                                            <li key={cIdx} className="text-xs font-medium text-earth-brown/70 bg-beige-bg border border-dotted border-terracotta/30 px-3 py-2 rounded-lg">
                                                {cite}
                                            </li>
                                        ))
                                      ) : (
                                        <li className="text-sm text-gray-400 italic">No specific citations.</li>
                                      )}
                                  </ul>
                              </div>
                          </div>
                      </div>
                  </section>
                );
            })}
        </div>

        {/* Glossary Section */}
        {glossaryMap.size > 0 && (
            <div id="glossary-section" className="mt-24 pt-12 border-t border-[#EBE8DE] print:break-inside-avoid">
                <h3 className="font-serif text-3xl text-earth-brown mb-8">Glossary of Terms</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {Array.from(glossaryMap.entries()).map(([term, definition], idx) => (
                        <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-earth-brown/5">
                            <h4 className="font-serif text-lg text-terracotta mb-2">{term}</h4>
                            <p className="text-sm text-earth-brown/70 font-light leading-relaxed">
                                {definition || "Defined in text."}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Related Topics Footer */}
        {data.relatedTopics && data.relatedTopics.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#EBE8DE] print:break-inside-avoid">
             <h3 className="font-serif text-2xl text-earth-brown mb-6">Explore Further</h3>
             <div className="flex flex-wrap gap-3">
               {data.relatedTopics.map((topic, idx) => (
                 <button 
                   key={idx}
                   onClick={() => onTopicSelect(topic)}
                   className="bg-white hover:bg-soft-yellow/30 text-earth-brown/70 hover:text-earth-brown px-5 py-3 rounded-full border border-earth-brown/10 hover:border-terracotta/30 transition-all text-sm font-medium flex items-center gap-2"
                 >
                   {topic} <span className="text-terracotta opacity-60">↗</span>
                 </button>
               ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};