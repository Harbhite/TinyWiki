import React from 'react';
import { Button } from './Button';

interface AboutPageProps {
  onStart: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-beige-bg pt-12 px-6 pb-20">
      <div className="max-w-3xl mx-auto">
        
        <h1 className="font-serif text-5xl md:text-6xl text-earth-brown mb-10 leading-tight">
          Making knowledge <br/>
          <span className="text-terracotta italic">digestible.</span>
        </h1>
        
        <div className="prose prose-lg prose-p:text-earth-brown/80 prose-headings:font-serif prose-headings:text-earth-brown prose-li:text-earth-brown/80">
          <p className="lead text-xl font-light">
            TinyWiki was born from a simple frustration: information overload. In a world drowning in PDFs, slide decks, and dense documentation, finding the signal in the noise is harder than ever.
          </p>
          
          <p>
            We believe that learning should be organic, not mechanical. It should feel like reading a well-curated magazine article, not hunting for needles in a haystack.
          </p>

          <h3 className="text-2xl mt-8 mb-4">Our Mission</h3>
          <p>
            To empower conscious learners by transforming raw, unstructured information into beautiful, structured, and cited knowledge bases using the power of Generative AI. We don't just summarize; we explain, connect, and simplify.
          </p>
          
          <h3 className="text-2xl mt-8 mb-4">Why "Tiny"?</h3>
          <p>
            Because big ideas don't need big words. We focus on clarity, brevity, and structure. We strip away the fluff so you can focus on what matters.
          </p>

          <h3 className="text-2xl mt-8 mb-4">How it works</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Analyze:</strong> We read your uploaded documents (PDFs, Images, Text).</li>
            <li><strong>Synthesize:</strong> Our AI identifies core concepts and narrative flow.</li>
            <li><strong>Structure:</strong> We build a Wiki-style entry with sections, key points, and citations.</li>
            <li><strong>Deliver:</strong> You get a clean, interactive learning experience.</li>
          </ul>
        </div>

        <div className="mt-16 pt-12 border-t border-earth-brown/10 flex flex-col items-center text-center">
            <p className="font-hand text-3xl text-terracotta mb-6">Made by Habibi with ❤️</p>
            <Button onClick={onStart}>Start Creating</Button>
        </div>
      </div>
    </div>
  );
};