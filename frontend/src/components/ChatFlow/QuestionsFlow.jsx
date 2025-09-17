import { useState, useEffect } from 'react';
import VideoGrid from './VideoGrid';

const QuestionsFlow = ({ questionsData, onAnswerSubmit, currentAnswers, onGenerateScript }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle' | 'out' | 'in'
  const [showReady, setShowReady] = useState(false);

  const questionKeys = Object.keys(questionsData.preference_questions || {});
  const currentQuestionKey = questionKeys[currentQuestionIndex];
  const currentQuestion = questionsData.preference_questions?.[currentQuestionKey];
  const isLastQuestion = currentQuestionIndex === questionKeys.length - 1;

  useEffect(() => {
    setSelectedAnswer(currentAnswers[currentQuestionKey] || null);
  }, [currentQuestionKey, currentAnswers]);

  const handleAnswerSelect = (option) => {
    // Immediately submit the answer
    setSelectedAnswer(option);
    onAnswerSubmit(currentQuestionKey, option);

    // If 5th question (index 4) selected, show ready screen
    if (currentQuestionIndex === 4) {
      setShowReady(true);
      return;
    }

    if (isLastQuestion) {
      // Parent will transition to Story Arc; no local advance
      return;
    }

    // Trigger swipe-left animation for current grid, then advance
    setAnimationPhase('out');
    setTimeout(() => {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      // Mount next grid off-screen to the right
      setAnimationPhase('in');
      // Next tick, slide it to center
      setTimeout(() => {
        setAnimationPhase('idle');
      }, 20);
    }, 250);
  };

  const handleBack = () => {
    if (showReady) {
      setShowReady(false);
      return;
    }
    if (currentQuestionIndex > 0) {
      setAnimationPhase('in');
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev - 1);
        setSelectedAnswer(null);
        setTimeout(() => setAnimationPhase('idle'), 20);
      }, 10);
    }
  };

  if (!currentQuestion && !showReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      {/* Back Button */}
      <div
        className={`absolute top-4 left-4 z-10 ${currentQuestionIndex > 0 || showReady ? 'opacity-100' : 'opacity-50'} cursor-pointer`}
        onClick={handleBack}
        role="button"
        aria-label="Go back"
        title="Back"
      >
        <div className="w-10 h-10 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center hover:bg-gray-700/80 transition-colors">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      </div>
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="flex space-x-2">
            {questionKeys.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentQuestionIndex ? 'bg-yellow-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        <h2 className="text-white text-2xl font-semibold mb-2">
          {currentQuestion.question}
        </h2>
        <p className="text-gray-400">
          Question {currentQuestionIndex + 1} of {questionKeys.length}
        </p>
      </div>

      {/* Animated grid with overflow hidden to avoid scrollbars during slide or Ready screen */}
      <div className="overflow-hidden">
        {!showReady ? (
          <div
            key={currentQuestionKey}
            className={`transform-gpu transition-transform duration-500 ease-in-out ${
              animationPhase === 'out'
                ? '-translate-x-full'
                : animationPhase === 'in'
                ? 'translate-x-full'
                : 'translate-x-0'
            }`}
            style={{ willChange: 'transform' }}
          >
            <VideoGrid
              options={currentQuestion.options}
              onSelect={handleAnswerSelect}
              selectedId={selectedAnswer?.id}
            />
          </div>
        ) : (
          <div className="w-full h-64 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="text-white text-2xl font-semibold">Ready to generate script</h3>
            <p className="text-gray-400">We have enough preferences to start crafting your Story Arc.</p>
            <button
              onClick={() => onGenerateScript && onGenerateScript()}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-medium transition-colors"
            >
              Generate Script
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsFlow;
