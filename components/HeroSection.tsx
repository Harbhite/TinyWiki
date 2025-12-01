import React, { useState } from 'react';
import { FileData } from '../types';

interface HeroSectionProps {
  onFilesSelected: (files: FileData[]) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const filesArray: File[] = Array.from(fileList);
    const validFiles = filesArray.filter(f => 
      f.type.includes('pdf') || 
      f.type.includes('image') || 
      f.type.includes('text')
    );

    if (validFiles.length === 0) {
      alert("Please upload PDF or Image files.");
      return;
    }

    Promise.all(validFiles.map(file => {
      return new Promise<FileData>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type,
            data: reader.result as string
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })).then(results => {
      onFilesSelected(results);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20 pt-8 flex flex-col items-center relative">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-32 left-20 w-32 h-32 bg-tiny-yellow rounded-full border-2 border-black opacity-100 blur-none shadow-hard hidden lg:block animate-bounce" style={{ animationDuration: '3s' }}></div>
      <div className="absolute top-60 right-20 w-24 h-24 bg-tiny-purple rounded-full border-2 border-black opacity-100 blur-none shadow-hard hidden lg:block animate-pulse"></div>

      {/* Hero Content */}
      <div className="text-center max-w-4xl mx-auto mb-16 relative z-10">
        <div className="inline-flex items-center gap-3 bg-white border-2 border-black rounded-full px-4 py-2 shadow-hard-sm mb-8 transform -rotate-2 hover:rotate-0 transition-transform cursor-default group">
          <span className="w-3 h-3 rounded-full bg-tiny-green border border-black animate-pulse"></span>
          <span className="text-xs font-black uppercase tracking-widest font-mono group-hover:text-tiny-purple transition-colors">Powered by Gemini 2.5</span>
        </div>
        
        <h1 className="font-serif text-6xl md:text-8xl leading-[0.9] text-black mb-8 tracking-tight">
          Don't just read. <br/>
          <span className="relative inline-block mt-4 md:mt-2">
            <span className="relative z-10 px-2">Understand.</span>
            <span className="absolute inset-0 bg-tiny-yellow transform -rotate-2 border-2 border-black -z-0 shadow-hard-sm"></span>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
          The AI librarian that turns your messy PDFs, slides, and notes into 
          <span className="bg-tiny-green px-2 mx-1 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-bold inline-block transform rotate-1">structured</span> 
          wikis.
        </p>
      </div>

      {/* Main Action Window */}
      <div className="w-full max-w-3xl relative z-20 group perspective-1000">
        {/* Decorative elements behind the card */}
        <div className="absolute -inset-2 bg-black rounded-2xl transform translate-x-4 translate-y-4 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
        <div className="absolute -inset-2 bg-tiny-purple rounded-2xl border-2 border-black transform translate-x-2 translate-y-2 transition-transform"></div>
        
        <div className="bg-white border-2 border-black rounded-2xl overflow-hidden relative shadow-inner">
          {/* Window Title Bar */}
          <div className="bg-white border-b-2 border-black p-3 flex items-center justify-between">
             <div className="flex gap-2">
               <div className="w-4 h-4 rounded-full bg-red-400 border-2 border-black hover:bg-red-500 transition-colors"></div>
               <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-black hover:bg-yellow-500 transition-colors"></div>
               <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-black hover:bg-green-500 transition-colors"></div>
             </div>
             <div className="font-mono text-xs font-bold uppercase tracking-widest opacity-40 select-none">Upload_Knowledge_Base.exe</div>
             <div className="w-14"></div> {/* Spacer for centering */}
          </div>

          {/* Drop Zone */}
          <div 
            className={`
              p-12 md:p-20 flex flex-col items-center justify-center text-center transition-all duration-300
              ${isDragging ? 'bg-tiny-blue/30 pattern-dots' : 'bg-white'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`
              w-28 h-28 bg-tiny-yellow rounded-2xl border-2 border-black flex items-center justify-center mb-8 shadow-hard
              transition-transform duration-300 ${isDragging ? 'scale-110 rotate-12' : 'group-hover:-rotate-3'}
            `}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3.75m-3-3.75-3 3.75M12 9.75V9A2.25 2.25 0 0 0 9.75 6.75h-1.5A2.25 2.25 0 0 0 6 9v2.25M12 9.75V9a2.25 2.25 0 0 1 2.25-2.25h1.5A2.25 2.25 0 0 1 18 9v2.25m-7.5-6.75h-1.5m3 0h1.5" />
               </svg>
            </div>

            <h3 className="font-serif text-3xl font-bold mb-3">Drag & Drop files here</h3>
            <p className="text-gray-500 mb-10 max-w-sm font-medium">
              Supports PDF, PNG, JPG. We'll handle the messy handwriting.
            </p>

            <label className="relative cursor-pointer group/btn">
              <input 
                type="file" 
                multiple 
                accept="application/pdf,image/*" 
                className="hidden" 
                onChange={handleInputChange}
              />
              <span className="
                block bg-black text-white text-lg px-10 py-4 rounded-xl font-bold border-2 border-black 
                shadow-[4px_4px_0px_0px_rgba(167,139,250,1)] 
                group-hover/btn:translate-x-[2px] group-hover/btn:translate-y-[2px] group-hover/btn:shadow-none transition-all
                flex items-center gap-3
              ">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Select Documents
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-5xl">
        <FeatureCard 
          emoji="⚡️" 
          title="Instant Clarity" 
          desc="AI strips away the fluff and gives you the core concepts in plain English."
          color="bg-tiny-yellow"
          rotate="-rotate-2"
        />
        <FeatureCard 
          emoji="🎓" 
          title="Deep Explanations" 
          desc="Confused? We elaborate on complex terms automatically."
          color="bg-tiny-green"
          rotate="rotate-2"
        />
        <FeatureCard 
          emoji="🔍" 
          title="Smart Citations" 
          desc="Every claim is linked back to the exact page or slide it came from."
          color="bg-tiny-pink"
          rotate="-rotate-2"
        />
      </div>

    </div>
  );
};

const FeatureCard = ({ emoji, title, desc, color, rotate }: { emoji: string, title: string, desc: string, color: string, rotate: string }) => (
  <div className={`bg-white border-2 border-black p-8 rounded-xl shadow-hard hover:shadow-hard-lg transition-all hover:-translate-y-2 group ${rotate}`}>
    <div className={`w-14 h-14 ${color} border-2 border-black rounded-lg flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
      {emoji}
    </div>
    <h3 className="font-serif text-2xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600 font-medium leading-relaxed">{desc}</p>
  </div>
);