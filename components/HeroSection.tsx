import React, { useState } from 'react';
import { FileData } from '../types';

interface HeroSectionProps {
  onFilesSelected: (files: FileData[]) => void;
  onTopicSelected: (topic: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onFilesSelected, onTopicSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [topic, setTopic] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const isFileAccepted = (file: File) => {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.md', '.jpg', '.jpeg', '.png', '.webp'];
    const allowedMimes = [
      'application/pdf',
      'image/',
      'text/',
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'application/vnd.ms-powerpoint'
    ];

    const hasValidExtension = allowedExtensions.some(ext => name.endsWith(ext));
    const hasValidMime = allowedMimes.some(mime => type.includes(mime));

    return hasValidExtension || hasValidMime;
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const filesArray: File[] = Array.from(fileList);
    const validFiles = filesArray.filter(isFileAccepted);

    if (validFiles.length === 0) {
      alert("Please upload supported files: PDF, Word (DOCX), PowerPoint (PPTX), Images, or Text.");
      return;
    }

    Promise.all(validFiles.map(file => {
      return new Promise<FileData>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type || 'application/octet-stream',
            data: reader.result as string
          });
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
      });
    })).then(results => {
      onFilesSelected(results);
    }).catch(error => {
      console.error("File processing error:", error);
      alert("An error occurred while reading your files. Please try again.");
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

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onTopicSelected(topic.trim());
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20 pt-4 flex flex-col items-center justify-center min-h-[85vh] relative">
      
      {/* Hero Content */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="font-hand text-3xl text-terracotta mb-6 inline-block">
          learning made simple
        </div>
        
        <h1 className="font-serif text-6xl md:text-7xl text-earth-brown mb-8 leading-tight">
          The wiki partner for <br/>
          <span className="relative inline-block">
            conscious learners.
          </span>
        </h1>
        
        <p className="text-xl text-earth-brown/70 max-w-xl mx-auto leading-relaxed font-light">
          We join forces with your documents to do good and use AI to build 
          purpose-driven knowledge bases and amplify their impact.
        </p>
      </div>

      {/* Main Interaction Area */}
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Upload Card */}
        <div className="bg-white rounded-[2rem] shadow-soft p-2 transition-transform duration-500 hover:shadow-lg">
          <div 
            className={`
              rounded-[1.5rem] border border-dashed
              p-12 flex flex-col items-center justify-center text-center transition-all duration-300
              ${isDragging ? 'bg-soft-sage/10 border-soft-sage' : 'bg-white border-[#E5E0D8]'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-6">
               <div className="w-16 h-16 bg-soft-yellow/50 rounded-full flex items-center justify-center text-earth-brown">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
               </div>
            </div>

            <h3 className="font-serif text-2xl text-earth-brown mb-2">Upload your materials</h3>
            <p className="text-earth-brown/40 mb-8 font-light text-sm">
              PDFs, Word Docs, PPT Slides, Images & Text.
            </p>

            <label className="cursor-pointer">
              <input 
                type="file" 
                multiple 
                accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.txt,.md" 
                className="hidden" 
                onChange={handleInputChange}
              />
              <span className="bg-earth-brown text-white text-lg px-8 py-3 rounded-full hover:bg-terracotta transition-colors shadow-sm hover:shadow-md inline-flex items-center gap-2">
                Analyze Files
              </span>
            </label>
          </div>
        </div>

        {/* OR Divider */}
        <div className="flex items-center gap-4 text-earth-brown/20 font-serif italic text-xl">
          <div className="h-px bg-current flex-1"></div>
          <span>or</span>
          <div className="h-px bg-current flex-1"></div>
        </div>

        {/* Topic Input Field */}
        <form onSubmit={handleTopicSubmit} className="relative group">
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Type a topic to explore..."
            className="w-full bg-white border border-[#E5E0D8] rounded-full px-8 py-5 text-lg text-earth-brown placeholder:text-earth-brown/30 focus:outline-none focus:border-terracotta transition-all shadow-soft group-hover:shadow-lg pr-32"
          />
          <button 
            type="submit"
            disabled={!topic.trim()}
            className={`
              absolute right-2 top-2 bottom-2 px-6 rounded-full font-medium transition-all
              ${topic.trim() 
                ? 'bg-terracotta text-white hover:bg-earth-brown active:scale-95' 
                : 'bg-earth-brown/5 text-earth-brown/20 cursor-not-allowed'}
            `}
          >
            Generate
          </button>
        </form>
      </div>
      
      <div className="mt-16 flex gap-12 text-earth-brown/50 text-sm font-medium tracking-wide justify-center flex-wrap">
         <span className="flex items-center gap-3">
           <span className="w-1.5 h-1.5 bg-soft-sage rounded-full"></span> Simplified
         </span>
         <span className="flex items-center gap-3">
           <span className="w-1.5 h-1.5 bg-terracotta rounded-full"></span> Cited
         </span>
         <span className="flex items-center gap-3">
           <span className="w-1.5 h-1.5 bg-soft-yellow rounded-full"></span> Organized
         </span>
      </div>

      <footer className="mt-24 text-center">
        <p className="font-hand text-4xl text-terracotta font-extrabold tracking-wide inline-block">Made by Habibi with ❤️</p>
      </footer>

    </div>
  );
};