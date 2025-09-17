import { useState, useEffect } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import VideoGrid from "./VideoGrid";
import QuestionsFlow from "./QuestionsFlow";
import StoryArcEngine from "./StoryArc";
import { assets } from "../../assets/assets";
import { questionsApi } from "../../services/questions";

const ProjectEditor = () => {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const projectEditor = useProjectStore((state) => state.projectEditor);
  const setProjectEditorStep = useProjectStore(
    (state) => state.setProjectEditorStep,
  );
  const setQuestionsData = useProjectStore((state) => state.setQuestionsData);
  const setVideoTypeSelection = useProjectStore(
    (state) => state.setVideoTypeSelection,
  );
  const setUserPrompt = useProjectStore((state) => state.setUserPrompt);
  const setPreferenceAnswer = useProjectStore(
    (state) => state.setPreferenceAnswer,
  );
  const setChatMessages = useProjectStore((state) => state.setChatMessages);
  const resetProjectEditor = useProjectStore(
    (state) => state.resetProjectEditor,
  );
  const clearProjectEditorAfterSave = useProjectStore(
    (state) => state.clearProjectEditorAfterSave,
  );

  const [inputValue, setInputValue] = useState("");
  const [showStoryArc, setShowStoryArc] = useState(false);
  const [storyArcIn, setStoryArcIn] = useState(false);

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
        type: "bot",
        content:
          "Hi! Let's create something amazing together. First, what type of video would you like to make?",
        timestamp: new Date(),
      },
    ]);
    setProjectEditorStep("video_type_selection");
  };

  const fetchQuestions = async () => {
    try {
      const data = await questionsApi.getQuestions();
      setQuestionsData(data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };

  const handleVideoTypeSelect = (videoType) => {
    setVideoTypeSelection(videoType);
    setChatMessages([
      ...projectEditor.chatMessages,
      {
        id: projectEditor.chatMessages.length + 1,
        type: "bot",
        content: `Great choice! Now, what would you like to create with ${videoType.description.toLowerCase()}?`,
        timestamp: new Date(),
      },
    ]);
    setProjectEditorStep("user_prompt");
  };

  const handlePromptSubmit = () => {
    if (!inputValue.trim()) return;

    setUserPrompt(inputValue);
    setChatMessages([
      ...projectEditor.chatMessages,
      {
        id: projectEditor.chatMessages.length + 1,
        type: "user",
        content: inputValue,
        timestamp: new Date(),
      },
      {
        id: projectEditor.chatMessages.length + 2,
        type: "bot",
        content:
          "Perfect! Now let me ask you a few questions to customize your video.",
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
    setProjectEditorStep("preference_questions");
  };

  const handlePreferenceAnswer = async (questionKey, answer) => {
    setPreferenceAnswer(questionKey, answer);

    const questionKeys = Object.keys(
      projectEditor.questionsData?.preference_questions || {},
    );
    const isLastQuestion =
      Object.keys(projectEditor.preferenceAnswers).length + 1 ===
      questionKeys.length;
    // Do not auto-transition here; the QuestionsFlow will show a "Generate Script" CTA after 5th answer
    // Intentionally do nothing here to avoid sidebar message; CTA appears in main area
    if (isLastQuestion) {
    }
  };

  const saveVideoPreferences = async (allAnswers) => {
    try {
      if (!selectedProject?.id) {
        console.error("No project selected");
        return;
      }

      // Map the answers to the API format
      const preferences = {
        user_prompt: projectEditor.userPrompt,
        video_type: projectEditor.videoTypeSelection?.id || "talking_head",
        visual_style: allAnswers.visual_style || "cool_corporate",
        lighting_mood: allAnswers.mood_tone || "bright_minimal",
        camera_style: allAnswers.camera_movement || "static_locked",
        subject_focus: allAnswers.subject_focus || "person_vr",
        location_environment: allAnswers.environment_space || "minimal_room",
      };

      console.log("Saving video preferences:", preferences);

      const result = await questionsApi.createVideoPreferences(
        selectedProject.id,
        preferences,
      );
      console.log("Video preferences saved successfully:", result);

      // Clear the project editor state after successful save
      clearProjectEditorAfterSave();

      setChatMessages([
        ...projectEditor.chatMessages,
        {
          id: projectEditor.chatMessages.length + 2,
          type: "bot",
          content:
            "Perfect! Your video preferences have been saved. Your video is now being created...",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to save video preferences:", error);
      setChatMessages([
        ...projectEditor.chatMessages,
        {
          id: projectEditor.chatMessages.length + 2,
          type: "bot",
          content:
            "There was an issue saving your preferences, but I'll still create your video with the information provided.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleGenerateScript = async () => {
    const allAnswers = { ...projectEditor.preferenceAnswers };
    await saveVideoPreferences(allAnswers);
    setShowStoryArc(true);
  };

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent("projectEditor:close"));
  };

  if (!selectedProject) {
    return (
      <div className='w-full h-screen bg-black flex items-center justify-center'>
        <div className='text-white text-xl'>No project selected</div>
      </div>
    );
  }

  // Show StoryArc when completed
  if (showStoryArc) {
    return (
      <div className={`w-full h-screen bg-black overflow-hidden`}>
        <div
          className={`w-full h-full transform transition-transform duration-500 ease-out ${
            storyArcIn ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <StoryArcEngine />
        </div>
      </div>
    );
  }

  return (
    <div className='w-full h-screen bg-black flex flex-col relative'>
      {/* Absolute positioned header elements */}
      <div className='absolute top-6 left-6 z-10 flex items-center gap-3'>
        <img src={assets.SandBoxLogo} alt='Usuals.ai' className='w-10 h-10' />
        <div className='flex flex-col'>
          <h1 className='text-2xl text-white font-semibold'>Usuals</h1>
        </div>
      </div>

      {/* Top Right Buttons */}
      <div className='absolute top-6 right-6 z-10 flex items-center gap-3'>
        {/* Chat Button */}
        <button
          className='text-gray-400 hover:text-white transition-colors'
          aria-label='Chat'
          title='Chat'
        >
          <div className='flex gap-2'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M8.57731 5.76368C9.037 4.87064 9.26685 4.42412 9.57563 4.27944C9.84446 4.15348 10.1554 4.15348 10.4242 4.27944C10.733 4.42412 10.9628 4.87064 11.4225 5.76368L12.6142 8.07877C12.6938 8.23349 12.7337 8.31085 12.7852 8.37917C12.8309 8.43981 12.8834 8.49505 12.9416 8.54381C13.0072 8.59874 13.0824 8.64245 13.2329 8.72989L15.6193 10.1166C16.4012 10.571 16.7921 10.7982 16.9236 11.0943C17.0382 11.3526 17.0382 11.6474 16.9236 11.9057C16.7921 12.2018 16.4012 12.429 15.6193 12.8834L13.2329 14.2701C13.0824 14.3575 13.0072 14.4013 12.9416 14.4562C12.8834 14.505 12.8309 14.5602 12.7852 14.6208C12.7337 14.6891 12.6938 14.7665 12.6142 14.9212L11.4225 17.2363C10.9628 18.1294 10.733 18.5759 10.4242 18.7206C10.1554 18.8465 9.84446 18.8465 9.57563 18.7206C9.26685 18.5759 9.037 18.1294 8.57731 17.2363L7.38563 14.9212C7.30598 14.7665 7.26616 14.6891 7.21465 14.6208C7.16892 14.5602 7.11644 14.505 7.05821 14.4562C6.99261 14.4013 6.91738 14.3575 6.76692 14.2701L4.38054 12.8834C3.59863 12.429 3.20768 12.2018 3.07623 11.9057C2.96157 11.6474 2.96157 11.3526 3.07623 11.0943C3.20768 10.7982 3.59863 10.571 4.38054 10.1166L6.76692 8.72989C6.91738 8.64245 6.99261 8.59874 7.05821 8.54381C7.11644 8.49505 7.16892 8.43981 7.21465 8.37917C7.26616 8.31085 7.30598 8.23349 7.38563 8.07877L8.57731 5.76368Z'
                stroke='white'
                stroke-opacity='0.5'
                stroke-width='2'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
              <path
                d='M17.4594 19.4062C17.2057 19.089 17.0788 18.9304 17.0313 18.7475C16.9895 18.5866 16.9895 18.4134 17.0313 18.2525C17.0788 18.0696 17.2057 17.911 17.4594 17.5938L18.275 16.5744C18.5287 16.2572 18.6556 16.0986 18.8019 16.0392C18.9306 15.9869 19.0692 15.9869 19.1979 16.0392C19.3442 16.0986 19.4711 16.2572 19.7248 16.5744L20.5404 17.5938C20.7941 17.911 20.921 18.0696 20.9685 18.2525C21.0104 18.4134 21.0104 18.5866 20.9685 18.7475C20.921 18.9304 20.7941 19.089 20.5404 19.4062L19.7248 20.4256C19.4711 20.7428 19.3442 20.9014 19.1979 20.9608C19.0692 21.0131 18.9306 21.0131 18.8019 20.9608C18.6556 20.9014 18.5287 20.7428 18.275 20.4256L17.4594 19.4062Z'
                stroke='white'
                stroke-opacity='0.5'
                stroke-width='2'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
              <path
                d='M18.2297 4.36247C18.1028 4.23559 18.0394 4.17215 18.0156 4.099C17.9947 4.03466 17.9947 3.96534 18.0156 3.901C18.0394 3.82785 18.1028 3.76441 18.2297 3.63753L18.6374 3.22976C18.7643 3.10289 18.8278 3.03945 18.9009 3.01568C18.9653 2.99477 19.0346 2.99477 19.0989 3.01568C19.1721 3.03945 19.2355 3.10289 19.3624 3.22976L19.7701 3.63753C19.897 3.76441 19.9605 3.82785 19.9842 3.901C20.0051 3.96534 20.0051 4.03466 19.9842 4.099C19.9605 4.17215 19.897 4.23559 19.7701 4.36247L19.3624 4.77024C19.2355 4.89711 19.1721 4.96055 19.0989 4.98432C19.0346 5.00523 18.9653 5.00523 18.9009 4.98432C18.8278 4.96055 18.7643 4.89711 18.6374 4.77024L18.2297 4.36247Z'
                stroke='white'
                stroke-opacity='0.5'
                stroke-width='2'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
            </svg>
            <p>Chat</p>
          </div>
        </button>

        {/* Credits Button */}
        <button
          className='text-gray-400 hover:text-white transition-colors'
          aria-label='Credits'
          title='Credits'
        >
          <div className='flex gap-2'>
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z'
                stroke='#F9D312'
                stroke-width='1.33'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
              <path
                d='M6.86848 6.46472C7.2645 6.0687 7.4625 5.87069 7.69083 5.7965C7.89168 5.73124 8.10802 5.73124 8.30887 5.7965C8.53719 5.87069 8.7352 6.0687 9.13122 6.46472L9.53515 6.86864C9.93116 7.26466 10.1292 7.46267 10.2034 7.69099C10.2686 7.89184 10.2686 8.10819 10.2034 8.30903C10.1292 8.53736 9.93116 8.73537 9.53515 9.13138L9.13122 9.53531C8.7352 9.93132 8.53719 10.1293 8.30887 10.2035C8.10802 10.2688 7.89168 10.2688 7.69083 10.2035C7.4625 10.1293 7.2645 9.93132 6.86848 9.53531L6.46455 9.13138C6.06854 8.73537 5.87053 8.53736 5.79634 8.30903C5.73108 8.10819 5.73108 7.89184 5.79634 7.69099C5.87053 7.46267 6.06854 7.26466 6.46455 6.86864L6.86848 6.46472Z'
                stroke='#F9D312'
                stroke-width='1.33'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
            </svg>
            <p>2000</p>
          </div>
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className='text-gray-400 hover:text-white transition-colors'
          aria-label='Close'
          title='Close'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>

      {/* Center Content Area - Now starts from top */}
      <div
        className={`flex-1 px-6 sm:px-10 md:px-16 pt-12 pb-2 flex justify-center ${
          projectEditor.currentStep === "user_prompt"
            ? "items-center"
            : "items-start"
        }`}
      >
        <div className='w-full max-w-6xl'>
          {projectEditor.currentStep === "video_type_selection" &&
            projectEditor.questionsData && (
              <div>
                <h2 className='text-white text-2xl font-semibold mb-8 text-center'>
                  Choose Your Video Type
                </h2>
                <VideoGrid
                  options={Object.entries(
                    projectEditor.questionsData.video_type_selection,
                  ).map(([key, value]) => ({
                    id: key,
                    ...value,
                  }))}
                  onSelect={handleVideoTypeSelect}
                  selectedId={projectEditor.videoTypeSelection?.id}
                  compact
                />
              </div>
            )}

          {projectEditor.currentStep === "user_prompt" && (
            <div className='text-center'>
              <h2 className='text-white text-7xl font-bold mb-6'>
                Let's bring your idea to life!
              </h2>
              <p className='text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed'>
                Describe your idea in detail below for better video generation
                and understanding. The more specific you are, the better we can
                create exactly what you envision.
              </p>
            </div>
          )}

          {projectEditor.currentStep === "preference_questions" &&
            projectEditor.questionsData && (
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
        <div className='w-full px-4 py-6 pb-6 flex items-center justify-center'>
          <div className='w-full max-w-4xl'>
            <div className='bg-gradient-to-t from-[#20272B] to-[#000000] rounded-2xl border-1 border-white/30 p-4'>
              <div className='flex items-center gap-4'>
                <input
                  type='text'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handlePromptSubmit()}
                  placeholder={
                    projectEditor.currentStep === "video_type_selection"
                      ? "Choose a video type above, then describe what you want to create..."
                      : projectEditor.currentStep === "preference_questions"
                      ? "Answer the questions above, or add more details about your video..."
                      : "Describe what you want to create..."
                  }
                  disabled={projectEditor.currentStep !== "user_prompt"}
                  className={`flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base ${
                    projectEditor.currentStep !== "user_prompt"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                />
                <div
                  onClick={
                    projectEditor.currentStep === "user_prompt"
                      ? handlePromptSubmit
                      : undefined
                  }
                  disabled={
                    !inputValue.trim() ||
                    projectEditor.currentStep !== "user_prompt"
                  }
                  className={`text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 ${
                    projectEditor.currentStep === "user_prompt"
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <svg
                    width='28'
                    height='29'
                    viewBox='0 0 28 29'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <rect
                      y='0.5'
                      width='28'
                      height='28'
                      rx='6'
                      fill='white'
                      fillOpacity='0.1'
                    />
                    <path
                      d='M12.3594 16.1406L8.70896 14.1497C7.75627 13.6302 7.76571 12.2605 8.72538 11.7672C11.3719 10.407 14.186 9.39704 17.0973 8.76249C17.9332 8.58029 18.8885 8.20889 19.5898 8.91018C20.2911 9.61147 19.9197 10.5668 19.7375 11.4027C19.103 14.314 18.093 17.1281 16.7328 19.7746C16.2395 20.7343 14.8698 20.7437 14.3503 19.791L12.3594 16.1406ZM12.3594 16.1406L14.5651 13.9349'
                      stroke='white'
                      strokeOpacity='0.5'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
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
