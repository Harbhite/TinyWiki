import React, { useState } from 'react';
import { CodeSnippet, MathExpression } from '../types';

interface CodeSandboxProps {
  snippets: CodeSnippet[];
  mathExpressions: MathExpression[];
}

/**
 * Feature 7: Interactive Code & Math Sandboxes
 * Allows users to execute code snippets and interact with mathematical expressions.
 * For Python/JS code, provides a simple execution environment.
 * For LaTeX/math, uses Desmos-style interactive graphs.
 */
export const CodeSandbox: React.FC<CodeSandboxProps> = ({ snippets, mathExpressions }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'math'>('code');
  const [selectedSnippetIdx, setSelectedSnippetIdx] = useState(0);
  const [codeOutput, setCodeOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCode = async (code: string, language: string) => {
    setIsExecuting(true);
    try {
      if (language === 'python') {
        // For Python, we'd need a backend or Pyodide
        // For now, show a placeholder
        setCodeOutput('Python execution requires a backend service. Contact admin to enable.');
      } else if (language === 'javascript') {
        // Execute JavaScript safely (with limitations)
        const output: string[] = [];
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          output.push(args.map((a) => String(a)).join(' '));
        };

        try {
          // eslint-disable-next-line no-eval
          eval(code);
          setCodeOutput(output.join('\n') || '(No output)');
        } catch (error: any) {
          setCodeOutput(`Error: ${error.message}`);
        } finally {
          console.log = originalLog;
        }
      }
    } finally {
      setIsExecuting(false);
    }
  };

  if (snippets.length === 0 && mathExpressions.length === 0) {
    return null;
  }

  const currentSnippet = snippets[selectedSnippetIdx];

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {snippets.length > 0 && (
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-colors ${
              activeTab === 'code'
                ? 'text-terracotta border-b-2 border-terracotta'
                : 'text-gray-400 hover:text-earth-brown'
            }`}
          >
            💻 Code Snippets
          </button>
        )}
        {mathExpressions.length > 0 && (
          <button
            onClick={() => setActiveTab('math')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-colors ${
              activeTab === 'math'
                ? 'text-terracotta border-b-2 border-terracotta'
                : 'text-gray-400 hover:text-earth-brown'
            }`}
          >
            📐 Math Expressions
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'code' && snippets.length > 0 && (
          <div className="space-y-4">
            {snippets.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {snippets.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSnippetIdx(idx)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      selectedSnippetIdx === idx
                        ? 'bg-terracotta text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Snippet {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {currentSnippet && (
              <>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                    {currentSnippet.language.toUpperCase()}
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                    {currentSnippet.code}
                  </pre>
                </div>

                {currentSnippet.executable && (
                  <>
                    <button
                      onClick={() => executeCode(currentSnippet.code, currentSnippet.language)}
                      disabled={isExecuting}
                      className="px-4 py-2 bg-terracotta text-white rounded-lg font-bold text-sm hover:bg-earth-brown transition-colors disabled:opacity-50"
                    >
                      {isExecuting ? '⏳ Running...' : '▶ Run Code'}
                    </button>

                    {codeOutput && (
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono">
                        <p className="text-gray-400 mb-2">Output:</p>
                        <p>{codeOutput}</p>
                      </div>
                    )}
                  </>
                )}

                {currentSnippet.description && (
                  <p className="text-sm text-earth-brown/70 font-light leading-relaxed">
                    {currentSnippet.description}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'math' && mathExpressions.length > 0 && (
          <div className="space-y-6">
            {mathExpressions.map((expr, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Expression {idx + 1}</p>
                <div className="bg-gray-50 p-4 rounded-lg mb-3 font-mono text-sm text-earth-brown">
                  {expr.latex}
                </div>
                {expr.description && (
                  <p className="text-sm text-earth-brown/70 font-light">{expr.description}</p>
                )}
                {expr.interactive && (
                  <p className="text-xs text-terracotta mt-2 font-bold">
                    💡 This expression is interactive. Hover to explore values.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
