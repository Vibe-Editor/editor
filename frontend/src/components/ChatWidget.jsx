import { useState, useEffect, useRef, useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";
import CharacterGenerator from "./CharacterGenerator";
import { useAuth } from "../hooks/useAuth";
import FloatingChatButton from "./chat-widget/FloatingChatButton";
import StepList from "./chat-widget/StepList";
import InputArea from "./chat-widget/InputArea";
import ConceptSelection from "./chat-widget/ConceptSelection";
import ScriptSelection from "./chat-widget/ScriptSelection";
import ModelSelection from "./chat-widget/ModelSelection";
import GenerationProgress from "./chat-widget/GenerationProgress";
import MediaDisplayGrid from "./chat-widget/MediaDisplayGrid";
import ProjectBanner from "./chat-widget/ProjectBanner";
import SidebarHeader from "./chat-widget/SidebarHeader";
import {
  ImageModal,
  VideoModal,
  CreateProjectModal,
  RedoModal,
} from "./chat-widget/ModalComponents";
import AuthMessages from "./chat-widget/AuthMessages";
import TimelineButton from "./chat-widget/TimelineButton";
import CreditSection from "./chat-widget/CreditSection";
import { useProjectStore } from "../store/useProjectStore";

// Custom hooks
import { useApiGeneration } from "../hooks/useApiGeneration";
import { useTimeline } from "../hooks/useTimeline";
import { useProjectManagement } from "../hooks/useProjectManagement";
import { useStepFlow } from "../hooks/useStepFlow";
import { useCreditManagement } from "../hooks/useCreditManagement";

import React from "react";

function ChatWidgetSidebar({ open, setOpen }) {
  const { isAuthenticated, logout, user } = useAuth();

  // Basic states
  const [prompt, setPrompt] = useState("");
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });
  const [storedVideosMap, setStoredVideosMap] = useState(() => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      if (stored) {
        const _project = JSON.parse(stored);
        return JSON.parse(localStorage.getItem(`project-store-videos`) || "{}");
      }
      return JSON.parse(localStorage.getItem("segmentVideos") || "{}");
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  // UI states
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [showCharacterGenerator, setShowCharacterGenerator] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [collapseSteps, setCollapseSteps] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const nameInputRef = useRef(null);

  // modal for viewing generated images and videos
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [modalVideoUrl, setModalVideoUrl] = useState(null);

  // Custom hooks
  const {
    loading,
    error,
    setError,
    generationProgress,
    setGenerationProgress,
    runConceptWriter,
    runScriptGeneration,
    runImageGeneration,
    runVideoGeneration,
  } = useApiGeneration();

  const {
    addingTimeline,
    timelineProgress,
    setTimelineProgress,
    sendVideosToTimeline,
    addSingleVideoToTimeline,
  } = useTimeline();

  const {
    creatingProject,
    createProjectError,
    createModalOpen,
    newProjectName,
    setNewProjectName,
    newProjectDesc,
    setNewProjectDesc,
    loadProjectData,
    openCreateModal,
    closeCreateModal,
    handleCreateProjectModal,
  } = useProjectManagement();

  const {
    currentStep,
    setCurrentStep,
    stepStatus,
    concepts,
    setConcepts,
    selectedConcept,
    setSelectedConcept,
    scripts,
    setScripts,
    selectedScript,
    setSelectedScript,
    generatedImages,
    setGeneratedImages,
    generatedVideos,
    setGeneratedVideos,
    selectedImageModel,
    setSelectedImageModel,
    selectedVideoModel,
    setSelectedVideoModel,
    showRedoModal,
    setShowRedoModal,
    redoStepId,
    setRedoStepId,
    redoImageModel,
    setRedoImageModel,
    redoVideoModel,
    setRedoVideoModel,
    steps,
    updateStepStatusBasedOnData,
    resetFlow,
    updateStepStatus,
    getStepIcon,
    isStepDisabled,
    handleStepClick,
    handleRedoStep,
    handleRedoWithModel,
    handleConceptSelect,
    handleScriptSelect,
  } = useStepFlow();

  const {
    creditDeductionMessage,
    showCreditDeduction,
    showCreditDeductionMessage,
    showRequestFailed,
  } = useCreditManagement();

  const { fetchBalance } = useProjectStore();

  // Storage listener
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("project-store-selectedProject");
        const newSelectedProject = stored ? JSON.parse(stored) : null;
        setSelectedProject(newSelectedProject);

        if (newSelectedProject) {
          setStoredVideosMap(
            JSON.parse(localStorage.getItem(`project-store-videos`) || "{}"),
          );
        } else {
          setStoredVideosMap(
            JSON.parse(localStorage.getItem("segmentVideos") || "{}"),
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Electron timeline listener
  useEffect(() => {
    if (window?.electronAPI?.res?.timeline?.add) {
      window.electronAPI.res.timeline.add((_evt, payload) => {
        setTimelineProgress((prev) => ({
          ...prev,
          added: prev.added + Object.keys(payload || {}).length,
        }));
      });
    }
  }, [setTimelineProgress]);

  // Load credit balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const { fetchBalance } = useProjectStore.getState();
      fetchBalance(user.id);
    }
  }, [isAuthenticated, user?.id]);

  // Load project data when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectData({
        selectedProject,
        setLoading: () => {}, // Loading handled by useApiGeneration
        setError,
        setConcepts,
        setSelectedScript,
        setGeneratedImages,
        setGeneratedVideos,
        setStoredVideosMap,
        setSelectedConcept,
        setScripts,
      });
    } else {
      resetFlow();
    }
  }, [
    selectedProject,
    loadProjectData,
    resetFlow,
    setError,
    setConcepts,
    setSelectedScript,
    setGeneratedImages,
    setGeneratedVideos,
    setStoredVideosMap,
    setSelectedConcept,
    setScripts,
  ]);

  // Update step status based on current data
  useEffect(() => {
    updateStepStatusBasedOnData(selectedProject);
  }, [
    selectedProject,
    concepts,
    selectedConcept,
    scripts,
    selectedScript,
    generatedImages,
    generatedVideos,
    updateStepStatusBasedOnData,
  ]);

  // Helper maps combining stored data so UI shows even after reload
  const combinedVideosMap = useMemo(
    () => ({ ...generatedVideos, ...storedVideosMap }),
    [generatedVideos, storedVideosMap],
  );

  // Step actions for the hooks
  const stepActions = {
    runConceptWriter: () =>
      runConceptWriter({
        prompt,
        selectedProject,
        setConcepts,
        updateStepStatus,
        setCurrentStep,
        showCreditDeduction: (message) => showCreditDeductionMessage(message),
        showRequestFailed,
      }),
    runScriptGeneration: () =>
      runScriptGeneration({
        prompt,
        selectedConcept,
        selectedProject,
        setScripts,
        updateStepStatus,
        setCurrentStep,
        showCreditDeduction: (serviceName, model, count) =>
          showCreditDeduction(serviceName, model, count, user, fetchBalance),
        showRequestFailed,
      }),
    runImageGeneration: () =>
      runImageGeneration({
        selectedScript,
        selectedProject,
        selectedImageModel,
        setGeneratedImages,
        setSelectedScript,
        updateStepStatus,
        setCurrentStep,
        showCreditDeduction: (serviceName, model, count) =>
          showCreditDeduction(serviceName, model, count, user, fetchBalance),
        showRequestFailed,
      }),
    runVideoGeneration: () =>
      runVideoGeneration({
        selectedScript,
        selectedProject,
        selectedVideoModel,
        generatedImages,
        setGeneratedVideos,
        updateStepStatus,
        showCreditDeduction: (serviceName, model, count) =>
          showCreditDeduction(serviceName, model, count, user, fetchBalance),
        showRequestFailed,
      }),
  };

  const canSendTimeline =
    Object.keys(generatedVideos).length > 0 ||
    Object.keys(storedVideosMap).length > 0;

  return (
    <div
      className='z-10'
      onClick={() => {
        setShowMenu(false);
        setShowUserMenu(false);
      }}
    >
      {/* Sliding sidebar */}
      <div
        className={`backdrop-blur-xl bg-white/20 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/40 shadow-lg rounded-2xl transition-transform duration-500 ease-out fixed mb-4 mr-4 bottom-0 right-0 h-[90vh] sm:h-[87vh] w-[90vw] sm:w-[360px] md:w-[25vw] max-w-[600px] text-white transform ${
          open ? "translate-x-0" : "translate-x-full"
        } z-[10000] flex flex-col shadow-2xl`}
      >
        {/* Header */}
        <SidebarHeader
          isAuthenticated={isAuthenticated}
          user={user}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          showProjectHistory={showProjectHistory}
          setShowProjectHistory={setShowProjectHistory}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          onCharacterGenerator={() => setShowCharacterGenerator(true)}
          onCreateProject={() => openCreateModal(nameInputRef)}
          onClose={() => setOpen(false)}
          onLogout={logout}
        />

        {/* Credit Widget Section */}
        <CreditSection
          isAuthenticated={isAuthenticated}
          creditDeductionMessage={creditDeductionMessage}
        />

        {/* Project banner */}
        {isAuthenticated && <ProjectBanner selectedProject={selectedProject} />}

        <div className='flex-1 overflow-hidden flex flex-col'>
          {/* 6 Steps */}
          <StepList
            steps={steps}
            stepStatus={stepStatus}
            currentStep={currentStep}
            loading={loading}
            collapseSteps={collapseSteps}
            setCollapseSteps={setCollapseSteps}
            isStepDisabled={(stepId) => isStepDisabled(stepId, loading)}
            getStepIcon={getStepIcon}
            handleStepClick={(stepId) =>
              handleStepClick(stepId, loading, stepActions)
            }
            handleRedoStep={(stepId) =>
              handleRedoStep(stepId, loading, stepActions)
            }
            setCurrentStep={setCurrentStep}
          />

          {/* Content Area */}
          <div className='flex-1 overflow-y-auto p-4'>
            {error && (
              <div className='mb-4 p-3 bg-red-900 text-red-100 rounded text-sm'>
                {error}
                <button
                  onClick={() => setError(null)}
                  className='ml-2 text-red-300 hover:text-red-100'
                >
                  ✕
                </button>
              </div>
            )}

            {loading && (
              <div className='flex items-center justify-center py-8'>
                <LoadingSpinner />
                <span className='ml-2 text-gray-300'>Processing...</span>
              </div>
            )}

            <ConceptSelection
              concepts={concepts}
              selectedConcept={selectedConcept}
              currentStep={currentStep}
              onConceptSelect={handleConceptSelect}
            />

            <ScriptSelection
              scripts={scripts}
              selectedScript={selectedScript}
              currentStep={currentStep}
              onScriptSelect={handleScriptSelect}
            />

            <ModelSelection
              currentStep={currentStep}
              selectedImageModel={selectedImageModel}
              selectedVideoModel={selectedVideoModel}
              onImageModelChange={setSelectedImageModel}
              onVideoModelChange={setSelectedVideoModel}
              loading={loading}
            />

            <GenerationProgress
              generationProgress={generationProgress}
              currentStep={currentStep}
            />

            <MediaDisplayGrid
              generatedImages={generatedImages}
              combinedVideosMap={combinedVideosMap}
              currentStep={currentStep}
              selectedScript={selectedScript}
              generatedVideos={generatedVideos}
              onImageClick={(imageUrl) => {
                setModalImageUrl(imageUrl);
                setShowImageModal(true);
              }}
              onVideoClick={(videoUrl) => {
                setModalVideoUrl(videoUrl);
                setShowVideoModal(true);
              }}
              onAddToTimeline={(segmentId) =>
                addSingleVideoToTimeline(segmentId, combinedVideosMap, setError)
              }
            />

            <TimelineButton
              canSendTimeline={canSendTimeline}
              addingTimeline={addingTimeline}
              onSendToTimeline={() =>
                sendVideosToTimeline(
                  selectedScript,
                  combinedVideosMap,
                  setError,
                )
              }
            />

            <AuthMessages
              isAuthenticated={isAuthenticated}
              selectedProject={selectedProject}
              onCreateProject={() => openCreateModal(nameInputRef)}
            />
          </div>

          {/* Input area */}
          <InputArea
            isAuthenticated={isAuthenticated}
            selectedProject={selectedProject}
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            currentStep={currentStep}
            handleStepClick={(stepId) =>
              handleStepClick(stepId, loading, stepActions)
            }
          />
        </div>
      </div>

      {/* Character Generator Modal */}
      <CharacterGenerator
        isOpen={showCharacterGenerator}
        onClose={() => setShowCharacterGenerator(false)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        show={createModalOpen}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDesc={newProjectDesc}
        setNewProjectDesc={setNewProjectDesc}
        creatingProject={creatingProject}
        createProjectError={createProjectError}
        nameInputRef={nameInputRef}
        onSubmit={(e) =>
          handleCreateProjectModal(e, { setSelectedProject, resetFlow })
        }
        onClose={closeCreateModal}
      />

      {/* Image preview modal */}
      <ImageModal
        show={showImageModal}
        imageUrl={modalImageUrl}
        onClose={() => {
          setShowImageModal(false);
          setModalImageUrl(null);
        }}
      />

      {/* Video preview modal */}
      <VideoModal
        show={showVideoModal}
        videoUrl={modalVideoUrl}
        onClose={() => {
          setShowVideoModal(false);
          setModalVideoUrl(null);
        }}
      />

      {/* Redo modal with model selection */}
      <RedoModal
        show={showRedoModal}
        redoStepId={redoStepId}
        redoImageModel={redoImageModel}
        setRedoImageModel={setRedoImageModel}
        redoVideoModel={redoVideoModel}
        setRedoVideoModel={setRedoVideoModel}
        loading={loading}
        onConfirm={() => handleRedoWithModel(loading, stepActions)}
        onClose={() => setShowRedoModal(false)}
      />
    </div>
  );
}

// Wrapper component to keep the public <ChatWidget /> API small.
// Manages only the "open" state & publish-button visibility then delegates
// all heavy UI / logic to <ChatWidgetSidebar />.
function ChatWidget() {
  const [open, setOpen] = React.useState(false);

  // Hide Electron publish button when the chat is open
  React.useEffect(() => {
    const btn = document.getElementById("publish-button");
    if (btn) {
      btn.style.display = open ? "none" : "";
    }
  }, [open]);

  return (
    <>
      <FloatingChatButton open={open} setOpen={setOpen} />
      <ChatWidgetSidebar open={open} setOpen={setOpen} />
    </>
  );
}

export default ChatWidget;
