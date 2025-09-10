import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ConceptSelection from "./ConceptSelection";
import ScriptSelection from "./ScriptSelection";
import MediaGeneration from "./MediaGeneration";
import TimelineButton from "./TimelineButton";
import VerboseAgentLoader from "./VerboseAgentLoader";


// Dynamic video generation component that always shows current state
const VideoGenerationComponent = ({
  chatFlow,
  combinedVideosMap,
  onVideoClick,
  onAddSingleVideo,
}) => {
  const hasVideos = Object.keys(combinedVideosMap || {}).length > 0;
  const isGeneratingVideos = chatFlow.loading && chatFlow.selectedScript && Object.keys(chatFlow.generatedVideos || {}).length === 0;

  console.log('VideoGenerationComponent render:', { 
    hasVideos, 
    isGeneratingVideos, 
    combinedVideosCount: Object.keys(combinedVideosMap || {}).length,
    loading: chatFlow.loading
  });

  return (
    <div>
      <div className='text-gray-100 text-sm mb-4'>
        {isGeneratingVideos
          ? "Processing..."
          : hasVideos
          ? "Generated Videos:"
          : "Ready to generate videos"}
      </div>
      <MediaGeneration
        type='video'
        combinedVideosMap={combinedVideosMap || {}}
        generationProgress={chatFlow.generationProgress}
        onVideoClick={onVideoClick}
        onAddSingleVideo={onAddSingleVideo}
        loading={isGeneratingVideos}
      />
    </div>
  );
};

