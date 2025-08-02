import React from 'react';
import ChatHeader from './ChatHeader';
import ProjectBanner from './ProjectBanner';
import StepProgress from './StepProgress';
import ErrorDisplay from './ErrorDisplay';
import LoadingDisplay from './LoadingDisplay';
import ConceptSelection from './ConceptSelection';
import ScriptSelection from './ScriptSelection';
import SelectedContentDisplay from './SelectedContentDisplay';
import ModelSelection from './ModelSelection';
import GenerationProgress from './GenerationProgress';
import GeneratedContent from './GeneratedContent';
import TimelineActions from './TimelineActions';
import AuthMessages from './AuthMessages';
import ChatInput from './ChatInput';

// Custom styles for scrollbar and animation
const customStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.25);
    border-radius: 3px;
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(100, 100, 100, 0.4);
  }
  
  /* Prevent horizontal scrolling when sidebar is offscreen */
  html, body {
    overflow-x: hidden;
  }
`;

function ChatSidebar({
  open,
  // Header props
  showMenu,
  setShowMenu,
  isAuthenticated,
  showProjectHistory,
  setShowProjectHistory,
  setShowCharacterGenerator,
  openCreateModal,
  user,
  showUserMenu,
  setShowUserMenu,
  logout,
  onClose,
  onProjectSelect,
  // Project props
  selectedProject,
  // Step props
  steps,
  currentStep,
  stepStatus,
  loading,
  collapseSteps,
  setCollapseSteps,
  getStepIcon,
  isStepDisabled,
  onStepClick,
  onRedoStep,
  // Content props
  error,
  setError,
  concepts,
  selectedConcept,
  onConceptSelect,
  scripts,
  selectedScript,
  onScriptSelect,
  selectedImageModel,
  setSelectedImageModel,
  selectedVideoModel,
  setSelectedVideoModel,
  generationProgress,
  generatedImages,
  combinedVideosMap,
  onImageClick,
  onVideoClick,
  onAddToTimeline,
  // Timeline props
  canSendTimeline,
  addingTimeline,
  onSendVideosToTimeline,
  // Input props
  prompt,
  setPrompt,
  onSend,
  // Auth props
  onCreateProject
}) {
  return (
    <>
      <style>{customStyles}</style>
      <div
        className={`backdrop-blur-xl bg-white/20 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/40 shadow-lg rounded-2xl transition-all duration-300 ease-out fixed rounded-2xl mb-4 mr-4 bottom-0 right-0 h-[90vh] sm:h-[87vh] w-[90vw] sm:w-[360px] md:w-[25vw] max-w-[600px] text-white transform transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        } z-[10000] flex flex-col shadow-2xl`}
        style={{
          animation: 'slideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
      {/* Header */}
              <ChatHeader
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          isAuthenticated={isAuthenticated}
          showProjectHistory={showProjectHistory}
          setShowProjectHistory={setShowProjectHistory}
          setShowCharacterGenerator={setShowCharacterGenerator}
          openCreateModal={openCreateModal}
          user={user}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          logout={logout}
          onClose={onClose}
          onProjectSelect={onProjectSelect}
        />
      
      {/* Project banner */}
      {isAuthenticated && <ProjectBanner selectedProject={selectedProject} />}

      <div className='flex-1 overflow-hidden flex flex-col'>
        {/* 6 Steps */}
        <StepProgress
          steps={steps}
          currentStep={currentStep}
          stepStatus={stepStatus}
          loading={loading}
          collapseSteps={collapseSteps}
          setCollapseSteps={setCollapseSteps}
          getStepIcon={getStepIcon}
          isStepDisabled={isStepDisabled}
          onStepClick={onStepClick}
          onRedoStep={onRedoStep}
        />

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto p-4 custom-scrollbar'>
          <ErrorDisplay error={error} onClearError={() => setError(null)} />
          <LoadingDisplay loading={loading} />
          
          <ConceptSelection
            concepts={concepts}
            currentStep={currentStep}
            selectedConcept={selectedConcept}
            onConceptSelect={onConceptSelect}
          />
          
          <ScriptSelection
            scripts={scripts}
            currentStep={currentStep}
            selectedScript={selectedScript}
            onScriptSelect={onScriptSelect}
          />
          
          <SelectedContentDisplay
            selectedConcept={selectedConcept}
            selectedScript={selectedScript}
            currentStep={currentStep}
          />
          
          <ModelSelection
            currentStep={currentStep}
            selectedImageModel={selectedImageModel}
            setSelectedImageModel={setSelectedImageModel}
            selectedVideoModel={selectedVideoModel}
            setSelectedVideoModel={setSelectedVideoModel}
            loading={loading}
          />
          
          <GenerationProgress
            generationProgress={generationProgress}
            currentStep={currentStep}
          />
          
          <GeneratedContent
            generatedImages={generatedImages}
            combinedVideosMap={combinedVideosMap}
            currentStep={currentStep}
            selectedScript={selectedScript}
            onImageClick={onImageClick}
            onVideoClick={onVideoClick}
            onAddToTimeline={onAddToTimeline}
          />
          
          <TimelineActions
            canSendTimeline={canSendTimeline}
            addingTimeline={addingTimeline}
            onSendVideosToTimeline={onSendVideosToTimeline}
          />
          
          <AuthMessages
            isAuthenticated={isAuthenticated}
            selectedProject={selectedProject}
            onCreateProject={onCreateProject}
          />
        </div>

        {/* Input area */}
        <ChatInput
          isAuthenticated={isAuthenticated}
          selectedProject={selectedProject}
          prompt={prompt}
          setPrompt={setPrompt}
          loading={loading}
          currentStep={currentStep}
          onSend={onSend}
        />
      </div>
    </div>
    </>
  );
}

export default ChatSidebar; 