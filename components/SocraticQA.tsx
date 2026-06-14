import React, { useState, useEffect } from 'react';
import { WikiData, QuizQuestion, QuizSession } from '../types';
import { chatWithWiki } from '../services/geminiService';

interface SocraticQAProps {
  wiki: WikiData;
  onClose: () => void;
}

/**
 * Feature 5: Socratic Q&A Assessment
 * The AI asks the user questions to test their understanding.
 * Based on answers, the AI identifies knowledge gaps and highlights sections to review.
 */
export const SocraticQA: React.FC<SocraticQAProps> = ({ wiki, onClose }) => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Generate quiz questions on mount
  useEffect(() => {
    const generateQuestions = async () => {
      try {
        setIsLoading(true);
        const prompt = `Based on this wiki about "${wiki.title}", generate 5 short quiz questions that test understanding of the key concepts. For each question, provide:
1. The question
2. The correct answer (1-2 sentences)
3. The section ID it relates to (0-indexed)

Format as JSON array: [{"question": "...", "correctAnswer": "...", "wikiSectionId": 0}]`;

        const response = await chatWithWiki(
          [{ role: 'user', content: prompt }],
          wiki
        );

        try {
          const questions = JSON.parse(response.text) as QuizQuestion[];
          setSession({
            questions,
            userAnswers: {},
            score: 0,
            feedback: '',
          });
        } catch {
          // Fallback: create simple questions
          setSession({
            questions: [
              {
                question: `What is the main topic of this wiki about "${wiki.title}"?`,
                correctAnswer: wiki.summary.substring(0, 100),
                wikiSectionId: 0,
              },
            ],
            userAnswers: {},
            score: 0,
            feedback: '',
          });
        }
      } catch (error) {
        console.error('Failed to generate questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQuestions();
  }, [wiki]);

  const handleSubmitAnswer = async () => {
    if (!session || !userAnswer.trim()) return;

    const currentQuestion = session.questions[currentQuestionIdx];
    setIsLoading(true);

    try {
      const evaluationPrompt = `
        Question: ${currentQuestion.question}
        Correct Answer: ${currentQuestion.correctAnswer}
        User's Answer: ${userAnswer}
        
        Evaluate the user's answer. Is it correct or close to correct? Provide brief feedback (1-2 sentences) and suggest if they should review a specific section.
      `;

      const response = await chatWithWiki(
        [{ role: 'user', content: evaluationPrompt }],
        wiki
      );

      setFeedback(response.text);
      setShowFeedback(true);

      // Update session
      const newSession = { ...session };
      newSession.userAnswers[currentQuestionIdx] = userAnswer;
      setSession(newSession);
    } catch (error) {
      console.error('Failed to evaluate answer:', error);
      setFeedback('Could not evaluate your answer. Please try again.');
      setShowFeedback(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (session && currentQuestionIdx < session.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setFeedback(null);
    }
  };

  if (isLoading && !session) {
    return (
      <div className="fixed inset-0 bg-earth-brown/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full p-8 text-center">
          <div className="w-12 h-12 border-4 border-terracotta/30 border-t-terracotta rounded-full animate-spin mx-auto mb-4" />
          <p className="text-earth-brown font-light">Generating personalized questions...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const currentQuestion = session.questions[currentQuestionIdx];
  const progress = ((currentQuestionIdx + 1) / session.questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-earth-brown/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-earth-brown">Socratic Q&A</h2>
          <button
            onClick={onClose}
            className="text-earth-brown/40 hover:text-terracotta transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Question {currentQuestionIdx + 1} of {session.questions.length}</span>
            <span className="text-xs font-bold text-terracotta">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-soft-yellow/20 rounded-xl p-6 border border-soft-yellow/40">
          <p className="font-serif text-xl text-earth-brown mb-4">{currentQuestion.question}</p>
        </div>

        {/* Answer input */}
        {!showFeedback ? (
          <div className="space-y-4">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:outline-none focus:border-terracotta resize-none"
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim() || isLoading}
              className="w-full px-6 py-3 bg-earth-brown text-white rounded-full font-bold hover:bg-terracotta transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Evaluating...' : 'Submit Answer'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-soft-sage/20 rounded-xl p-6 border border-soft-sage/40">
              <h4 className="font-bold text-earth-brown mb-2">Feedback</h4>
              <p className="text-sm text-earth-brown/70 leading-relaxed font-light">{feedback}</p>
            </div>

            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIdx >= session.questions.length - 1}
              className="w-full px-6 py-3 bg-earth-brown text-white rounded-full font-bold hover:bg-terracotta transition-colors disabled:opacity-50"
            >
              {currentQuestionIdx >= session.questions.length - 1
                ? 'Quiz Complete!'
                : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
