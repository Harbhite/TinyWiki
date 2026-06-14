import React, { useState } from 'react';
import { Annotation } from '../types';

interface AnnotationsProps {
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onExportAnnotations: () => void;
}

/**
 * Feature 10: Smart Annotation & Zettelkasten Export
 * A rich-text annotation layer allowing users to highlight text and add personal notes.
 * These notes can be exported to Obsidian, Notion, or Roam Research.
 */
export const Annotations: React.FC<AnnotationsProps> = ({
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  onExportAnnotations,
}) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const handleTextSelection = () => {
    const selected = window.getSelection()?.toString() || '';
    if (selected) {
      setSelectedText(selected);
      setIsAddingNote(true);
    }
  };

  const handleAddAnnotation = () => {
    if (!selectedText || !noteContent.trim()) return;

    const newAnnotation: Annotation = {
      id: `ann_${Date.now()}`,
      userId: 'current_user',
      timestamp: Date.now(),
      text: selectedText,
      note: noteContent,
      sectionId: 0, // Would be set based on current section
    };

    onAddAnnotation(newAnnotation);
    setSelectedText('');
    setNoteContent('');
    setIsAddingNote(false);
  };

  return (
    <div className="space-y-6">
      {/* Annotation Panel */}
      {isAddingNote && (
        <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl p-6 w-96 z-40 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-bold text-earth-brown">Add Note</h3>
            <button
              onClick={() => setIsAddingNote(false)}
              className="text-gray-400 hover:text-earth-brown transition-colors"
            >
              ✕
            </button>
          </div>

          {selectedText && (
            <div className="mb-4 p-3 bg-soft-yellow/20 rounded-lg border border-soft-yellow/40">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Selected Text</p>
              <p className="text-sm text-earth-brown/70 italic">"{selectedText}"</p>
            </div>
          )}

          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your personal note..."
            className="w-full h-20 p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-terracotta resize-none text-sm"
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsAddingNote(false)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAnnotation}
              disabled={!noteContent.trim()}
              className="flex-1 px-3 py-2 bg-terracotta text-white rounded-lg text-sm font-bold hover:bg-earth-brown transition-all disabled:opacity-50"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-earth-brown">Your Annotations ({annotations.length})</h3>
            <button
              onClick={onExportAnnotations}
              className="px-3 py-1.5 text-xs font-bold bg-soft-sage/20 text-soft-sage rounded-full hover:bg-soft-sage/30 transition-all"
            >
              📤 Export to Obsidian/Notion
            </button>
          </div>

          <div className="space-y-3">
            {annotations.map((annotation) => (
              <div key={annotation.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs text-gray-400 font-light">
                    {new Date(annotation.timestamp).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => onDeleteAnnotation(annotation.id)}
                    className="text-gray-400 hover:text-terracotta transition-colors text-sm"
                  >
                    🗑
                  </button>
                </div>

                <p className="text-sm text-earth-brown/70 italic mb-2 border-l-2 border-terracotta pl-3">
                  "{annotation.text}"
                </p>

                <p className="text-sm text-earth-brown font-light">{annotation.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-soft-yellow/10 rounded-xl p-4 border border-soft-yellow/30">
        <p className="text-xs text-earth-brown/60 font-light">
          💡 <strong>Tip:</strong> Highlight any text in the wiki and click to add a personal note. Your annotations will be saved and can be exported to your favorite note-taking app.
        </p>
      </div>
    </div>
  );
};
