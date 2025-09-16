import { useState, useEffect } from 'react';
import VideoGrid from './VideoGrid';

const QuestionsFlow = ({ questionsData, onAnswerSubmit, currentAnswers }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const questionKeys = Object.keys(questionsData.preference_questions || {});
  const currentQuestionKey = questionKeys[currentQuestionIndex];
  const currentQuestion = questionsData.preference_questions?.[currentQuestionKey];
  const isLastQuestion = currentQuestionIndex === questionKeys.length - 1;

  useEffect(() => {
    setSelectedAnswer(currentAnswers[currentQuestionKey] || null);
  }, [currentQuestionKey, currentAnswers]);

  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;
    
    onAnswerSubmit(currentQuestionKey, selectedAnswer);
    
    if (isLastQuestion) {
      return;
    }
    
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="flex space-x-2">
            {questionKeys.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < currentQuestionIndex
                    ? 'bg-yellow-400'
                    : index === currentQuestionIndex
                    ? 'bg-yellow-400'
                    : 'bg-gray-600'
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

      <VideoGrid
        options={currentQuestion.options}
        onSelect={handleAnswerSelect}
        selectedId={selectedAnswer?.id}
      />

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          Previous
        </button>
        
        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-600 disabled:opacity-50 text-black rounded-lg font-medium transition-colors"
        >
          {isLastQuestion ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default QuestionsFlow;
