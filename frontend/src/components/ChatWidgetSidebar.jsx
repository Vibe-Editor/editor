import { useState, useEffect, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";
import CharacterGenerator from "./CharacterGenerator";
import { useAuth } from "../hooks/useAuth";
import { ProjectHistoryDropdown } from "./ProjectHistoryDropdown";
import ModelSelector from "./ModelSelector";
import StepList from "./chat-widget/StepList";
import InputArea from "./chat-widget/InputArea";
import { useProjectStore } from "../store/useProjectStore";

// Import new components
import HeaderComponent from "./HeaderComponent";
import NotificationBanners from "./NotificationBanners";
import MainContentArea from "./MainContentArea";
import ModalsComponent from "./ModalsComponent";

// Import custom hooks for business logic
import { useProjectData } from "./hooks/useProjectData";
import { useStepFlow } from "./hooks/useStepFlow";
import { useTimelineActions } from "./hooks/useTimeLineActions";
import { useProjectActions } from "./hooks/useProjectActions";
import { useCreditHandling } from "./hooks/useCreditHandling";

import React from "react";

function ChatWidgetSidebar({ open, setOpen }) {
  const { isAuthenticated, logout, user } = useAuth();

  // Basic UI states
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState(null);
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [showCharacterGenerator, setShowCharacterGenerator] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [collapseSteps, setCollapseSteps] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [createProjectError, setCreateProjectError] = useState(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [modalVideoUrl, setModalVideoUrl] = useState(null);
  const [showRedoModal, setShowRedoModal] = useState(false);
  const [redoStepId, setRedoStepId] = useState(null);

  const nameInputRef = useRef(null);

  // Custom hooks for business logic
  const {
    selectedProject,
    setSelectedProject,
    storedVideosMap,
   
    loadProjectData,
    clearProjectLocalStorage
  } = useProjectData();

  const [selectedImageModel, setSelectedImageModel] = useState(null);
  const [selectedVideoModel, setSelectedVideoModel] = useState(null);

  const {
    currentStep,
    setCurrentStep,
    stepStatus,
  
    concepts,
    setConcepts,
    selectedConcept,
    scripts,
    setScripts,
    selectedScript,
    setSelectedScript,
    generatedImages,
    setGeneratedImages,
    generatedVideos,
    setGeneratedVideos,
    generationProgress,

    redoImageModel,
    setRedoImageModel,
    redoVideoModel,
    setRedoVideoModel,
    loading,
    setLoading,
    steps,
    resetFlow,

    getStepIcon,
    isStepDisabled,
    handleStepClick,
    handleRedoStep,
    handleConceptSelect,
    handleScriptSelect,
    handleRedoWithModel
  } = useStepFlow({
    selectedProject,
    prompt,
    setError,
    setRedoStepId,
    setShowRedoModal,
    selectedImageModel,
    selectedVideoModel,
    setSelectedImageModel,
    setSelectedVideoModel
  });

  const {
    addingTimeline,
    canSendTimeline,
    sendVideosToTimeline,
    addSingleVideoToTimeline,
    combinedVideosMap
  } = useTimelineActions({
    selectedScript,
    generatedVideos,
    storedVideosMap,
    setError
  });

  const {
    openCreateModal,
    closeCreateModal,
    handleCreateProjectModal
  } = useProjectActions({
    setNewProjectName,
    setNewProjectDesc,
    setCreateProjectError,
    setCreateModalOpen,
    setCreatingProject,
    nameInputRef,
    clearProjectLocalStorage,
    setSelectedProject,
    resetFlow
  });

  const {
    creditDeductionMessage,
  } = useCreditHandling(user);



  // Load credit balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const { fetchBalance } = useProjectStore.getState();
      fetchBalance(user.id);
    }
  }, [isAuthenticated, user?.id]);

  // Load project data when selectedProject changes
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!selectedProject) return;
      try {
        setLoading(true);
        const {
          projectConcepts,
          projectImages,
          projectVideos,
          projectSegmentations,
        } = await loadProjectData();

        // Concepts
        if (projectConcepts?.success && Array.isArray(projectConcepts.data)) {
          setConcepts(projectConcepts.data);
        }

        // Script & Segments from first segmentation
        if (projectSegmentations?.success && projectSegmentations.data?.length > 0) {
          const firstSeg = projectSegmentations.data[0];
          if (Array.isArray(firstSeg.segments)) {
            const segments = firstSeg.segments.map((seg) => ({
              id: seg.segmentId || seg.id,
              visual: seg.visual,
              animation: seg.animation,
              narration: seg.narration,
              s3Key: seg.s3Key || seg.image_s3_key || seg.imageS3Key,
              imageUrl: seg.imageUrl || seg.image_url,
              videoUrl: seg.videoUrl || seg.video_url,
            }));
            setScripts([firstSeg]);
            setSelectedScript({ segments, artStyle: firstSeg.artStyle, concept: firstSeg.concept });
          }
        }

        // Images
        if (projectImages?.success && Array.isArray(projectImages.data)) {
          const imagesMap = {};
          projectImages.data.forEach((img) => {
            const segmentId = img.uuid || img.segment_id || img.segmentId || img.id;
            if (!segmentId) return;
            const key = img.s3Key || img.imageS3Key || img.image_s3_key;
            const url = key ? `https://ds0fghatf06yb.cloudfront.net/${key}` : img.url || img.imageUrl;
            if (url) imagesMap[segmentId] = url;
          });
          setGeneratedImages(imagesMap);
        }

        // Videos
        if (projectVideos?.success && Array.isArray(projectVideos.data)) {
          const videosMap = {};
          projectVideos.data.forEach((video) => {
            const segmentId = video.uuid || video.segment_id || video.segmentId || video.id;
            if (!segmentId) return;
            let key = null;
            if (Array.isArray(video.s3Keys) && video.s3Keys.length > 0) key = video.s3Keys[0];
            else if (Array.isArray(video.videoFiles) && video.videoFiles.length > 0) key = video.videoFiles[0].s3Key;
            const url = key ? `https://ds0fghatf06yb.cloudfront.net/${key}` : video.url || null;
            if (url) videosMap[segmentId] = url;
          });
          setGeneratedVideos(videosMap);
        }

        // After setting data, determine initial step
        setCurrentStep(() => {
          if (Object.keys(projectVideos?.data || {}).length > 0) return 5;
          if (Object.keys(projectImages?.data || {}).length > 0) return 4;
          if (projectSegmentations?.success && projectSegmentations.data?.length > 0) return 3;
          if (projectConcepts?.success && projectConcepts.data?.length > 0) return 1;
          return 0;
        });
      } catch (err) {
        setError(err.message || "Failed to load project data.");
      } finally {
        setLoading(false);
      }
    };

    if (selectedProject) {
      fetchProjectData();
    } else {
      resetFlow();
    }
  }, [selectedProject]);

  return (
    <div className='z-10' onClick={() => {
        setShowMenu(false);
        setShowUserMenu(false);
      }}>

      {/* Floating Button - Show when sidebar is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-3 right-3 z-[999999999] bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
          aria-label="Open chat sidebar"
        >
          <span className="text-base">💬</span>
          <span className="text-sm">Chat</span>
        </button>
      )}

      {/* Sliding sidebar */}
      <div
        className={`backdrop-blur-xl bg-white/20 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/40 shadow-lg rounded-2xl transition-all duration-300 ease-out fixed rounded-2xl mb-4 mr-4 bottom-0 right-0 h-[90vh] sm:h-[87vh] w-[90vw] sm:w-[360px] md:w-[25vw] max-w-[600px] text-white transform transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        } z-[10000] flex flex-col shadow-2xl`}
      >
        {/* Header */}
        <HeaderComponent
          isAuthenticated={isAuthenticated}
          user={user}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          setShowProjectHistory={setShowProjectHistory}
          showProjectHistory={showProjectHistory}
          setShowCharacterGenerator={setShowCharacterGenerator}
          openCreateModal={openCreateModal}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          logout={logout}
          setOpen={setOpen}
        />
        
        {/* Notification Banners */}
        <NotificationBanners
          isAuthenticated={isAuthenticated}
          selectedProject={selectedProject}
          creditDeductionMessage={creditDeductionMessage}
        />

        <div className='flex-1 overflow-hidden flex flex-col'>
          {/* 6 Steps */}
          <StepList
            steps={steps}
            stepStatus={stepStatus}
            currentStep={currentStep}
            loading={loading}
            collapseSteps={collapseSteps}
            setCollapseSteps={setCollapseSteps}
            isStepDisabled={isStepDisabled}
            getStepIcon={getStepIcon}
            handleStepClick={handleStepClick}
            handleRedoStep={handleRedoStep}
            setCurrentStep={setCurrentStep}
          />

          {/* Main Content Area */}
          <MainContentArea
            error={error}
            setError={setError}
            loading={loading}
            concepts={concepts}
            currentStep={currentStep}
            selectedConcept={selectedConcept}
            handleConceptSelect={handleConceptSelect}
            scripts={scripts}
            handleScriptSelect={handleScriptSelect}
            selectedScript={selectedScript}
            selectedImageModel={selectedImageModel}
            setSelectedImageModel={setSelectedImageModel}
            selectedVideoModel={selectedVideoModel}
            setSelectedVideoModel={setSelectedVideoModel}
            generationProgress={generationProgress}
            generatedImages={generatedImages}
            combinedVideosMap={combinedVideosMap}
            setModalImageUrl={setModalImageUrl}
            setShowImageModal={setShowImageModal}
            setModalVideoUrl={setModalVideoUrl}
            setShowVideoModal={setShowVideoModal}
            addSingleVideoToTimeline={addSingleVideoToTimeline}
            generatedVideos={generatedVideos}
            canSendTimeline={canSendTimeline}
            sendVideosToTimeline={sendVideosToTimeline}
            addingTimeline={addingTimeline}
            isAuthenticated={isAuthenticated}
            selectedProject={selectedProject}
            openCreateModal={openCreateModal}
          />

          {/* Input area */}
          <InputArea
            isAuthenticated={isAuthenticated}
            selectedProject={selectedProject}
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            currentStep={currentStep}
            handleStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Character Generator Modal */}
      <CharacterGenerator
        isOpen={showCharacterGenerator}
        onClose={() => setShowCharacterGenerator(false)}
      />

      {/* All Modals */}
      <ModalsComponent
        createModalOpen={createModalOpen}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDesc={newProjectDesc}
        setNewProjectDesc={setNewProjectDesc}
        createProjectError={createProjectError}
        creatingProject={creatingProject}
        handleCreateProjectModal={handleCreateProjectModal}
        closeCreateModal={closeCreateModal}
        showImageModal={showImageModal}
        modalImageUrl={modalImageUrl}
        setShowImageModal={setShowImageModal}
        setModalImageUrl={setModalImageUrl}
        showVideoModal={showVideoModal}
        modalVideoUrl={modalVideoUrl}
        setShowVideoModal={setShowVideoModal}
        setModalVideoUrl={setModalVideoUrl}
        showRedoModal={showRedoModal}
        setShowRedoModal={setShowRedoModal}
        redoStepId={redoStepId}
        redoImageModel={redoImageModel}
        setRedoImageModel={setRedoImageModel}
        redoVideoModel={redoVideoModel}
        setRedoVideoModel={setRedoVideoModel}
        handleRedoWithModel={handleRedoWithModel}
        loading={loading}
      />
    </div>
  );
}

export default ChatWidgetSidebar;