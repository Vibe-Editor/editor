import { useState, useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import VideoGrid from './VideoGrid';
import QuestionsFlow from './QuestionsFlow';
import { assets } from '../assets/assets';
import { questionsApi } from '../services/questions';

const ProjectEditor = () => {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const projectEditor = useProjectStore((state) => state.projectEditor);
  const setProjectEditorStep = useProjectStore((state) => state.setProjectEditorStep);
  const setQuestionsData = useProjectStore((state) => state.setQuestionsData);
  const setVideoTypeSelection = useProjectStore((state) => state.setVideoTypeSelection);
  const setUserPrompt = useProjectStore((state) => state.setUserPrompt);
  const setPreferenceAnswer = useProjectStore((state) => state.setPreferenceAnswer);
  const setChatMessages = useProjectStore((state) => state.setChatMessages);
  const resetProjectEditor = useProjectStore((state) => state.resetProjectEditor);
  
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (selectedProject) {
      initializeChat();
      fetchQuestions();
    }
  }, [selectedProject]);

  const initializeChat = () => {
    setChatMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Hi! Let\'s create something amazing together. First, what type of video would you like to make?',
        timestamp: new Date()
      }
    ]);
    setProjectEditorStep('video_type_selection');
  };

  const fetchQuestions = async () => {
    try {
      const data = await questionsApi.getQuestions();
      setQuestionsData(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleVideoTypeSelect = (videoType) => {
    setVideoTypeSelection(videoType);
    setChatMessages([
      ...projectEditor.chatMessages,
      {
        id: projectEditor.chatMessages.length + 1,
        type: 'bot',
        content: `Great choice! Now, what would you like to create with ${videoType.description.toLowerCase()}?`,
        timestamp: new Date()
      }
    ]);
  };

  const handlePromptSubmit = () => {
    if (!inputValue.trim()) return;
    
    setUserPrompt(inputValue);
    setChatMessages([
      ...projectEditor.chatMessages,
      {
        id: projectEditor.chatMessages.length + 1,
        type: 'user',
        content: inputValue,
        timestamp: new Date()
      },
      {
        id: projectEditor.chatMessages.length + 2,
        type: 'bot',
        content: 'Perfect! Now let me ask you a few questions to customize your video.',
        timestamp: new Date()
      }
    ]);
    setInputValue('');
  };

  const handlePreferenceAnswer = (questionKey, answer) => {
    setPreferenceAnswer(questionKey, answer);

    const questionKeys = Object.keys(projectEditor.questionsData?.preference_questions || {});
    const isLastQuestion = Object.keys(projectEditor.preferenceAnswers).length + 1 === questionKeys.length;
    
    if (isLastQuestion) {
      setChatMessages([
        ...projectEditor.chatMessages,
        {
          id: projectEditor.chatMessages.length + 1,
          type: 'bot',
          content: 'Excellent! I have all the information I need. Let me start creating your video...',
          timestamp: new Date()
        }
      ]);
      setProjectEditorStep('completed');
    }
  };

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('projectEditor:close'));
  };

  if (!selectedProject) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">No project selected</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex">
      {/* Left Panel - Chat */}
      <div className="w-1/3 bg-gray-900 flex flex-col border-r border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={assets.SandBoxLogo} alt="Usuals.ai" className="w-6 h-6" />
            <h1 className="text-white text-lg font-semibold">Project Editor</h1>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Project Info */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-medium">{selectedProject.name}</h2>
          <p className="text-gray-400 text-sm">{selectedProject.description}</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {projectEditor.chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        {projectEditor.currentStep === 'user_prompt' && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePromptSubmit()}
                placeholder="Describe what you want to create..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={handlePromptSubmit}
                disabled={!inputValue.trim()}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-600 text-black rounded-lg font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          {projectEditor.currentStep === 'video_type_selection' && projectEditor.questionsData && (
            <div>
              <h2 className="text-white text-2xl font-semibold mb-8 text-center">
                Choose Your Video Type
              </h2>
              <VideoGrid
                options={Object.entries(projectEditor.questionsData.video_type_selection).map(([key, value]) => ({
                  id: key,
                  ...value
                }))}
                onSelect={handleVideoTypeSelect}
                selectedId={projectEditor.videoTypeSelection?.id}
              />
            </div>
          )}

          {projectEditor.currentStep === 'preference_questions' && projectEditor.questionsData && (
            <QuestionsFlow
              questionsData={projectEditor.questionsData}
              onAnswerSubmit={handlePreferenceAnswer}
              currentAnswers={projectEditor.preferenceAnswers}
            />
          )}

          {projectEditor.currentStep === 'completed' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-white text-2xl font-semibold mb-2">All Set!</h2>
                <p className="text-gray-400">Your video is being created based on your preferences.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;
