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

  const isFileAccepted = (file: File) => {
    // Robust check for MIME types and Extensions
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

    // Accept if either extension or mime is valid (some browsers report empty mime for markdown/obscure types)
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
            type: file.type || 'application/octet-stream', // Fallback type
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

      {/* Upload Card */}
      <div className="w-full max-w-xl relative">
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
                Start Learning
              </span>
            </label>
          </div>
        </div>
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