const ChatMessages = ({
  chatFlow,
  onVideoClick,
  onAddSingleVideo,
  sendVideosToTimeline,
  combinedVideosMap,
  currentPrompt = "",
}) => {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  
  // State to track if concepts have been shown but not yet selected
  const [conceptsShownButNotSelected, setConceptsShownButNotSelected] = useState(false);
  const [scriptsShownButNotSelected, setScriptsShownButNotSelected] = useState(false);

  // Model selection state for approval box
  const [selectedApprovalModel, setSelectedApprovalModel] = useState("GPT-4o mini");
  const [isApprovalDropdownOpen, setIsApprovalDropdownOpen] = useState(false);
  const approvalDropdownRef = useRef(null);

  // Model data with token usage and time information (copied from InputArea)
  const modelData = {
    "gpt-2.5": { label: "Gemini 2.5 Flash", tokens: "5", time: "2" },
    "gemini-flash": { label: "Gemini Flash", tokens: "5", time: "2" },
    "gemini-pro": { label: "Gemini Pro", tokens: "4", time: "4" },
    "recraft-v3": { label: "Recraft", tokens: "1", time: "4" },
    imagen: { label: "Imagen", tokens: "2", time: "2" },
    "gen4_turbo": { label: "RunwayML", tokens: "2.5", time: "3" },
    "kling-v2.1-master": { label: "Kling", tokens: "20", time: "4" },
    "veo3": { label: "veo3", tokens: "37", time: "5" },
  };

  // Get available models based on approval tool type (updated for text-to-video workflow)
  const getAvailableModelsForApproval = useCallback((toolName) => {
    // Web research - only Gemini 2.5 Flash
    if (toolName === 'get_web_info') {
      return [{ value: "gpt-2.5", ...modelData["gpt-2.5"] }];
    }

    // Concept generation - only Gemini 2.5 Flash
    if (toolName === 'generate_concepts_with_approval') {
      return [{ value: "gpt-2.5", ...modelData["gpt-2.5"] }];
    }

    // Script generation after concept selection - Flash default, Pro option
    if (toolName === 'generate_segmentation') {
      return [
        { value: "gemini-flash", ...modelData["gemini-flash"] },
        { value: "gemini-pro", ...modelData["gemini-pro"] },
      ];
    }

    // Video generation after script selection - veo3 default, Runway and Kling options
    if (toolName === 'generate_video_with_approval') {
      return [
        { value: "veo3", ...modelData["veo3"] },
        { value: "gen4_turbo", ...modelData["gen4_turbo"] },
        { value: "kling-v2.1-master", ...modelData["kling-v2.1-master"] },
      ];
    }

    // Default models for other cases
    return [{ value: "gpt-2.5", ...modelData["gpt-2.5"] }];
  }, [modelData]);

  // Handle model selection for approval
  const handleApprovalModelSelect = (modelValue) => {
    setSelectedApprovalModel(modelValue);
    setIsApprovalDropdownOpen(false);

    // Update chatFlow immediately when model changes (updated for text-to-video workflow)
    if (chatFlow) {
      if (modelValue === "veo3") {
        chatFlow.setSelectedVideoModel("veo3");
      } else if (modelValue === "gen4_turbo") {
        chatFlow.setSelectedVideoModel("gen4_turbo");
      } else if (modelValue === "kling-v2.1-master") {
        chatFlow.setSelectedVideoModel("kling-v2.1-master");
      } else if (modelValue === "gemini-pro") {
        chatFlow.setSelectedScriptModel("gemini-pro");
      } else if (modelValue === "gemini-flash") {
        chatFlow.setSelectedScriptModel("gemini-flash");
      } else if (modelValue === "gpt-2.5") {
        chatFlow.setSelectedConceptModel("gemini-2.0-flash-exp");
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (approvalDropdownRef.current && !approvalDropdownRef.current.contains(event.target)) {
        setIsApprovalDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set default model when approval appears
  useEffect(() => {
    if (chatFlow.pendingApprovals && chatFlow.pendingApprovals.length > 0) {
      const latestApproval = chatFlow.pendingApprovals[chatFlow.pendingApprovals.length - 1];
      const availableModels = getAvailableModelsForApproval(latestApproval.toolName);
      if (availableModels.length > 0) {
        setSelectedApprovalModel(availableModels[0].value);
      }
    }
  }, [chatFlow.pendingApprovals, getAvailableModelsForApproval]);

  // Track concept selection state
  useEffect(() => {
    // If concepts exist but no concept is selected, mark as shown but not selected
    if (chatFlow.concepts && chatFlow.concepts.length > 0 && !chatFlow.selectedConcept) {
      setConceptsShownButNotSelected(true);
    } 
    // If a concept is selected, clear the "shown but not selected" state
    else if (chatFlow.selectedConcept) {
      setConceptsShownButNotSelected(false);
    }
  }, [chatFlow.concepts, chatFlow.selectedConcept]);

  useEffect(() => {
    // If scripts exist but no script is selected, mark as shown but not selected
    if (chatFlow.scripts && (chatFlow.scripts.response1 || chatFlow.scripts.response2) && !chatFlow.selectedScript) {
      setScriptsShownButNotSelected(true);
    } 
    // If a script is selected, clear the "shown but not selected" state
    else if (chatFlow.selectedScript) {
      setScriptsShownButNotSelected(false);
    }
  }, [chatFlow.scripts, chatFlow.selectedScript]);


  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only auto-scroll when new messages are added, not when existing ones are updated
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [lastVideoCount, setLastVideoCount] = useState(0);

  useEffect(() => {
    // Only scroll if we actually added new messages (not just updated existing ones)
    if (messages.length > lastMessageCount) {
      scrollToBottom();
      setLastMessageCount(messages.length);
    }
  }, [messages.length, lastMessageCount]);

  // Auto-scroll when videos are added or updated
  useEffect(() => {
    const currentVideoCount = Object.keys(combinedVideosMap || {}).length;
    if (currentVideoCount > lastVideoCount) {
      console.log(`🎬 New videos detected (${currentVideoCount} vs ${lastVideoCount}), scrolling to bottom`);
      setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure content is rendered
      setLastVideoCount(currentVideoCount);
    }
  }, [combinedVideosMap, lastVideoCount]);

  // Listen for custom scroll events (from video completion, etc.)
  useEffect(() => {
    const handleScrollToBottom = (event) => {
      console.log('🔽 Received scroll to bottom event:', event.detail);
      setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure content is rendered
    };

    window.addEventListener('scrollChatToBottom', handleScrollToBottom);
    
    return () => {
      window.removeEventListener('scrollChatToBottom', handleScrollToBottom);
    };
  }, []);

  // Build messages in proper order based on chat flow state and real timestamps
  useEffect(() => {
    const orderedMessages = [];

    // Step 1: Add all real user/system messages from allUserMessages (with real timestamps)
    if (chatFlow.allUserMessages && chatFlow.allUserMessages.length > 0) {
      chatFlow.allUserMessages.forEach(msg => {
        orderedMessages.push({
          id: msg.id,
          type: msg.type || "system",
          content: msg.content,
          timestamp: msg.timestamp || Date.now(),
        });
      });
    }

    // Step 2: Add component-based messages with contextual timestamps based on related system messages
    
    // Find concept-related completion message timestamp
    const conceptCompletionMessage = chatFlow.allUserMessages?.find(msg => 
      msg.content.includes('Concept generation completed') || 
      msg.content.includes('concept generation') ||
      (msg.content.includes('generated') && msg.content.includes('concepts'))
    );
    
    // Add concept selection component - show if concepts exist OR if we're on step 1+
    if (chatFlow.concepts && chatFlow.concepts.length > 0) {
      const conceptTimestamp = conceptCompletionMessage ? conceptCompletionMessage.timestamp + 100 : Date.now();
      orderedMessages.push({
        id: "concept-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className='text-gray-100 text-sm mb-4'>
              {chatFlow.selectedConcept
                ? `✅ Selected Concept: "${chatFlow.selectedConcept.title}"`
                : "🎯 Please select a concept to continue:"}
            </div>
            <ConceptSelection
              concepts={chatFlow.concepts}
              onConceptSelect={(concept) => {
                chatFlow.handleConceptSelect(concept);
              }}
              selectedConcept={chatFlow.selectedConcept}
            />
          </div>
        ),
        timestamp: conceptTimestamp,
      });
    }

    // Find script-related completion message timestamp - look for any completion message after script approval
    const scriptApprovalMessage = chatFlow.allUserMessages?.find(msg => 
      msg.content.includes('Approved: Approved script generation')
    );
    
    const scriptCompletionMessage = chatFlow.allUserMessages?.find(msg => 
      msg.timestamp > (scriptApprovalMessage?.timestamp || 0) && 
      (msg.content.includes('Script generation completed') ||
       msg.content.includes('operation completed successfully') ||
       msg.content.includes('script generation') ||
       msg.content.includes('script segments') || 
       msg.content.includes('create script'))
    );

    // Add script selection component - show if scripts exist OR if we have a selectedScript (for old projects)
    // Always show 2 scripts: for new generation (unselected) or for history (one selected, one alternative)
    if ((chatFlow.scripts && (chatFlow.scripts.response1 || chatFlow.scripts.response2)) || 
        (chatFlow.selectedScript && chatFlow.selectedScript.segments)) {
      
      // Use the latest relevant completion message or fall back to current time
      // If no completion message, use a timestamp that ensures script appears after approval messages
      const scriptTimestamp = scriptCompletionMessage ? 
        scriptCompletionMessage.timestamp + 100 : 
        (scriptApprovalMessage ? scriptApprovalMessage.timestamp + 200 : Date.now() + 100);
      
      // Debug logging for script timestamp
      console.log('🔍 Script component timing:', {
        scriptApprovalMessage: scriptApprovalMessage?.content,
        scriptApprovalTimestamp: scriptApprovalMessage?.timestamp,
        scriptCompletionMessage: scriptCompletionMessage?.content,
        scriptCompletionTimestamp: scriptCompletionMessage?.timestamp,
        scriptTimestamp,
        hasScripts: !!(chatFlow.scripts && (chatFlow.scripts.response1 || chatFlow.scripts.response2))
      });
      
      orderedMessages.push({
        id: "script-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className='text-gray-100 text-sm mb-4'>
              {chatFlow.selectedScript
                ? `✅ Selected Script: "${chatFlow.selectedScript.segments?.length || 0} segments"`
                : "📜 Please select a script to continue:"}
            </div>
            <ScriptSelection
              scripts={chatFlow.scripts}
              onScriptSelect={(script, cardId) => {
                chatFlow.handleScriptSelect(script, cardId);
              }}
              selectedScript={chatFlow.selectedScript}
              isProjectScript={!chatFlow.scripts && !!chatFlow.selectedScript}
              selectedSegmentationId={(!chatFlow.scripts && !!chatFlow.selectedScript) ? 'project-script-1' : null}
            />
          </div>
        ),
        timestamp: scriptTimestamp,
      });
    }


    // Find video-related completion message timestamp
    const videoApprovalMessage = chatFlow.allUserMessages?.find(msg => 
      msg.content.includes('Approved: Approved video generation')
    );
    
    const videoCompletionMessage = chatFlow.allUserMessages?.find(msg => 
      msg.timestamp > (videoApprovalMessage?.timestamp || 0) && 
      (msg.content.includes('Video generation completed') ||
       msg.content.includes('operation completed successfully') ||
       msg.content.includes('video generation') ||
       (msg.content.includes('generated') && msg.content.includes('videos')))
    );

    // Add video generation component - show if we have a selectedScript OR if we have generated videos (for old projects)
    if ((chatFlow.selectedScript && chatFlow.selectedScript.segments) || 
        Object.keys(chatFlow.generatedVideos || {}).length > 0 ||
        Object.keys(chatFlow.storedVideosMap || {}).length > 0) {
      const videoTimestamp = videoCompletionMessage ? videoCompletionMessage.timestamp + 100 : Date.now();
      orderedMessages.push({
        id: "video-generation",
        type: "system",
        content: "",
        component: (
          <VideoGenerationComponent
            chatFlow={chatFlow}
            combinedVideosMap={combinedVideosMap}
            onVideoClick={onVideoClick}
            onAddSingleVideo={onAddSingleVideo}
          />
        ),
        timestamp: videoTimestamp,
      });
    }

    // Add timeline integration component
    const canSendTimeline =
      Object.keys(chatFlow.generatedVideos || {}).length > 0 ||
      Object.keys(chatFlow.storedVideosMap || {}).length > 0 ||
      Object.keys(combinedVideosMap || {}).length > 0;

    if (canSendTimeline) {
      const timelineTimestamp = videoCompletionMessage ? videoCompletionMessage.timestamp + 100 : Date.now();
      orderedMessages.push({
        id: "timeline-integration",
        type: "system",
        content: "",
        component: (
          <div>
            <TimelineButton
              canSendTimeline={canSendTimeline}
              addingTimeline={chatFlow.addingTimeline}
              onSendToTimeline={sendVideosToTimeline}
              inConversation={true}
            />
          </div>
        ),
        timestamp: timelineTimestamp,
      });
    }

    // Sort all messages by timestamp to ensure chronological order
    const sortedMessages = orderedMessages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Debug logging for message ordering
    console.log('📝 Message ordering debug:', {
      allMessages: orderedMessages.map(msg => ({
        id: msg.id,
        content: msg.content?.substring(0, 50) + (msg.content?.length > 50 ? '...' : ''),
        timestamp: msg.timestamp,
        type: msg.type
      })),
      sortedOrder: sortedMessages.map(msg => ({
        id: msg.id,
        content: msg.content?.substring(0, 50) + (msg.content?.length > 50 ? '...' : ''),
        timestamp: msg.timestamp
      }))
    });
    
    // Only update if there are actual changes
    setMessages(sortedMessages);
    
    // 🎯 AUTO-SCROLL: If we have new video content, scroll to bottom
    const hasVideos = Object.keys(combinedVideosMap || {}).length > 0;
    if (hasVideos && sortedMessages.some(msg => msg.id === "video-generation" || msg.id === "timeline-integration")) {
      setTimeout(() => {
        scrollToBottom();
      }, 200); // Delay to ensure video components are rendered
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chatFlow.allUserMessages, // Now using real messages with timestamps
    chatFlow.concepts,
    chatFlow.selectedConcept,
    chatFlow.scripts,
    chatFlow.selectedScript,
    chatFlow.generatedVideos,
    chatFlow.storedVideosMap,
    chatFlow.addingTimeline,
    combinedVideosMap,
    currentPrompt,
    onVideoClick,
    onAddSingleVideo,
    sendVideosToTimeline,
  ]);

  return (
    <div className='flex-1 overflow-y-auto p-3 space-y-3'>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.type === "user" ? "justify-end items-end" : "justify-start items-start"
          } `}
        >
          <div
            className={`${
              message.id === "concept-request" ||
              message.id === "script-request" ||
              message.id === "video-generation" ||
              message.id === "timeline-integration"
                ? "w-full p-0" // Full width and no padding/background for component messages
                : `max-w-[80%] p-2.5 text-white rounded-lg backdrop-blur-sm ${ 
                    message.type === "user" 
                      ? "bg-[#FFFFFF1A]" 
                      : "bg-[#0A0A0A80] border-1 border-gray-700/30"
                  }`
            }`}
          >
            {message.content && (
              <div className='text-sm'>{message.content}</div>
            )}
            {message.component && (
              <div>
                {message.component}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Simple Loading indicator - only show when NOT streaming */}
      {chatFlow.loading && !chatFlow.isStreaming && (
        <div className='flex justify-start'>
          <div className='text-gray-100 rounded-lg p-2.5 backdrop-blur-sm bg-[#0A0A0A80] border-1 border-gray-700/30'>
            <div className='flex items-center space-x-2'>
              <div className='relative w-4 h-4'>
                <div className='absolute inset-0 rounded-full border-2 border-gray-600'></div>
                <div className='absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin'></div>
              </div>
              <div className='flex flex-col'>
                <span className='text-xs text-gray-100'>
                  {chatFlow.agentActivity || 'Processing...'}
                </span>
                {chatFlow.streamingProgress && (
                  <span className='text-xs text-gray-400 mt-1'>
                    {chatFlow.streamingProgress.step && `Step: ${chatFlow.streamingProgress.step}`}
                    {chatFlow.streamingProgress.progress && ` (${chatFlow.streamingProgress.progress})`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Deduction Notification */}
      {chatFlow.creditDeductionMessage && (
        <div className='flex justify-start'>
          <div className='text-green-100 rounded-lg p-2.5 max-w-[80%] bg-green-500/10 backdrop-blur-sm border border-green-500/30'>
            <div className='flex items-center gap-2 text-xs'>
              <span>💰</span>
              <span>{chatFlow.creditDeductionMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {chatFlow.error && (
        <div className='flex justify-start'>
          <div className='text-gray-100 rounded-lg p-2.5 max-w-[80%] bg-[#0A0A0A80] backdrop-blur-sm border-1 border-red-700/30'>
            <div className='text-xs'>❌ {chatFlow.error}</div>
            <button
              onClick={() => chatFlow.setError(null)}
              className='mt-1 text-xs text-gray-300 hover:text-gray-100 underline'
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Agent Status and Approvals */}
      {(chatFlow.isStreaming || (chatFlow.pendingApprovals && chatFlow.pendingApprovals.length > 0)) && (
        <div className='flex justify-start'>
          <div className='max-w-[80%] p-2.5 text-gray-100 rounded-lg backdrop-blur-sm bg-[#0A0A0A80] border-1 border-gray-700/30'>
            {/* Enhanced Agent Working Indicator - Primary loader during streaming - Only show after script selection */}
            {chatFlow.isStreaming && !conceptsShownButNotSelected && !scriptsShownButNotSelected && (
              <VerboseAgentLoader 
                agentActivity={chatFlow.agentActivity}
                streamingProgress={chatFlow.streamingProgress}
                streamMessages={chatFlow.streamMessages}
              />
            )}

            {/* Manual Approval Requests - Only show after script selection */}
            {chatFlow.pendingApprovals && !conceptsShownButNotSelected && !scriptsShownButNotSelected && chatFlow.pendingApprovals.map((approval) => {
              const availableModels = getAvailableModelsForApproval(approval.toolName);
              const currentModelData = availableModels.find((model) => model.value === selectedApprovalModel) || availableModels[0];
              
              return (
                <div key={approval.id} className='mb-3 last:mb-0'>
                  <div 
                    className='rounded-lg overflow-hidden border-1 border-gray-600/40 hover:border-gray-500/60 bg-white/10 p-3 transition-all duration-300'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='text-white font-bold text-sm'>
                        Approval Required
                      </div>
                      <div className='bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded text-xs'>
                        Waiting
                      </div>
                    </div>
                    
                    <div className='text-gray-300 text-xs mb-3 leading-relaxed'>
                      {approval.toolName === 'get_web_info' && (
                        <div>
                          <div className='mb-2 text-cyan-300 font-medium'>Web Research Request</div>
                          <div>I need permission to research web information for your prompt. This will help me understand current trends, gather relevant data, and provide more accurate and up-to-date concepts.</div>
                        </div>
                      )}
                      {approval.toolName === 'generate_concepts_with_approval' && (
                        <div>
                          <div className='mb-2 text-cyan-300 font-medium'>Concept Generation Ready</div>
                          <div>I'm ready to generate 4 unique content concepts based on the research. Each concept will include a title, description, and creative direction tailored to your request.</div>
                        </div>
                      )}
                      {approval.toolName === 'generate_segmentation' && (
                        <div>
                          <div className='mb-2 text-cyan-300 font-medium'>Script Creation Ready</div>
                          <div>I can now create detailed script segmentation for the selected concept. This will break down your content into scenes with visual descriptions, narration, and animation prompts.</div>
                        </div>
                      )}
                      {approval.toolName === 'generate_video_with_approval' && (
                        <div>
                          <div className='mb-2 text-cyan-300 font-medium'>Video Generation Ready</div>
                          <div>I'm ready to create dynamic videos from your script segments. This will generate engaging video content based on your selected script.</div>
                        </div>
                      )}
                    </div>

                    {/* Model Selection - Only show if there are multiple models available */}
                    {availableModels.length > 1 && (
                      <div className='mb-3'>
                        <div className='text-gray-300 text-xs mb-2 font-medium'>Select Model:</div>
                        <div className='relative' ref={approvalDropdownRef}>
                          <button
                            type='button'
                            onClick={() => setIsApprovalDropdownOpen(!isApprovalDropdownOpen)}
                            className='text-gray-300 text-xs px-2 py-1 rounded-md focus:outline-none transition-all duration-200 cursor-pointer flex items-center justify-between w-full overflow-hidden'
                            style={{
                              background: "rgba(24, 25, 28, 0.6)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              backdropFilter: "blur(5px)",
                              minWidth: "140px",
                              maxWidth: "100%",
                            }}
                          >
                            <span className='truncate'>
                              <span className='hidden sm:inline'>
                                {currentModelData?.label} | {currentModelData?.tokens}{" "}
                                Token | ~{currentModelData?.time}s
                              </span>
                              <span className='sm:hidden'>{currentModelData?.label}</span>
                            </span>
                            <svg
                              className={`ml-1 sm:ml-2 flex-shrink-0 transition-transform duration-200 ${
                                isApprovalDropdownOpen ? "rotate-180" : ""
                              }`}
                              width='10'
                              height='10'
                              viewBox='0 0 20 20'
                              fill='none'
                            >
                              <path
                                stroke='#6b7280'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='1.5'
                                d='M6 8l4 4 4-4'
                              />
                            </svg>
                          </button>

                          {/* Custom Dropdown Menu - Opens Upward */}
                          {isApprovalDropdownOpen && (
                            <div
                              className='absolute z-50 w-full rounded-lg shadow-lg overflow-hidden'
                              style={{
                                bottom: "calc(100% + 8px)", // Position above the button
                                background: "rgba(30, 30, 34, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                backdropFilter: "blur(10px)",
                                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                                minWidth: "200px",
                              }}
                            >
                              {availableModels.map((model) => (
                                <div
                                  key={model.value}
                                  onClick={() => handleApprovalModelSelect(model.value)}
                                  className='px-3 py-2 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between group'
                                  style={{
                                    background:
                                      selectedApprovalModel === model.value
                                        ? "rgba(59, 130, 246, 0.2)"
                                        : "transparent",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background =
                                      selectedApprovalModel === model.value
                                        ? "rgba(59, 130, 246, 0.3)"
                                        : "rgba(255, 255, 255, 0.05)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background =
                                      selectedApprovalModel === model.value
                                        ? "rgba(59, 130, 246, 0.2)"
                                        : "transparent";
                                  }}
                                >
                                  <div className='flex items-center space-x-3'>
                                    <span className='text-gray-200 text-sm font-medium'>
                                      {model.label}
                                    </span>
                                  </div>
                                  <div className='flex items-center space-x-4 text-xs text-gray-400 mt-1 sm:mt-0'>
                                    <div className='flex items-center space-x-1'>
                                      <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                      >
                                        <path
                                          d='M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z'
                                          stroke='white'
                                          strokeOpacity='0.5'
                                          strokeWidth='1.33'
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                        />
                                        <path
                                          d='M6.86848 6.46472C7.2645 6.0687 7.4625 5.87069 7.69083 5.7965C7.89168 5.73124 8.10802 5.73124 8.30887 5.7965C8.53719 5.87069 8.7352 6.0687 9.13122 6.46472L9.53515 6.86864C9.93116 7.26466 10.1292 7.46267 10.2034 7.69099C10.2686 7.89184 10.2686 8.10819 10.2034 8.30903C10.1292 8.53736 9.93116 8.73537 9.53515 9.13138L9.13122 9.53531C8.7352 9.93132 8.53719 10.1293 8.30887 10.2035C8.10802 10.2688 7.89168 10.2688 7.69083 10.2035C7.4625 10.1293 7.2645 9.93132 6.86848 9.53531L6.46455 9.13138C6.06854 8.73537 5.87053 8.53736 5.79634 8.30903C5.73108 8.10819 5.73108 7.89184 5.79634 7.69099C5.87053 7.46267 6.06854 7.26466 6.46455 6.86864L6.86848 6.46472Z'
                                          stroke='white'
                                          strokeOpacity='0.5'
                                          strokeWidth='1.33'
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                        />
                                      </svg>
                                      <span>{model.tokens}</span>
                                    </div>
                                    <div className='flex items-center space-x-1'>
                                      <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                      >
                                        <path
                                          d='M7.99984 5.33317V8.54413C7.99984 8.65809 8.05806 8.76416 8.15421 8.82535L9.99984 9.99984M14.0999 7.9999C14.0999 11.3688 11.3688 14.0999 7.9999 14.0999C4.63097 14.0999 1.8999 11.3688 1.8999 7.9999C1.8999 4.63097 4.63097 1.8999 7.9999 1.8999C11.3688 1.8999 14.0999 4.63097 14.0999 7.9999Z'
                                          stroke='white'
                                          strokeOpacity='0.5'
                                          strokeWidth='1.5'
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                        />
                                      </svg>
                                      <span>~{model.time}s</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className='flex gap-2'>
                      <button
                        onClick={() => {
                          console.log('📝 ChatMessages: Approve button clicked for approval:', approval.id);
                          console.log('📝 Available chatFlow.approveToolExecution:', typeof chatFlow.approveToolExecution);
                          chatFlow.approveToolExecution(approval.id);
                        }}
                        className='bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 px-3 py-1.5 rounded text-xs transition-colors font-medium'
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
