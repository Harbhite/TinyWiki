import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WikiData } from '../types';
import { Button } from './Button';
import { chatWithWiki } from '../services/geminiService';

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
      <strong className="text-terracotta cursor-help border-b-2 border-terracotta/10 font-bold px-0.5 hover:bg-terracotta/5 transition-all">{term}</strong>
      
      {/* Elegant Minimal Tooltip */}
      <div 
         className={`
           absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 md:w-80 p-4
           bg-earth-brown text-white rounded-xl shadow-2xl
           text-xs leading-relaxed font-sans
           transition-all duration-300 pointer-events-none transform origin-bottom
           ${showTooltip ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}
         `}
      >
        <p className="font-bold mb-1 border-b border-white/10 pb-1">{term}</p>
        <p className="text-white/80 font-light">{definition || "Core concept identified from materials."}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-4 h-2 overflow-hidden">
             <div className="w-2 h-2 bg-earth-brown transform rotate-45 mx-auto -translate-y-1"></div>
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
  const [activeSection, setActiveSection] = useState<number | string>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [ttsState, setTtsState] = useState<{ idx: number | string, status: 'playing' | 'paused' | 'stopped' }>({ idx: -1, status: 'stopped' });
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveSection(0);
    setChatMessages([]);
    setIsChatOpen(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, [data]);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const glossaryMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data.glossary) {
      data.glossary.forEach(item => {
        map.set(item.term, item.definition);
        // also map the lowercase version for case-insensitive matching
        map.set(item.term.toLowerCase(), item.definition);
      });
    }
    return map;
  }, [data]);

  const handleScrollToSection = (index: number | string) => {
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
      alert("Note: Wiki content exceeds link limits. Use browser print to save.");
    }
  };

  const handleTTS = (index: number | string, text: string) => {
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
        const term = part.slice(2, -2).trim();
        // Fallback to lowercase mapping if exact match is not found
        const definition = glossaryMap.get(term) || glossaryMap.get(term.toLowerCase());
        return <GlossaryTerm key={index} term={term} definition={definition} />;
      }
      return part;
    });
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      const response = await chatWithWiki(newMessages, data);
      setChatMessages([...newMessages, { role: 'assistant', content: response.text }]);
    } catch (err) {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error while thinking.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const glossaryItems = data.glossary ? [...data.glossary].sort((a, b) => a.term.localeCompare(b.term)) : [];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row">
      
      {/* Sidebar - Neat & Minimal */}
      <aside className="w-full md:w-72 md:sticky md:top-0 md:h-screen border-r border-gray-100 p-8 flex flex-col bg-white print:hidden">
        <div className="mb-10 overflow-y-auto scrollbar-hide flex-1">
          <h2 className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-6">Contents</h2>
          <nav className="space-y-4">
            {data.sections?.map((section, idx) => (
              <button
                key={idx}
                onClick={() => handleScrollToSection(idx)}
                className={`w-full text-left text-sm transition-all duration-300 flex items-start gap-3 group ${
                  activeSection === idx ? 'text-terracotta' : 'text-gray-400 hover:text-earth-brown'
                }`}
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 transition-all ${activeSection === idx ? 'bg-terracotta scale-125' : 'bg-transparent border border-gray-200 group-hover:border-earth-brown'}`}></span>
                <span className={activeSection === idx ? 'font-bold' : 'font-light'}>{section.heading}</span>
              </button>
            ))}
            
            {glossaryItems.length > 0 && (
               <button
                 onClick={() => handleScrollToSection('glossary')}
                 className={`w-full text-left text-sm transition-all duration-300 flex items-start gap-3 group mt-6 pt-6 border-t border-gray-50 ${
                   activeSection === 'glossary' ? 'text-terracotta' : 'text-gray-400 hover:text-earth-brown'
                 }`}
               >
                 <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 transition-all ${activeSection === 'glossary' ? 'bg-terracotta scale-125' : 'bg-transparent border border-gray-200 group-hover:border-earth-brown'}`}></span>
                 <span className={activeSection === 'glossary' ? 'font-bold' : 'font-light uppercase tracking-widest text-[10px]'}>Index Glossary</span>
               </button>
            )}
          </nav>
        </div>

        <div className="mt-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-3">Tools</h2>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => window.print()} 
                className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-earth-brown border border-gray-100"
              >
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <span className="text-[9px] font-bold uppercase">Print</span>
              </button>
              <button 
                onClick={handleCopyLink} 
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${copyFeedback ? 'bg-terracotta text-white border-terracotta' : 'bg-gray-50 text-gray-400 hover:text-earth-brown hover:bg-gray-100 border-gray-100'}`}
              >
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                <span className="text-[9px] font-bold uppercase">{copyFeedback ? 'Done' : 'Share'}</span>
              </button>
              <button 
                onClick={() => setIsChatOpen(!isChatOpen)} 
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${isChatOpen ? 'bg-terracotta text-white border-terracotta' : 'bg-gray-50 text-gray-400 hover:text-earth-brown hover:bg-gray-100 border-gray-100'}`}
              >
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <span className="text-[9px] font-bold uppercase">QA Chat</span>
              </button>
            </div>
          </div>
          
          <Button variant="outline" fullWidth onClick={onReset} className="text-xs py-3 rounded-xl border-gray-200">
            Start New Wiki
          </Button>
          <div className="text-center pt-2">
            <span className="font-hand text-3xl text-terracotta/30 select-none">tiny.wiki</span>
          </div>
        </div>
      </aside>

      {/* Neat Content Column */}
      <main className="flex-1 bg-white shadow-sm ring-1 ring-gray-100 my-0 md:my-0 mx-auto min-h-screen">

        
        {/* Abstract / Intro */}
        <header className="px-8 md:px-20 py-20 border-b border-gray-50 text-center">
          <div className="inline-block bg-terracotta/5 text-terracotta text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-8">
            Fact-Based Synthesis
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-earth-brown mb-10 leading-[1.1] tracking-tight">
            {data.title}
          </h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl leading-relaxed text-earth-brown/60 font-light italic">
              {data.summary}
            </p>
          </div>
          <div className="mt-10 flex items-center justify-center gap-4 text-[11px] font-bold text-gray-300 uppercase tracking-widest">
            <span className="w-12 h-px bg-gray-100"></span>
            {data.readingTimeMinutes} Minute Depth
            <span className="w-12 h-px bg-gray-100"></span>
          </div>
        </header>

        {/* Detailed Factual Sections */}
        <div className="divide-y divide-gray-50">
          {data.sections?.map((section, idx) => (
            <article key={idx} id={`section-${idx}`} className="px-8 md:px-20 py-24 scroll-mt-20">
              <div className="flex flex-col gap-10">
                
                <header className="flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <span className="font-serif text-3xl text-gray-200 italic">0{idx + 1}</span>
                    <h2 className="font-serif text-4xl text-earth-brown tracking-tight leading-tight">
                      {section.heading}
                    </h2>
                  </div>
                  <button 
                    onClick={() => handleTTS(idx, section.content)}
                    className="p-3 rounded-full bg-gray-50 text-terracotta hover:bg-terracotta hover:text-white transition-all print:hidden"
                    title="Read Section Aloud"
                  >
                    {ttsState.idx === idx && ttsState.status === 'playing' ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                </header>

                <div className="prose prose-lg prose-p:text-earth-brown/70 prose-p:leading-[1.8] prose-p:font-light max-w-none whitespace-pre-wrap selection:bg-soft-yellow/50">
                  {formatContent(section.content || '')}
                </div>

                {/* Section Recap - Concise Cards */}
                <div className="grid md:grid-cols-5 gap-6 mt-12">
                  <div className="md:col-span-3 bg-[#FAFAFA] p-8 rounded-2xl border border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">Technical Points</h4>
                    <ul className="grid grid-cols-1 gap-4">
                      {section.keyPoints?.map((point, kIdx) => (
                        <li key={kIdx} className="flex gap-4 text-sm text-earth-brown/60 leading-relaxed font-light">
                          <span className="text-terracotta/40 font-serif italic text-lg leading-none shrink-0">#</span>
                          <div>{formatContent(point)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="md:col-span-2 bg-[#FAFAFA] p-8 rounded-2xl border border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">Verification</h4>
                    <div className="flex flex-wrap gap-2">
                      {section.citations?.map((cite, cIdx) => (
                        <span key={cIdx} className="px-3 py-1.5 bg-white border border-gray-200 text-[9px] font-bold text-gray-400 rounded-lg shadow-sm">
                          {cite}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </article>
          ))}
        </div>

        {/* Visible Glossary Section */}
        {glossaryItems.length > 0 && (
           <article id="section-glossary" className="px-8 md:px-20 py-24 bg-[#FCFCFC] scroll-mt-20">
             <div className="max-w-3xl">
               <div className="inline-block text-terracotta text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
                 Terminology Index
               </div>
               <h2 className="font-serif text-5xl text-earth-brown mb-12 tracking-tight">Glossary</h2>
               
               <div className="space-y-10">
                 {glossaryItems.map((item, idx) => (
                   <div key={idx} className="group border-b border-gray-100 pb-8 last:border-0">
                     <dt className="text-xl font-bold text-earth-brown mb-2 group-hover:text-terracotta transition-colors flex items-center gap-3">
                       <span className="w-2 h-2 bg-terracotta rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                       {item.term}
                     </dt>
                     <dd className="text-earth-brown/60 font-light leading-relaxed text-sm pl-5">
                       {item.definition}
                     </dd>
                   </div>
                 ))}
               </div>
             </div>
           </article>
        )}

        {/* Exploratory Footer */}
        {data.relatedTopics && data.relatedTopics.length > 0 && (
          <footer className="bg-white px-8 md:px-20 py-24 text-center border-t border-gray-50">
            <h3 className="font-serif text-3xl text-earth-brown mb-12">Expand Topic Analysis</h3>
            <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto">
              {data.relatedTopics.map((topic, idx) => (
                <button 
                  key={idx}
                  onClick={() => onTopicSelect(topic)}
                  className="px-6 py-3 bg-white hover:bg-earth-brown border border-gray-200 hover:border-earth-brown text-sm text-gray-500 hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  {topic}
                </button>
              ))}
            </div>
          </footer>
        )}
      </main>

      {/* Chat Sidebar */}
      <aside 
        className={`fixed top-0 right-0 h-screen w-full md:w-80 bg-white border-l border-gray-100 shadow-xl flex flex-col transition-transform duration-300 z-50 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-beige-bg">
          <h3 className="font-serif text-2xl text-earth-brown">Wiki Chat</h3>
          <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-terracotta">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
          {chatMessages.length === 0 ? (
            <div className="text-center text-earth-brown/40 font-light mt-10">
              <p>Ask anything about this wiki.</p>
              <p className="text-sm mt-2">I have full context of the content.</p>
            </div>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-terracotta text-white rounded-br-sm' : 'bg-white border border-gray-100 text-earth-brown shadow-sm rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isChatLoading && (
            <div className="flex justify-start">
               <div className="max-w-[85%] rounded-2xl p-4 bg-white border border-gray-100 shadow-sm rounded-bl-sm flex gap-2 items-center">
                 <div className="w-2 h-2 rounded-full bg-terracotta/40 animate-pulse"></div>
                 <div className="w-2 h-2 rounded-full bg-terracotta/40 animate-pulse delay-75"></div>
                 <div className="w-2 h-2 rounded-full bg-terracotta/40 animate-pulse delay-150"></div>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-gray-50 flex gap-2">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-gray-50 border border-transparent rounded-full px-4 py-2 text-sm focus:outline-none focus:border-terracotta/30 focus:bg-white transition-all text-earth-brown"
          />
          <button 
            type="submit"
            disabled={!chatInput.trim() || isChatLoading}
            className={`p-2 rounded-full ${chatInput.trim() && !isChatLoading ? 'bg-terracotta text-white' : 'bg-gray-100 text-gray-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </aside>
    </div>
  );
};