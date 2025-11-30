import React, { useState, useEffect } from 'react';
import { WikiData } from '../types';
import { Button } from './Button';

/**
 * Props for the WikiRenderer component.
 */
interface WikiRendererProps {
  /** The structured wiki data to be displayed. */
  data: WikiData;
  /** Callback function to reset the application state (e.g., start over). */
  onReset: () => void;
}

/**
 * Renders the generated wiki content, including the table of contents,
 * executive summary, sections, key points, citations, and related topics.
 * Also handles deep linking and sharing.
 *
 * @param props - The props for the component.
 * @param props.data - The wiki data to render.
 * @param props.onReset - Function to reset the view.
 * @returns The WikiRenderer component.
 */
export const WikiRenderer: React.FC<WikiRendererProps> = ({ data, onReset }) => {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Handle deep linking on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#section-')) {
      const index = parseInt(hash.replace('#section-', ''), 10);
      if (!isNaN(index) && index >= 0 && index < data.sections.length) {
        setActiveSection(index);
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

  /**
   * Scrolls to the specified section index.
   * @param index - The index of the section to scroll to.
   */
  const handleScrollToSection = (index: number) => {
    setActiveSection(index);
    const element = document.getElementById(`section-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Optionally update hash without scrolling again
      window.history.replaceState(null, '', `#section-${index}`);
    }
  };

  /**
   * Generates a shareable link with the current wiki data encoded in the URL
   * and copies it to the clipboard.
   */
  const handleCopyLink = () => {
    try {
      // Encode data: JSON -> URI Component -> Base64
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

  /**
   * Formats raw markdown-like content (specifically bold text) into React elements.
   * @param content - The string content to format.
   * @returns An array of strings and React elements.
   */
  const formatContent = (content: string) => {
    // Basic markdown-ish formatting for bold/italic
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="bg-tiny-yellow px-1 rounded border border-black border-b-2 text-black shadow-sm">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row print:bg-white print:block">
      {/* Sidebar Navigation - Hidden in Print */}
      <aside className="w-full md:w-80 bg-white border-r-2 border-black md:h-screen md:sticky md:top-0 overflow-y-auto p-6 z-20 print:hidden">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold mb-4 leading-tight break-words">{data.title}</h1>
          <div className="flex items-center gap-2 text-sm text-black font-bold border-2 border-black inline-flex px-3 py-1.5 rounded-lg bg-tiny-pink shadow-hard-sm">
            <span>⏱ {data.readingTimeMinutes} min read</span>
          </div>
        </div>

        <nav className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 border-b-2 border-dashed border-gray-300 pb-2">Table of Contents</p>
          {data.sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => handleScrollToSection(idx)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm font-bold flex items-center justify-between group ${
                activeSection === idx
                  ? 'bg-tiny-purple border-black shadow-hard-sm translate-x-1'
                  : 'bg-transparent border-transparent hover:bg-gray-100'
              }`}
            >
              <span className="truncate mr-2">{section.heading}</span>
              {activeSection === idx && <span className="text-lg">👉</span>}
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-300 space-y-3">
             <Button 
                variant={copyFeedback ? "primary" : "secondary"} // Visual feedback
                fullWidth 
                onClick={handleCopyLink} 
                className={`flex items-center justify-center gap-2 transition-all ${copyFeedback ? 'bg-tiny-green' : ''}`}
             >
                {copyFeedback ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Link Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                    Copy Link
                  </>
                )}
             </Button>
             
             <Button variant="outline" fullWidth onClick={() => window.print()} className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Export PDF
             </Button>

             <Button variant="outline" fullWidth onClick={onReset} className="border-dashed text-gray-500 hover:text-black hover:border-solid">
                Start Over
             </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto print:max-w-none print:p-0 print:mx-0">
        
        {/* Print-only Header */}
        <div className="hidden print:block mb-8 border-b-4 border-black pb-6">
           <h1 className="font-serif text-5xl font-bold mb-4">{data.title}</h1>
           <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
             <span className="bg-tiny-pink px-3 py-1 rounded border border-black text-black">Generated by TinyWiki</span>
             <span>⏱ {data.readingTimeMinutes} min read</span>
           </div>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-tiny-green border-2 border-black shadow-hard rounded-xl p-8 mb-16 relative overflow-hidden print:shadow-none print:border-black print:mb-8 print:break-inside-avoid">
             <div className="absolute top-0 right-0 p-4 opacity-10 font-serif text-9xl leading-none select-none">Wiki</div>
            <h3 className="font-serif text-2xl mb-4 font-bold flex items-center gap-2 relative z-10">
                <span className="text-3xl bg-white rounded-full p-1 border-2 border-black shadow-sm">✨</span> 
                <span className="underline decoration-4 decoration-tiny-purple underline-offset-4">Executive Summary</span>
            </h3>
            <p className="text-lg leading-relaxed font-medium relative z-10 text-gray-900">
                {data.summary}
            </p>
        </div>

        {/* Sections */}
        <div className="space-y-20 print:space-y-12">
            {data.sections.map((section, idx) => (
                <section key={idx} id={`section-${idx}`} className="scroll-mt-24 print:break-inside-auto">
                    <div className="flex items-end gap-4 mb-8 border-b-4 border-black pb-4 print:pb-2 print:mb-4">
                        <span className="font-serif text-6xl text-transparent text-stroke-black select-none font-bold -mb-1 print:text-black" style={{ WebkitTextStroke: '2px black' }}>{String(idx + 1).padStart(2, '0')}</span>
                        <h2 className="font-serif text-4xl md:text-5xl font-bold text-black leading-tight">{section.heading}</h2>
                    </div>

                    <div className="bg-white border-2 border-black shadow-hard rounded-xl p-8 md:p-10 mb-8 print:shadow-none print:border-black print:p-0 print:border-0 print:mb-4">
                        <div className="prose prose-lg max-w-none font-sans text-gray-800 leading-8 text-justify">
                             <p className="whitespace-pre-wrap">{formatContent(section.content)}</p>
                        </div>
                    </div>

                    {/* Key Points & Citations Grid */}
                    <div className="grid md:grid-cols-2 gap-6 print:gap-4 print:block print:space-y-4">
                        <div className="bg-tiny-yellow border-2 border-black shadow-hard-sm rounded-lg p-6 print:shadow-none print:border-black print:break-inside-avoid">
                            <h4 className="font-bold border-b-2 border-black pb-2 mb-4 uppercase tracking-wide text-xs flex items-center gap-2">
                                <span>🔑</span> Key Takeaways
                            </h4>
                            <ul className="space-y-3">
                                {section.keyPoints.map((point, kIdx) => (
                                    <li key={kIdx} className="flex items-start gap-3">
                                        <div className="min-w-[20px] h-[20px] rounded-full bg-black text-white flex items-center justify-center text-xs mt-1 shrink-0">✓</div>
                                        <span className="font-medium text-sm leading-snug">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-blue-50 border-2 border-black shadow-hard-sm rounded-lg p-6 print:shadow-none print:border-black print:break-inside-avoid">
                            <h4 className="font-bold border-b-2 border-black pb-2 mb-4 uppercase tracking-wide text-xs flex items-center gap-2">
                                <span>📚</span> Sources
                            </h4>
                            <ul className="space-y-2">
                                {section.citations && section.citations.length > 0 ? (
                                  section.citations.map((cite, cIdx) => (
                                      <li key={cIdx} className="text-sm font-bold text-black bg-tiny-pink px-3 py-2 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 transform hover:-translate-y-0.5 transition-transform print:shadow-none print:border-black">
                                          <span className="w-2 h-2 rounded-full bg-black"></span>
                                          {cite}
                                      </li>
                                  ))
                                ) : (
                                  <li className="text-sm text-gray-500 italic">No specific citations for this section.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </section>
            ))}
        </div>

        {/* Related Topics Section */}
        {data.relatedTopics && data.relatedTopics.length > 0 && (
          <div className="mt-16 pt-12 border-t-4 border-black border-dashed print:break-inside-avoid">
             <h3 className="font-serif text-3xl font-bold mb-8 flex items-center gap-3">
               <span className="bg-tiny-orange border-2 border-black rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-hard-sm">🚀</span>
               Dive Deeper
             </h3>
             <div className="flex flex-wrap gap-4">
               {data.relatedTopics.map((topic, idx) => (
                 <a 
                   key={idx}
                   href={`https://www.google.com/search?q=${encodeURIComponent(topic)}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="bg-white hover:bg-tiny-purple border-2 border-black px-6 py-3 rounded-full font-bold shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 group text-sm md:text-base"
                 >
                   {topic}
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-30 group-hover:opacity-100">
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
