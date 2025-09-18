import { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAuthStore } from '../../hooks/useAuthStore';
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
  const setPreferenceVideos = useProjectStore((state) => state.setPreferenceVideos);
  
  const [inputValue, setInputValue] = useState('');
  const [showStoryArc, setShowStoryArc] = useState(false);
  const [storyArcIn, setStoryArcIn] = useState(false);
  const [storyData, setStoryData] = useState(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [videoPreferences, setVideoPreferences] = useState(null);

  // Get user data for avatar
  const { user } = useAuthStore();
  const displayName = (user?.name || user?.email?.split('@')[0] || 'there')
    .toString()
    .trim();
  const greetingPrefix = (() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

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
      console.log('📦 Video preferences saved successfully:', result);
      console.log('📦 Result structure:', typeof result, Object.keys(result || {}));
      console.log('📦 Result.data exists?:', !!result?.data);
      console.log('📦 Result.data.finalConfig exists?:', !!result?.data?.finalConfig);
      
      // Store the video preferences response for later use
      setVideoPreferences(result);
      console.log('📦 Stored video preferences in state:', result);
      
      // Extract and preserve preference videos before clearing preferenceAnswers
      const preferenceVideos = [];
      if (allAnswers && typeof allAnswers === 'object') {
        Object.values(allAnswers).forEach((ans) => {
          if (preferenceVideos.length >= 2) return; // Only take first 2
          const src = (ans?.s3_key || ans?.s3Key || '').trim();
          if (src) preferenceVideos.push(src);
        });
      }
      console.log('📦 Extracted preference videos:', preferenceVideos);
      setPreferenceVideos(preferenceVideos);
      
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
      <div className="w-full h-screen bg-gradient-to-b from-[#373738] to-[#1D1D1D] flex items-center justify-center">
        <div className="text-white text-xl">No project selected</div>
      </div>
    );
  }

  // Show StoryArc when completed
  if (showStoryArc) {
    return (
      <div className={`w-full h-screen bg-black overflow-hidden`}> 
        <div className={`w-full h-full transform transition-transform duration-500 ease-out ${storyArcIn ? 'translate-x-0' : 'translate-x-full'}`}>
          <StoryArcEngine storyData={storyData} videoPreferences={videoPreferences} isLoading={isGeneratingStory} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#373738] to-[#1D1D1D] flex flex-col relative">
      {/* Absolute positioned header elements */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <img src={assets.SandBoxLogo} alt="Usuals.ai" className="w-10 h-10" />
        <div className="flex flex-col">
          <h1 className="text-2xl text-white font-semibold">Usuals</h1>
        </div>
      </div>

      {/* Top Right Buttons */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        {/* Chat Button */}
        <div
          className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          aria-label="Chat"
          title="Chat"
        >
          <div className="flex gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.57731 5.76368C9.037 4.87064 9.26685 4.42412 9.57563 4.27944C9.84446 4.15348 10.1554 4.15348 10.4242 4.27944C10.733 4.42412 10.9628 4.87064 11.4225 5.76368L12.6142 8.07877C12.6938 8.23349 12.7337 8.31085 12.7852 8.37917C12.8309 8.43981 12.8834 8.49505 12.9416 8.54381C13.0072 8.59874 13.0824 8.64245 13.2329 8.72989L15.6193 10.1166C16.4012 10.571 16.7921 10.7982 16.9236 11.0943C17.0382 11.3526 17.0382 11.6474 16.9236 11.9057C16.7921 12.2018 16.4012 12.429 15.6193 12.8834L13.2329 14.2701C13.0824 14.3575 13.0072 14.4013 12.9416 14.4562C12.8834 14.505 12.8309 14.5602 12.7852 14.6208C12.7337 14.6891 12.6938 14.7665 12.6142 14.9212L11.4225 17.2363C10.9628 18.1294 10.733 18.5759 10.4242 18.7206C10.1554 18.8465 9.84446 18.8465 9.57563 18.7206C9.26685 18.5759 9.037 18.1294 8.57731 17.2363L7.38563 14.9212C7.30598 14.7665 7.26616 14.6891 7.21465 14.6208C7.16892 14.5602 7.11644 14.505 7.05821 14.4562C6.99261 14.4013 6.91738 14.3575 6.76692 14.2701L4.38054 12.8834C3.59863 12.429 3.20768 12.2018 3.07623 11.9057C2.96157 11.6474 2.96157 11.3526 3.07623 11.0943C3.20768 10.7982 3.59863 10.571 4.38054 10.1166L6.76692 8.72989C6.91738 8.64245 6.99261 8.59874 7.05821 8.54381C7.11644 8.49505 7.16892 8.43981 7.21465 8.37917C7.26616 8.31085 7.30598 8.23349 7.38563 8.07877L8.57731 5.76368Z"
                stroke="white"
                stroke-opacity="0.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17.4594 19.4062C17.2057 19.089 17.0788 18.9304 17.0313 18.7475C16.9895 18.5866 16.9895 18.4134 17.0313 18.2525C17.0788 18.0696 17.2057 17.911 17.4594 17.5938L18.275 16.5744C18.5287 16.2572 18.6556 16.0986 18.8019 16.0392C18.9306 15.9869 19.0692 15.9869 19.1979 16.0392C19.3442 16.0986 19.4711 16.2572 19.7248 16.5744L20.5404 17.5938C20.7941 17.911 20.921 18.0696 20.9685 18.2525C21.0104 18.4134 21.0104 18.5866 20.9685 18.7475C20.921 18.9304 20.7941 19.089 20.5404 19.4062L19.7248 20.4256C19.4711 20.7428 19.3442 20.9014 19.1979 20.9608C19.0692 21.0131 18.9306 21.0131 18.8019 20.9608C18.6556 20.9014 18.5287 20.7428 18.275 20.4256L17.4594 19.4062Z"
                stroke="white"
                stroke-opacity="0.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.2297 4.36247C18.1028 4.23559 18.0394 4.17215 18.0156 4.099C17.9947 4.03466 17.9947 3.96534 18.0156 3.901C18.0394 3.82785 18.1028 3.76441 18.2297 3.63753L18.6374 3.22976C18.7643 3.10289 18.8278 3.03945 18.9009 3.01568C18.9653 2.99477 19.0346 2.99477 19.0989 3.01568C19.1721 3.03945 19.2355 3.10289 19.3624 3.22976L19.7701 3.63753C19.897 3.76441 19.9605 3.82785 19.9842 3.901C20.0051 3.96534 20.0051 4.03466 19.9842 4.099C19.9605 4.17215 19.897 4.23559 19.7701 4.36247L19.3624 4.77024C19.2355 4.89711 19.1721 4.96055 19.0989 4.98432C19.0346 5.00523 18.9653 5.00523 18.9009 4.98432C18.8278 4.96055 18.7643 4.89711 18.6374 4.77024L18.2297 4.36247Z"
                stroke="white"
                stroke-opacity="0.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span className="text-base">Chat</span>
          </div>
        </div>

        {/* Credits Button */}
        <div
          className="text-[#F9D312] hover:text-[#F9D312] hover:bg-[#f9d21240] transition-colors border-1 border-[#F9D312] bg-[#f9d21229] px-3 py-1.5 rounded-lg cursor-pointer"
          aria-label="Credits"
          title="Credits"
        >
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z"
                stroke="#F9D312"
                stroke-width="1.33"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M5.86848 5.46472C6.2645 5.0687 6.4625 4.87069 6.69083 4.7965C6.89168 4.73124 7.10802 4.73124 7.30887 4.7965C7.53719 4.87069 7.7352 5.0687 8.13122 5.46472L8.53515 5.86864C8.93116 6.26466 9.12917 6.46267 9.20336 6.69099C9.26862 6.89184 9.26862 7.10819 9.20336 7.30903C9.12917 7.53736 8.93116 7.73537 8.53515 8.13138L8.13122 8.53531C7.7352 8.93132 7.53719 9.12933 7.30887 9.20352C7.10802 9.26878 6.89168 9.26878 6.69083 9.20352C6.4625 9.12933 6.2645 8.93132 5.86848 8.53531L5.46455 8.13138C5.06854 7.73537 4.87053 7.53736 4.79634 7.30903C4.73108 7.10819 4.73108 6.89184 4.79634 6.69099C4.87053 6.46267 5.06854 6.26466 5.46455 5.86864L5.86848 5.46472Z"
                stroke="#F9D312"
                stroke-width="1.33"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span className="text-base">2000</span>
          </div>
        </div>

        {/* Close Button */}
        <div
          onClick={handleClose}
          className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          aria-label="Close"
          title="Close"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>

      {/* Center Content Area - Now starts from top */}
      <div className={`flex-1 px-6 sm:px-10 md:px-16 pt-12 pb-2 flex justify-center ${
        projectEditor.currentStep === 'user_prompt' ? 'items-center' : 'items-start'
      }`}>
        <div className="w-full max-w-6xl">
          {projectEditor.currentStep === 'video_type_selection' && projectEditor.questionsData && (
            <div>
              <h1 className="text-white text-3xl sm:text-5xl font-bold mb-2 text-center">
                {greetingPrefix} <span className="text-[#94E7EDCC]">{displayName}</span>
              </h1>
              <h2 className="text-white/50 text-lg sm:text-xl font-semibold mb-6 text-center">
                Choose Your Video Type
              </h2>
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
                Let's bring <span className="text-[#94E7EDCC]">your idea to life!</span>
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

      {/* Progress Loader (visible during preference questions) */}
      {!showStoryArc &&
        projectEditor.currentStep === 'preference_questions' &&
        projectEditor.questionsData && (
          <div className="absolute bottom-[9rem] left-0 right-0 px-4 z-10">
            <div className="w-full max-w-[54rem] mx-auto">
              <div
                className={`w-full h-1 rounded-full overflow-hidden ${
                  Object.keys(projectEditor.preferenceAnswers || {}).length > 0
                    ? 'bg-[#f9d21229]'
                    : 'bg-gray-700'
                }`}
              >
                <div
                  className="h-full bg-yellow-400 transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      (Object.keys(projectEditor.preferenceAnswers || {}).length /
                        Object.keys(projectEditor.questionsData?.preference_questions || {}).length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

      {/* Bottom Centered Input (visible throughout the flow until Generate Script) */}
      {!showStoryArc && (
        <div className="absolute -bottom-4 left-0 right-0 px-4 py-6 pb-6 flex items-center justify-center z-9">
          <div className="w-full max-w-4xl">
            <div className="bg-gradient-to-t from-[#20272B]/50 to-[#000000]/30 rounded-2xl border-1 border-white/20 p-6 backdrop-blur-sm opacity-90">
              {/* Input Row */}
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePromptSubmit()}
                  placeholder={
                    projectEditor.currentStep === 'video_type_selection'
                      ? 'Choose a video type above, then describe what you want to create...'
                      : projectEditor.currentStep === 'preference_questions'
                      ? 'Answer the questions above, or add more details about your video...'
                      : 'Describe what you want to create...'
                  }
                  disabled={projectEditor.currentStep !== 'user_prompt'}
                  className={`flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base ${
                    projectEditor.currentStep !== 'user_prompt'
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                />
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between">
                {/* Left - Simple Label */}
                <div className="flex items-center">
                  <div className="bg-white/5 text-[#94E7ED] rounded-lg px-3 py-2">
                    GPT-5
                  </div>
                </div>

                {/* Right - 4 Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Button 1 */}
                  <div className="text-white p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer hover:bg-white/10">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.65672 7.66653C1.84209 4.18611 4.84136 1.49015 8.32179 1.67552C11.7775 1.85957 14.4925 4.55018 14.3468 7.60626C14.244 9.53695 12.5751 11.0365 10.6444 10.9336C10.0212 10.9004 9.13813 10.6585 8.61345 11.1301C8.2086 11.494 8.13567 12.1786 8.50886 12.5923C9.05439 13.2782 8.56707 14.3806 7.64773 14.3316C4.16731 14.1462 1.47135 11.1469 1.65672 7.66653Z"
                        stroke="#7E7E80"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M4.31908 7.33317C4.31908 6.96498 4.61755 6.6665 4.98574 6.6665C5.35393 6.6665 5.65241 6.96498 5.65241 7.33317C5.65241 7.70136 5.35393 7.99984 4.98574 7.99984C4.61755 7.99984 4.31908 7.70136 4.31908 7.33317Z"
                        stroke="#7E7E80"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M7.49927 4.84163C7.49927 4.47344 7.79774 4.17497 8.16593 4.17497C8.53412 4.17497 8.8326 4.47344 8.8326 4.84163C8.8326 5.20982 8.53412 5.5083 8.16593 5.5083C7.79774 5.5083 7.49927 5.20982 7.49927 4.84163Z"
                        stroke="#7E7E80"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M10.4823 7.33317C10.4823 6.96498 10.7808 6.6665 11.149 6.6665C11.5172 6.6665 11.8157 6.96498 11.8157 7.33317C11.8157 7.70136 11.5172 7.99984 11.149 7.99984C10.7808 7.99984 10.4823 7.70136 10.4823 7.33317Z"
                        stroke="#7E7E80"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Button 2 */}
                  <div className="text-white p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer hover:bg-white/10">
                    <svg
                      width="16"
                      height="14"
                      viewBox="0 0 14 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.66675 5H8.00008M1.66675 9H5.66675M1.66675 1H12.3334M8.33341 10.3333H8.34008M11.0001 5.66667C10.5751 6.74431 10.1073 7.22997 9.00008 7.66667C10.1073 8.10336 10.5751 8.58903 11.0001 9.66667C11.4251 8.58902 11.8928 8.10336 13.0001 7.66667C11.8928 7.22997 11.4251 6.74431 11.0001 5.66667Z"
                        stroke="white"
                        stroke-opacity="0.5"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Button 3 */}
                  <div className="text-white p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer hover:bg-white/10">
                    <svg
                      width="14"
                      height="18"
                      viewBox="0 0 12 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.9832 8.52082L8.60972 12.6318C7.48616 14.5778 4.99774 15.2446 3.05167 14.121C1.1056 12.9975 0.438832 10.5091 1.56239 8.56298L4.95304 2.69021C5.70208 1.39283 7.36104 0.948316 8.65841 1.69736C9.95579 2.4464 10.4003 4.10535 9.65126 5.40273L6.26061 11.2755C5.88609 11.9242 5.05662 12.1464 4.40793 11.7719C3.75924 11.3974 3.53698 10.5679 3.9115 9.91924L6.96309 4.63375"
                        stroke="white"
                        stroke-opacity="0.5"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Button 4 - Send */}
                  <div
                    onClick={
                      projectEditor.currentStep === 'user_prompt'
                        ? handlePromptSubmit
                        : undefined
                    }
                    disabled={!inputValue.trim() || projectEditor.currentStep !== 'user_prompt'}
                    className={`text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 hover:bg-white/10 ${
                      projectEditor.currentStep === 'user_prompt'
                        ? 'cursor-pointer'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.35939 8.64061L1.70896 6.64974C0.756266 6.13016 0.765709 4.76045 1.72538 4.26722C4.37188 2.90704 7.18598 1.89704 10.0973 1.26249C10.9332 1.08029 11.8885 0.70889 12.5898 1.41018C13.2911 2.11147 12.9197 3.06683 12.7375 3.90275C12.103 6.81403 11.093 9.62812 9.73278 12.2746C9.23955 13.2343 7.86984 13.2437 7.35026 12.291L5.35939 8.64061ZM5.35939 8.64061L7.56513 6.43487"
                        stroke="#94E7ED"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Avatar - Bottom Left */}
      {user?.email && (
        <div className="absolute bottom-6 left-6 z-10 flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
            <span className="text-black font-semibold text-lg">
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <svg
            width="22"
            height="22"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.07077 8.19228L8.14166 8.14169M8.14166 8.14169L15.2125 8.09109M8.14166 8.14169L8.09106 1.0708M8.14166 8.14169L8.19226 15.2126"
              stroke="white"
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            width="22"
            height="22"
            viewBox="0 0 15 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.72554 1.07764C1.45221 2.12273 1.31561 3.19843 1.31882 4.2778C1.31967 4.55966 1.55547 4.6508 1.78517 4.70164L1.78697 4.70204M4.83628 4.99214C3.81119 5.02083 2.78708 4.92325 1.78697 4.70204M1.78697 4.70204C2.78677 3.11579 4.4462 1.95835 6.44625 1.6604C10.088 1.11789 13.4799 3.63028 14.0225 7.27199C14.565 10.9137 12.0526 14.3057 8.41086 14.8482C4.9002 15.3712 1.62163 13.0552 0.904175 9.62529M9.16692 10.4998L7.74433 9.07725C7.58805 8.92097 7.50026 8.70901 7.50026 8.488V5.49984"
              stroke="white"
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ProjectEditor;
