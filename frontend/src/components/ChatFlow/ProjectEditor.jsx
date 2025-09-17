import { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import VideoGrid from './VideoGrid';
import QuestionsFlow from './QuestionsFlow';
import StoryArcEngine from './StoryArc';
import { assets } from '../../assets/assets';
import { questionsApi } from '../../services/questions';
import { storyEngineApi } from '../../services/storyEngine';

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
  const clearProjectEditorAfterSave = useProjectStore((state) => state.clearProjectEditorAfterSave);
  
  const [inputValue, setInputValue] = useState('');
  const [showStoryArc, setShowStoryArc] = useState(false);
  const [storyArcIn, setStoryArcIn] = useState(false);
  const [storyData, setStoryData] = useState(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      initializeChat();
      fetchQuestions();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (showStoryArc) {
      const id = setTimeout(() => setStoryArcIn(true), 10);
      return () => clearTimeout(id);
    } else {
      setStoryArcIn(false);
    }
  }, [showStoryArc]);

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
    setProjectEditorStep('user_prompt');
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
    setProjectEditorStep('preference_questions');
  };

  const handlePreferenceAnswer = async (questionKey, answer) => {
    setPreferenceAnswer(questionKey, answer);

    const questionKeys = Object.keys(projectEditor.questionsData?.preference_questions || {});
    const isLastQuestion = Object.keys(projectEditor.preferenceAnswers).length + 1 === questionKeys.length;
    // Do not auto-transition here; the QuestionsFlow will show a "Generate Script" CTA after 5th answer
    // Intentionally do nothing here to avoid sidebar message; CTA appears in main area
    if (isLastQuestion) {}
  };

  const saveVideoPreferences = async (allAnswers) => {
    try {
      if (!selectedProject?.id) {
        console.error('No project selected');
        return;
      }

      // Map the answers to the API format - extract only id values
      const preferences = {
        user_prompt: projectEditor.userPrompt,
        video_type: projectEditor.videoTypeSelection?.id || 'talking_head',
        visual_style: allAnswers.visual_style?.id || 'cool_corporate',
        lighting_mood: allAnswers.mood_tone?.id || 'bright_minimal',
        camera_style: allAnswers.camera_movement?.id || 'static_locked',
        subject_focus: allAnswers.subject_focus?.id || 'person_vr',
        location_environment: allAnswers.environment_space?.id || 'minimal_room'
      };

      console.log('Saving video preferences:', preferences);
      
      const result = await questionsApi.createVideoPreferences(selectedProject.id, preferences);
      console.log('Video preferences saved successfully:', result);
      
      // Generate concept with preferences after successful save
      try {
        const conceptResult = await storyEngineApi.generateConceptWithPreferences(selectedProject.id);
        console.log('Concept generated successfully:', conceptResult);
        setStoryData(conceptResult.data);
      } catch (conceptError) {
        console.error('Failed to generate concept:', conceptError);
        // Continue with the flow even if concept generation fails
      } finally {
        setIsGeneratingStory(false);
      }
      
      // Clear the project editor state after successful save
      clearProjectEditorAfterSave();
      
      setChatMessages([
        ...projectEditor.chatMessages,
        {
          id: projectEditor.chatMessages.length + 2,
          type: 'bot',
          content: 'Perfect! Your video preferences have been saved. Your video is now being created...',
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error('Failed to save video preferences:', error);
      setChatMessages([
        ...projectEditor.chatMessages,
        {
          id: projectEditor.chatMessages.length + 2,
          type: 'bot',
          content: 'There was an issue saving your preferences, but I\'ll still create your video with the information provided.',
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleGenerateScript = async () => {
    const allAnswers = { ...projectEditor.preferenceAnswers };
    setIsGeneratingStory(true);
    setShowStoryArc(true);
    await saveVideoPreferences(allAnswers);
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

  // Show StoryArc when completed
  if (showStoryArc) {
    return (
      <div className={`w-full h-screen bg-black overflow-hidden`}> 
        <div className={`w-full h-full transform transition-transform duration-500 ease-out ${storyArcIn ? 'translate-x-0' : 'translate-x-full'}`}>
          <StoryArcEngine storyData={storyData} isLoading={isGeneratingStory} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col relative">
      {/* Absolute positioned header elements */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <img src={assets.SandBoxLogo} alt="Usuals.ai" className="w-5 h-5" />
        <div className="flex flex-col">
          <h1 className="text-white text-base font-semibold">Project Editor</h1>
          <div className="text-gray-400 text-xs">
            <span className="font-medium text-white">{selectedProject.name}</span>
            {selectedProject.description ? ` · ${selectedProject.description}` : ''}
          </div>
        </div>
      </div>
      
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
        aria-label="Close"
        title="Close"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Center Content Area - Now starts from top */}
      <div className={`flex-1 px-6 sm:px-10 md:px-16 pt-12 pb-2 flex justify-center ${
        projectEditor.currentStep === 'user_prompt' ? 'items-center' : 'items-start'
      }`}>
        <div className="w-full max-w-6xl">
          {projectEditor.currentStep === 'video_type_selection' && projectEditor.questionsData && (
            <div>
              <h2 className="text-white text-2xl font-semibold mb-8 text-center">Choose Your Video Type</h2>
              <VideoGrid
                options={Object.entries(projectEditor.questionsData.video_type_selection).map(([key, value]) => ({
                  id: key,
                  ...value
                }))}
                onSelect={handleVideoTypeSelect}
                selectedId={projectEditor.videoTypeSelection?.id}
                compact
              />
            </div>
          )}

          {projectEditor.currentStep === 'user_prompt' && (
            <div className="text-center">
              <h2 className="text-white text-7xl font-bold mb-6">
                Let's bring your idea to life!
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                Describe your idea in detail below for better video generation and understanding. 
                The more specific you are, the better we can create exactly what you envision.
              </p>
            </div>
          )}

          {projectEditor.currentStep === 'preference_questions' && projectEditor.questionsData && (
            <QuestionsFlow
              questionsData={projectEditor.questionsData}
              onAnswerSubmit={handlePreferenceAnswer}
              currentAnswers={projectEditor.preferenceAnswers}
              onGenerateScript={handleGenerateScript}
            />
          )}
        </div>
      </div>

      {/* Bottom Centered Input (visible throughout the flow until Generate Script) */}
      {!showStoryArc && (
        <div className="w-full px-4 py-6 pb-6 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <div className="bg-gradient-to-t from-[#20272B] to-[#000000] rounded-2xl border-1 border-white/30 p-4">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePromptSubmit()}
                  placeholder={
                    projectEditor.currentStep === 'video_type_selection' 
                      ? "Choose a video type above, then describe what you want to create..."
                      : projectEditor.currentStep === 'preference_questions'
                      ? "Answer the questions above, or add more details about your video..."
                      : "Describe what you want to create..."
                  }
                  disabled={projectEditor.currentStep !== 'user_prompt'}
                  className={`flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base ${
                    projectEditor.currentStep !== 'user_prompt' 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                />
                <div
                  onClick={projectEditor.currentStep === 'user_prompt' ? handlePromptSubmit : undefined}
                  disabled={!inputValue.trim() || projectEditor.currentStep !== 'user_prompt'}
                  className={`text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 ${
                    projectEditor.currentStep === 'user_prompt' 
                      ? 'cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <svg
                    width="28"
                    height="29"
                    viewBox="0 0 28 29"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      y="0.5"
                      width="28"
                      height="28"
                      rx="6"
                      fill="white"
                      fillOpacity="0.1"
                    />
                    <path
                      d="M12.3594 16.1406L8.70896 14.1497C7.75627 13.6302 7.76571 12.2605 8.72538 11.7672C11.3719 10.407 14.186 9.39704 17.0973 8.76249C17.9332 8.58029 18.8885 8.20889 19.5898 8.91018C20.2911 9.61147 19.9197 10.5668 19.7375 11.4027C19.103 14.314 18.093 17.1281 16.7328 19.7746C16.2395 20.7343 14.8698 20.7437 14.3503 19.791L12.3594 16.1406ZM12.3594 16.1406L14.5651 13.9349"
                      stroke="white"
                      strokeOpacity="0.5"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectEditor;
