import React, { useState, useEffect } from 'react';
import { HeroSection } from './components/HeroSection';
import { LoadingScreen } from './components/LoadingScreen';
import { WikiRenderer } from './components/WikiRenderer';
import { AppState, FileData, WikiData } from './types';
import { generateWikiFromFiles } from './services/geminiService';

/**
 * The main application component.
 * Manages the high-level state of the application (IDLE, PROCESSING, VIEWING, ERROR)
 * and coordinates data flow between the HeroSection, LoadingScreen, and WikiRenderer.
 *
 * @returns The root App component.
 */
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

  /**
   * Handles the files selected by the user in the HeroSection.
   * Initiates the wiki generation process.
   *
   * @param files - The array of files selected by the user.
   */
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

  /**
   * Resets the application to its initial state.
   * Clears the wiki data and any error messages, and returns to the HeroSection.
   */
  const resetApp = () => {
    // Clear URL parameters to prevent reloading the shared view on refresh
    window.history.pushState({}, '', window.location.pathname);
    setWikiData(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen font-sans text-gray-900">
      {/* Header */}
      {appState === AppState.IDLE && (
        <header className="p-6 flex items-center justify-between sticky top-0 z-40 bg-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg transform -rotate-6 border-2 border-white shadow-sm"></div>
            <span className="font-serif text-2xl font-bold tracking-tight">TinyWiki</span>
          </div>
          <nav className="hidden md:flex gap-6 font-bold text-sm bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-200">
            <a href="#" className="hover:text-tiny-purple transition-colors">How it works</a>
            <a href="#" className="hover:text-tiny-purple transition-colors">Examples</a>
            <a href="#" className="hover:text-tiny-purple transition-colors">About</a>
          </nav>
          <button className="bg-white text-black px-5 py-2 rounded-lg font-bold border-2 border-black hover:bg-black hover:text-white transition-colors shadow-hard-sm">
            Login
          </button>
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
        <div className="min-h-screen flex items-center justify-center flex-col bg-red-50 p-4">
           <div className="bg-white p-8 border-2 border-black shadow-hard rounded-xl max-w-md text-center">
             <div className="text-6xl mb-4">😵</div>
             <h2 className="text-2xl font-serif font-bold mb-2">Oh no!</h2>
             <p className="mb-6">{errorMsg}</p>
             <button 
                onClick={resetApp}
                className="bg-tiny-yellow px-6 py-3 rounded-lg font-bold border-2 border-black shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
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
