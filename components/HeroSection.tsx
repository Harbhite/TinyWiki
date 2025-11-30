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
    <div className="w-full max-w-7xl mx-auto px-4 pb-20 pt-10 flex flex-col items-center relative">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-tiny-yellow rounded-full border-2 border-black opacity-50 blur-sm animate-pulse hidden md:block"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-tiny-purple rounded-full border-2 border-black opacity-50 blur-sm hidden md:block"></div>

      {/* Hero Content */}
      <div className="text-center max-w-4xl mx-auto mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 bg-white border-2 border-black rounded-full px-4 py-1.5 shadow-hard-sm mb-6 transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-wider">Powered by Gemini 2.5</span>
        </div>
        
        <h1 className="font-serif text-6xl md:text-8xl leading-[0.9] text-black mb-8">
          Don't just read. <br/>
          <span className="relative inline-block mt-2">
            <span className="relative z-10">Understand.</span>
            <svg className="absolute w-full h-4 -bottom-1 left-0 text-tiny-yellow z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
          The AI librarian that turns your messy PDFs, slides, and notes into 
          <span className="bg-tiny-green px-1 mx-1 border border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black text-lg">structured</span> 
          wikis.
        </p>
      </div>

      {/* Main Action Window */}
      <div className="w-full max-w-3xl relative z-20 group">
        {/* Decorative elements behind the card */}
        <div className="absolute -inset-1 bg-black rounded-2xl transform translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3"></div>
        
        <div className="bg-white border-2 border-black rounded-2xl overflow-hidden relative">
          {/* Window Title Bar */}
          <div className="bg-tiny-purple border-b-2 border-black p-3 flex items-center justify-between">
             <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-white border border-black"></div>
               <div className="w-3 h-3 rounded-full bg-tiny-pink border border-black"></div>
               <div className="w-3 h-3 rounded-full bg-tiny-green border border-black"></div>
             </div>
             <div className="font-mono text-xs font-bold uppercase tracking-widest opacity-60">Upload_Knowledge_Base.exe</div>
             <div className="w-10"></div> {/* Spacer for centering */}
          </div>

          {/* Drop Zone */}
          <div 
            className={`
              p-12 md:p-16 flex flex-col items-center justify-center text-center transition-all duration-300
              ${isDragging ? 'bg-blue-50' : 'bg-white'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`
              w-24 h-24 bg-tiny-yellow rounded-xl border-2 border-black flex items-center justify-center mb-6 shadow-hard
              transition-transform duration-300 ${isDragging ? 'scale-110 rotate-12' : 'group-hover:-rotate-6'}
            `}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3.75m-3-3.75-3 3.75M12 9.75V9A2.25 2.25 0 0 0 9.75 6.75h-1.5A2.25 2.25 0 0 0 6 9v2.25M12 9.75V9a2.25 2.25 0 0 1 2.25-2.25h1.5A2.25 2.25 0 0 1 18 9v2.25m-7.5-6.75h-1.5m3 0h1.5" />
               </svg>
            </div>

            <h3 className="font-bold text-2xl mb-2">Drag & Drop files here</h3>
            <p className="text-gray-500 mb-8 max-w-sm">
              We support PDF, PNG, JPG, and messy handwriting.
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
                block bg-black text-white text-lg px-8 py-4 rounded-xl font-bold border-2 border-black 
                shadow-[4px_4px_0px_0px_rgba(100,100,100,0.3)]
                group-hover/btn:translate-y-1 group-hover/btn:shadow-none transition-all
                flex items-center gap-2
              ">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Select Documents
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
        <FeatureCard 
          emoji="⚡️" 
          title="Instant Clarity" 
          desc="AI strips away the fluff and gives you the core concepts in plain English."
          color="bg-tiny-yellow"
          rotate="-rotate-1"
        />
        <FeatureCard 
          emoji="🎓" 
          title="Deep Explanations" 
          desc="Confused? We elaborate on complex terms automatically."
          color="bg-tiny-green"
          rotate="rotate-1"
        />
        <FeatureCard 
          emoji="🔍" 
          title="Smart Citations" 
          desc="Every claim is linked back to the exact page or slide it came from."
          color="bg-tiny-pink"
          rotate="-rotate-1"
        />
      </div>

    </div>
  );
};

const FeatureCard = ({ emoji, title, desc, color, rotate }: { emoji: string, title: string, desc: string, color: string, rotate: string }) => (
  <div className={`bg-white border-2 border-black p-8 rounded-xl shadow-hard hover:shadow-hard-lg transition-all hover:-translate-y-1 ${rotate}`}>
    <div className={`w-14 h-14 ${color} border-2 border-black rounded-lg flex items-center justify-center text-3xl mb-4 shadow-sm`}>
      {emoji}
    </div>
    <h3 className="font-serif text-2xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600 font-medium leading-relaxed">{desc}</p>
  </div>
);
