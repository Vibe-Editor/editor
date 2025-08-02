import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import ConceptSelection from './ConceptSelection';
import ScriptSelection from './ScriptSelection';
import SelectedContentDisplay from './SelectedContentDisplay';
import ModelSelectionSection from './ModelSelectionSection';
import GenerationProgress from './GenerationProgress';
import GeneratedMediaGrid from './GeneratedMediaGrid';
import ContentSummary from './ContentSummary';
import TimelineSection from './TimelineSection';
import AuthProjectMessages from './AuthProjectMessages';

const MainContentArea = ({
  error,
  setError,
  loading,
  concepts,
  currentStep,
  selectedConcept,
  handleConceptSelect,
  scripts,
  handleScriptSelect,
  selectedScript,
  selectedImageModel,
  setSelectedImageModel,
  selectedVideoModel,
  setSelectedVideoModel,
  generationProgress,
  generatedImages,
  combinedVideosMap,
  setModalImageUrl,
  setShowImageModal,
  setModalVideoUrl,
  setShowVideoModal,
  addSingleVideoToTimeline,
  generatedVideos,
  canSendTimeline,
  sendVideosToTimeline,
  addingTimeline,
  isAuthenticated,
  selectedProject,
  openCreateModal
}) => {
  return (
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

      {/* Concepts Selection */}
      <ConceptSelection
        concepts={concepts}
        currentStep={currentStep}
        selectedConcept={selectedConcept}
        handleConceptSelect={handleConceptSelect}
      />

      {/* Scripts Selection */}
      <ScriptSelection
        scripts={scripts}
        currentStep={currentStep}
        handleScriptSelect={handleScriptSelect}
      />

      {/* Selected Content Display */}
      <SelectedContentDisplay
        selectedConcept={selectedConcept}
        selectedScript={selectedScript}
        currentStep={currentStep}
      />

      {/* Model Selection */}
      <ModelSelectionSection
        currentStep={currentStep}
        selectedImageModel={selectedImageModel}
        setSelectedImageModel={setSelectedImageModel}
        selectedVideoModel={selectedVideoModel}
        setSelectedVideoModel={setSelectedVideoModel}
        loading={loading}
      />

      {/* Generation Progress */}
      <GenerationProgress
        generationProgress={generationProgress}
        currentStep={currentStep}
      />

      {/* Generated Media Grid */}
      <GeneratedMediaGrid
        generatedImages={generatedImages}
        combinedVideosMap={combinedVideosMap}
        currentStep={currentStep}
        setModalImageUrl={setModalImageUrl}
        setShowImageModal={setShowImageModal}
        setModalVideoUrl={setModalVideoUrl}
        setShowVideoModal={setShowVideoModal}
        addSingleVideoToTimeline={addSingleVideoToTimeline}
      />

      {/* Generated Content Summary */}
      <ContentSummary
        selectedScript={selectedScript}
        currentStep={currentStep}
        generatedImages={generatedImages}
        generatedVideos={generatedVideos}
      />

      {/* Timeline Section */}
      <TimelineSection
        canSendTimeline={canSendTimeline}
        sendVideosToTimeline={sendVideosToTimeline}
        addingTimeline={addingTimeline}
      />

      {/* Auth/Project Messages */}
      <AuthProjectMessages
        isAuthenticated={isAuthenticated}
        selectedProject={selectedProject}
        openCreateModal={openCreateModal}
      />
    </div>
  );
};

export default MainContentArea;