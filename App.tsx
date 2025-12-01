import React, { useState, useEffect } from 'react';
import { HeroSection } from './components/HeroSection';
import { LoadingScreen } from './components/LoadingScreen';
import { WikiRenderer } from './components/WikiRenderer';
import { AppState, FileData, WikiData } from './types';
import { generateWikiFromFiles } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [wikiData, setWikiData] = useState<WikiData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check for shared wiki data in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        setAppState(AppState.PROCESSING); // Show loading briefly
        // Decode base64 -> uri decode -> json parse
        const jsonStr = decodeURIComponent(atob(shareData));
        const data = JSON.parse(jsonStr) as WikiData;
        
        if (data && data.title && data.sections) {
          setWikiData(data);
          setAppState(AppState.VIEWING);
        } else {
          throw new Error("Invalid data format");
        }
      } catch (e) {
        console.error("Failed to load shared wiki:", e);
        setAppState(AppState.ERROR);
        setErrorMsg("The shared link is invalid or corrupted.");
      }
    }
  }, []);

  const handleFilesSelected = async (files: FileData[]) => {
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);
    try {
      const data = await generateWikiFromFiles(files);
      setWikiData(data);
      setAppState(AppState.VIEWING);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg("Oops! Something went wrong while analyzing your documents. Please try again.");
    }
  };

  const resetApp = () => {
    // Clear URL parameters to prevent reloading the shared view on refresh
    window.history.pushState({}, '', window.location.pathname);
    setWikiData(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 selection:bg-tiny-yellow selection:text-black">
      {/* Header */}
      {appState === AppState.IDLE && (
        <header className="p-6 md:px-10 flex items-center justify-between sticky top-0 z-40 bg-transparent transition-all duration-300">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={resetApp}>
            <div className="w-10 h-10 bg-black rounded-xl transform -rotate-3 border-2 border-white shadow-hard group-hover:rotate-3 transition-transform duration-300 flex items-center justify-center">
              <span className="text-white font-serif text-xl font-bold">T</span>
            </div>
            <span className="font-serif text-2xl font-black tracking-tight group-hover:text-gray-700 transition-colors">TinyWiki</span>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-1 font-bold text-sm bg-white/50 backdrop-blur-md px-1 py-1 rounded-full border border-gray-200 shadow-sm">
              <a href="#" className="hover:bg-white hover:shadow-sm px-4 py-2 rounded-full transition-all">How it works</a>
              <a href="#" className="hover:bg-white hover:shadow-sm px-4 py-2 rounded-full transition-all">Examples</a>
            </nav>
            <button className="bg-tiny-yellow text-black px-6 py-2.5 rounded-lg font-bold border-2 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shadow-hard-sm">
              Login
            </button>
          </div>
        </header>
      )}

      {/* Main View Switcher */}
      {appState === AppState.IDLE && (
        <HeroSection onFilesSelected={handleFilesSelected} />
      )}

      {appState === AppState.PROCESSING && (
        <LoadingScreen />
      )}

      {appState === AppState.VIEWING && wikiData && (
        <WikiRenderer data={wikiData} onReset={resetApp} />
      )}

      {appState === AppState.ERROR && (
        <div className="min-h-screen flex items-center justify-center flex-col bg-red-50 p-4 relative overflow-hidden">
           {/* Decorative bg elements */}
           <div className="absolute top-10 left-10 text-9xl opacity-10 rotate-12">⚠️</div>
           <div className="absolute bottom-10 right-10 text-9xl opacity-10 -rotate-12">⚠️</div>

           <div className="bg-white p-10 border-2 border-black shadow-hard-lg rounded-2xl max-w-md text-center relative z-10">
             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-4xl border-2 border-black mx-auto mb-6 shadow-hard-sm">
                😵
             </div>
             <h2 className="text-3xl font-serif font-bold mb-3">Oh no!</h2>
             <p className="mb-8 text-gray-600 font-medium leading-relaxed">{errorMsg}</p>
             <button 
                onClick={resetApp}
                className="w-full bg-black text-white px-6 py-4 rounded-xl font-bold border-2 border-black shadow-hard hover:bg-gray-900 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm transition-all text-lg"
             >
                Try Again
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;