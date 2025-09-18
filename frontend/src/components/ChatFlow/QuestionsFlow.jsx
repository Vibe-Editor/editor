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

  // Map question index to custom headings. Fill in your desired headings here.
  const questionHeadings = {
    0: 'Just a [[few questions]]',
    1: 'Understanding your [[Preferences]]',
    2: 'Setting the [[Space]]',
    3: 'Lighting & [[Focus]]',
    4: 'Almost [[Done]]',
    // Add more indices if there are more questions
  };

  const mainHeading =
    questionHeadings[currentQuestionIndex] ||
    currentQuestion?.heading ||
    currentQuestion?.title ||
    'Your Preferences';

  // Render helper to allow [[highlight]] segments inside the heading
  const formatHeadingText = (text) => {
    if (!text) return null;
    const parts = [];
    let lastIndex = 0;
    const regex = /\[\[(.+?)\]\]/g;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <span key={`hl-${key++}`} className="text-[#94E7EDCC]">{match[1]}</span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

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

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setAnimationPhase('in');
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev - 1);
        setSelectedAnswer(null);
        setTimeout(() => setAnimationPhase('idle'), 20);
      }, 10);
    }
  };

  const handleNext = () => {
    // Only allow going to next if current question is answered
    if (currentQuestionIndex < questionKeys.length - 1 && selectedAnswer) {
      setAnimationPhase('out');
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setAnimationPhase('in');
        setTimeout(() => {
          setAnimationPhase('idle');
        }, 20);
      }, 250);
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
    <div className="max-w-6xl mx-auto p-2 relative">
      <div className="mb-6 text-center">
        <h1 className="text-white text-3xl sm:text-5xl font-bold mb-2">
          {formatHeadingText(mainHeading)}
        </h1>
        <h2 className="text-white/50 text-base sm:text-lg font-semibold mb-1">
          {currentQuestion?.question}
        </h2>
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
              compact
              showNavigation={true}
              onPrevious={handlePrevious}
              onNext={handleNext}
              canGoPrevious={currentQuestionIndex > 0}
              canGoNext={currentQuestionIndex < questionKeys.length - 1 && selectedAnswer}
            />
          </div>
        ) : (
          <div className="w-full min-h-[70vh] flex flex-col items-center justify-center text-center space-y-3">
            <h3 className="text-white text-4xl font-bold">Ready to generate script</h3>
            <p className="text-gray-300 text-lg max-w-2xl">We have enough preferences to start crafting your Story Arc.</p>
            <button
              onClick={() => onGenerateScript && onGenerateScript()}
              className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-semibold text-lg transition-colors"
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
