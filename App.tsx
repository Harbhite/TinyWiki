import React, { useState, useEffect } from 'react';
import { HeroSection } from './components/HeroSection';
import { LoadingScreen } from './components/LoadingScreen';
import { WikiRenderer } from './components/WikiRenderer';
import { AboutPage } from './components/AboutPage';
import { FeaturesPage } from './components/FeaturesPage';
import { AppState, FileData, WikiData } from './types';
import { generateWikiFromFiles, generateWikiFromTopic } from './services/geminiService';

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

  const handleTopicSelected = async (topic: string) => {
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const data = await generateWikiFromTopic(topic);
      setWikiData(data);
      setAppState(AppState.VIEWING);
    } catch (error) {
       console.error(error);
       setAppState(AppState.ERROR);
       setErrorMsg("Failed to generate content for this topic. Please try again.");
    }
  };

  const resetApp = () => {
    window.history.pushState({}, '', window.location.pathname);
    setWikiData(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
    window.scrollTo(0, 0);
  };

  const navigateTo = (state: AppState) => {
    setAppState(state);
    window.scrollTo(0, 0);
  };

  const isNavigationVisible = appState === AppState.IDLE || appState === AppState.ABOUT || appState === AppState.FEATURES;

  return (
    <div className="min-h-screen font-sans text-earth-brown selection:bg-terracotta selection:text-white bg-beige-bg">
      {/* Persistent Header */}
      {isNavigationVisible && (
        <header className="p-8 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-beige-bg/95 backdrop-blur-sm transition-all duration-300">
          <div className="cursor-pointer group" onClick={resetApp}>
            <span className="font-serif text-2xl font-bold text-earth-brown group-hover:text-terracotta transition-colors">
              tiny.<span className="font-light italic">wiki</span>
            </span>
            <svg className="w-12 h-2 text-soft-sage mt-1 group-hover:w-full transition-all duration-500" viewBox="0 0 100 10" preserveAspectRatio="none">
               <path d="M0,5 Q50,0 100,5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-8 font-medium text-sm text-earth-brown/60">
              <button 
                onClick={() => navigateTo(AppState.ABOUT)}
                className={`transition-colors hover:text-earth-brown ${appState === AppState.ABOUT ? 'text-terracotta font-semibold' : ''}`}
              >
                about
              </button>
              <button 
                onClick={() => navigateTo(AppState.FEATURES)}
                className={`transition-colors hover:text-earth-brown ${appState === AppState.FEATURES ? 'text-terracotta font-semibold' : ''}`}
              >
                features
              </button>
            </nav>
            <button 
              onClick={resetApp}
              className="bg-earth-brown text-white px-6 py-2 rounded-full font-medium text-sm hover:bg-terracotta transition-colors shadow-soft active:scale-95"
            >
              Start Learning
            </button>
          </div>
        </header>
      )}

      {/* Main View Switcher */}
      <main className="transition-opacity duration-300 ease-in-out">
        {appState === AppState.IDLE && (
          <HeroSection onFilesSelected={handleFilesSelected} />
        )}

        {appState === AppState.ABOUT && (
          <AboutPage onStart={resetApp} />
        )}

        {appState === AppState.FEATURES && (
          <FeaturesPage onStart={resetApp} />
        )}

        {appState === AppState.PROCESSING && (
          <LoadingScreen />
        )}

        {appState === AppState.VIEWING && wikiData && (
          <WikiRenderer data={wikiData} onReset={resetApp} onTopicSelect={handleTopicSelected} />
        )}

        {appState === AppState.ERROR && (
          <div className="min-h-[80vh] flex items-center justify-center flex-col p-4 relative overflow-hidden">
             <div className="bg-white p-12 rounded-[2rem] shadow-soft max-w-md text-center relative z-10">
               <div className="w-20 h-20 bg-soft-yellow/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 text-terracotta">
                  !
               </div>
               <h2 className="text-3xl font-serif text-earth-brown mb-3">Something went wrong</h2>
               <p className="mb-8 text-gray-500 font-light">{errorMsg}</p>
               <button 
                  onClick={resetApp}
                  className="w-full bg-earth-brown text-white px-6 py-4 rounded-full font-medium hover:bg-terracotta transition-colors shadow-lg"
               >
                  Try Again
               </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;