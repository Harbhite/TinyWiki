import React, { useState, useEffect, useRef } from 'react';
import { HeroSection } from './components/HeroSection';
import { LoadingScreen } from './components/LoadingScreen';
import { WikiRenderer } from './components/WikiRenderer';
import { AboutPage } from './components/AboutPage';
import { FeaturesPage } from './components/FeaturesPage';
import { HistoryVault } from './components/HistoryVault';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { DarkModeProvider, useDarkMode } from './contexts/DarkModeContext';
import { AppState, FileData, WikiData } from './types';
import { generateWikiFromFiles, generateWikiFromTopic } from './services/geminiService';

const HISTORY_KEY = 'tinywiki_history';
const MAX_HISTORY_ITEMS = 50;

// ─── Inner app (needs DarkModeContext) ───────────────────────────────────────
const AppInner: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [wikiData, setWikiData] = useState<WikiData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();

  // Ref forwarded to the topic input in HeroSection for keyboard shortcut "/"
  const topicInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = (data: WikiData) => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      let history = saved ? JSON.parse(saved) : [];
      const newItem = { id: crypto.randomUUID(), timestamp: Date.now(), data };
      history = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save to history:', e);
    }
  };

  // Load shared wiki data from URL on first mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        setAppState(AppState.PROCESSING);
        // Decode the Unicode-safe base64 encoding used in handleCopyLink
        const jsonStr = decodeURIComponent(
          atob(shareData)
            .split('')
            .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('')
        );
        const data = JSON.parse(jsonStr) as WikiData;
        if (data && data.title && data.sections) {
          setWikiData(data);
          saveToHistory(data);
          setAppState(AppState.VIEWING);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (e) {
        console.error('Failed to load shared wiki:', e);
        setAppState(AppState.ERROR);
        setErrorMsg('The shared link is invalid or corrupted.');
      }
    }
  }, []);

  const handleFilesSelected = async (files: FileData[]) => {
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);
    try {
      const data = await generateWikiFromFiles(files);
      setWikiData(data);
      saveToHistory(data);
      setAppState(AppState.VIEWING);
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg(
        error.message ||
          'Oops! Something went wrong while analyzing your documents. Please check your API configuration.'
      );
    }
  };

  const handleTopicSelected = async (topic: string) => {
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const data = await generateWikiFromTopic(topic);
      setWikiData(data);
      saveToHistory(data);
      setAppState(AppState.VIEWING);
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg(
        error.message || 'Failed to generate content for this topic. Please try again later.'
      );
    }
  };

  const handleHeroError = (message: string) => {
    setAppState(AppState.ERROR);
    setErrorMsg(message);
  };

  const resetApp = () => {
    setMobileMenuOpen(false);
    window.history.pushState({}, '', window.location.pathname);
    setWikiData(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
    window.scrollTo(0, 0);
  };

  const navigateTo = (state: AppState) => {
    setMobileMenuOpen(false);
    setAppState(state);
    window.scrollTo(0, 0);
  };

  const focusTopicInput = () => {
    if (appState !== AppState.IDLE) {
      resetApp();
      // Give the hero section time to mount before focusing
      setTimeout(() => topicInputRef.current?.focus(), 100);
    } else {
      topicInputRef.current?.focus();
    }
  };

  return (
    <div className={`min-h-screen font-sans text-earth-brown selection:bg-terracotta selection:text-white bg-beige-bg ${isDark ? 'dark' : ''}`}>

      {/* Feature 6: Keyboard Shortcuts (global listener) */}
      <KeyboardShortcuts
        onNewWiki={resetApp}
        onLibrary={() => navigateTo(AppState.HISTORY)}
        onPrint={() => window.print()}
        onFocusInput={focusTopicInput}
      />

      <header className="relative px-4 py-3 sm:px-6 md:px-12 md:py-6 flex items-center justify-between sticky top-0 z-50 bg-beige-bg/90 backdrop-blur-md border-b border-earth-brown/5 transition-all duration-300">
        <div
          className="cursor-pointer group flex items-center gap-2"
          onClick={resetApp}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && resetApp()}
          aria-label="Go to home"
        >
          <span className="font-serif text-2xl font-bold text-earth-brown group-hover:text-terracotta transition-colors">
            tiny.<span className="font-light italic">wiki</span>
          </span>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <nav className="hidden md:flex gap-8 font-medium text-sm text-earth-brown/60" aria-label="Main navigation">
            <button
              onClick={() => navigateTo(AppState.HISTORY)}
              className={`transition-colors hover:text-earth-brown ${appState === AppState.HISTORY ? 'text-terracotta font-semibold' : ''}`}
            >
              library
            </button>
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

          {/* Feature 2: Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="shrink-0 p-2 rounded-full bg-earth-brown/5 hover:bg-earth-brown/10 transition-colors text-earth-brown/60 hover:text-earth-brown"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden shrink-0 p-2 rounded-full bg-earth-brown/5 hover:bg-earth-brown/10 transition-colors text-earth-brown/70"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          {appState !== AppState.IDLE && (
            <button
              onClick={resetApp}
              className="hidden md:block bg-earth-brown text-white px-5 py-2 rounded-full font-medium text-xs hover:bg-terracotta transition-colors shadow-soft active:scale-95"
            >
              New Wiki
            </button>
          )}
        </div>

        <nav
          id="mobile-navigation"
          className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-full inset-x-0 border-t border-earth-brown/10 bg-beige-bg/95 px-4 py-3 shadow-lg backdrop-blur-xl`}
          aria-label="Mobile navigation"
        >
          {[
            { label: 'Library', state: AppState.HISTORY },
            { label: 'About', state: AppState.ABOUT },
            { label: 'Features', state: AppState.FEATURES },
          ].map(({ label, state }) => (
            <button
              key={state}
              onClick={() => navigateTo(state)}
              className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-earth-brown/5 ${appState === state ? 'text-terracotta' : 'text-earth-brown/75'}`}
            >
              {label}
            </button>
          ))}
          {appState !== AppState.IDLE && (
            <button
              onClick={resetApp}
              className="mt-2 block w-full rounded-xl bg-earth-brown px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-terracotta"
            >
              New Wiki
            </button>
          )}
        </nav>
      </header>

      <main className="transition-opacity duration-300 ease-in-out">
        {appState === AppState.IDLE && (
          <HeroSection
            onFilesSelected={handleFilesSelected}
            onTopicSelected={handleTopicSelected}
            onError={handleHeroError}
            topicInputRef={topicInputRef}
          />
        )}
        {appState === AppState.ABOUT && <AboutPage onStart={resetApp} />}
        {appState === AppState.FEATURES && <FeaturesPage onStart={resetApp} />}
        {appState === AppState.HISTORY && (
          <HistoryVault
            onSelect={(data) => {
              setWikiData(data);
              setAppState(AppState.VIEWING);
              window.scrollTo(0, 0);
            }}
          />
        )}
        {appState === AppState.PROCESSING && <LoadingScreen />}
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
              <p className="mb-8 text-gray-500 font-light whitespace-pre-line">{errorMsg}</p>
              <button
                onClick={resetApp}
                className="w-full bg-earth-brown text-white px-6 py-4 rounded-full font-medium hover:bg-terracotta transition-colors shadow-lg"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ─── Root (wraps with DarkModeProvider) ──────────────────────────────────────
const App: React.FC = () => (
  <DarkModeProvider>
    <AppInner />
  </DarkModeProvider>
);

export default App;
