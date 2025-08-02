/* eslint-disable react/prop-types */
import React from 'react';
import LoadingSpinner from '../../LoadingSpinner';
import ModelSelector from '../../ModelSelector';
import ChatLoginButton from '../../ChatLoginButton';
import ConceptChoiceStep from '../steps/ConceptChoiceStep';
import ScriptChoiceStep from '../steps/ScriptChoiceStep';

const ContentView = ({
  error,
  setError,
  loading,
  currentStep,
  concepts,
  handleConceptSelect,
  scripts,
  handleScriptSelect,
  selectedConcept,
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
  canSendTimeline,
  sendVideosToTimeline,
  addingTimeline,
  isAuthenticated,
  selectedProject,
  openCreateModal,
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
      {currentStep === 1 && (
        <ConceptChoiceStep
          concepts={concepts}
          onSelect={handleConceptSelect}
        />
      )}

      {/* Scripts Selection */}
      {currentStep === 3 && (
        <ScriptChoiceStep
          scripts={scripts ? [scripts.response1, scripts.response2] : []}
          onSelect={handleScriptSelect}
        />
      )}

      {/* Show selected concept when step 1 is clicked */}
      {selectedConcept && currentStep === 1 && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>Selected Concept:</h4>
          <div className='p-3 bg-gray-800 border border-gray-700 rounded'>
            <div className='text-white font-medium text-sm mb-1'>{selectedConcept.title}</div>
            <div className='text-gray-300 text-xs mb-2'>{selectedConcept.concept}</div>
            <div className='flex flex-wrap gap-1'>
              <span className='px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded'>Tone: {selectedConcept.tone}</span>
              <span className='px-2 py-1 bg-green-600 text-green-100 text-xs rounded'>Goal: {selectedConcept.goal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Show selected script when step 3 is clicked */}
      {selectedScript && currentStep === 3 && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>Selected Script:</h4>
          <div className='p-3 bg-gray-800 border border-gray-700 rounded'>
            <div className='text-white font-medium text-sm mb-1'>Script with {selectedScript.segments.length} segments</div>
            <div className='text-gray-300 text-xs mb-2'>Art Style: {selectedScript.artStyle || 'Default'}</div>
            <div className='space-y-1'>
              {selectedScript.segments.slice(0, 3).map((segment, index) => (
                <div key={index} className='text-gray-400 text-xs'>
                  Segment {segment.id}: {segment.visual.substring(0, 50)}...
                </div>
              ))}
              {selectedScript.segments.length > 3 && (
                <div className='text-gray-500 text-xs'>... and {selectedScript.segments.length - 3} more segments</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Model Selection - show when step 4 or 5 is active */}
      {(currentStep === 4 || currentStep === 5) && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>AI Model Selection:</h4>
          <div className='space-y-3'>
            {currentStep === 4 && (
              <div>
                <label className='block text-xs text-gray-400 mb-1'>Image Generation Model:</label>
                <ModelSelector
                  genType="IMAGE"
                  selectedModel={selectedImageModel}
                  onModelChange={setSelectedImageModel}
                  disabled={loading}
                  className="w-full"
                />
              </div>
            )}
            {currentStep === 5 && (
              <div>
                <label className='block text-xs text-gray-400 mb-1'>Video Generation Model:</label>
                <ModelSelector
                  genType="VIDEO"
                  selectedModel={selectedVideoModel}
                  onModelChange={setSelectedVideoModel}
                  disabled={loading}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generation Progress - show when any generation step is active */}
      {Object.keys(generationProgress).length > 0 && (currentStep === 4 || currentStep === 5) && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>Generation Progress:</h4>
          <div className='space-y-2'>
            {Object.entries(generationProgress).map(([segmentId, progress]) => (
              <div key={segmentId} className='flex items-center justify-between p-2 bg-gray-800 rounded'>
                <span className='text-gray-300 text-xs'>Segment {segmentId}</span>
                <div className='flex items-center gap-2'>
                  {progress.status === "generating" && (
                    <>
                      <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                      <span className='text-blue-400 text-xs'>Generating {progress.type}...</span>
                    </>
                  )}
                  {progress.status === "completed" && (
                    <span className='text-green-400 text-xs'>✓ {progress.type} completed</span>
                  )}
                  {progress.status === "error" && (
                    <span className='text-red-400 text-xs'>✗ {progress.type} failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Images - show when step 4 or 5 is active */}
      {Object.keys(generatedImages).length > 0 && (currentStep === 4 || currentStep === 5) && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>Generated Images:</h4>
          <div className='grid grid-cols-2 gap-2'>
            {Object.entries(generatedImages).map(([segmentId, imageUrl]) => (
              <div key={segmentId} className='relative group'>
                <img
                  src={imageUrl}
                  alt={`Generated image for segment ${segmentId}`}
                  className='w-full h-20 object-cover rounded border border-gray-700 cursor-pointer'
                  onClick={() => {
                    setModalImageUrl(imageUrl);
                    setShowImageModal(true);
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center'>
                  <span className='text-white text-xs opacity-0 group-hover:opacity-100'>Segment {segmentId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Videos - show when step 5 is active */}
      {Object.keys(combinedVideosMap).length > 0 && currentStep === 5 && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>Generated Videos:</h4>
          <div className='grid grid-cols-2 gap-2'>
            {Object.entries(combinedVideosMap).map(([segmentId, videoUrl]) => (
              <div key={segmentId} className='relative group'>
                <video
                  src={videoUrl}
                  className='w-full h-20 object-cover rounded border border-gray-700 cursor-pointer'
                  muted
                  loop
                  onClick={() => {
                    setModalVideoUrl(videoUrl);
                    setShowVideoModal(true);
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center'>
                  <span className='text-white text-xs opacity-0 group-hover:opacity-100'>Segment {segmentId}</span>
                </div>
                <div
                  className='absolute top-1 right-1 bg-black bg-opacity-70 rounded px-1 cursor-pointer'
                  title='Add to Timeline'
                  onClick={() => addSingleVideoToTimeline(segmentId)}
                >
                  <span className='text-white text-xs'>➕</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Content Summary - show when step 4 or 5 is clicked */}
      {selectedScript && (currentStep === 4 || currentStep === 5) && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>Generated Content:</h4>
          <div className='space-y-2'>
            <div className='text-xs text-gray-400'>
              Segments: {selectedScript.segments.length}
            </div>
            {Object.keys(generatedImages).length > 0 && (
              <div className='text-xs text-gray-400'>
                Images: {Object.keys(generatedImages).length}/{selectedScript.segments.length}
              </div>
            )}
            {Object.keys(generatedVideos).length > 0 && (
              <div className='text-xs text-gray-400'>
                Videos: {Object.keys(generatedVideos).length}/{selectedScript.segments.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Button */}
      {canSendTimeline && (
        <div className='mb-4'>
          <button
            onClick={sendVideosToTimeline}
            disabled={addingTimeline}
            className='w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2'
          >
            {addingTimeline ? (
              <>
                <div className='w-4 h-4'><LoadingSpinner /></div>
                <span>Adding to Timeline...</span>
              </>
            ) : (
              <>
                <span>➕</span>
                <span>Add Videos to Timeline</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Auth/Project Messages */}
      {!isAuthenticated && (
        <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-white mb-2'>Welcome to Usuals.ai</h3>
            <p className='text-gray-400 text-sm'>Sign in to access AI-powered video creation features</p>
          </div>
          <ChatLoginButton />
        </div>
      )}

      {isAuthenticated && !selectedProject && (
        <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-white mb-2'>No Project Selected</h3>
            <p className='text-gray-400 text-sm'>Please create or select a project to start creating video content</p>
          </div>
          <button
            onClick={openCreateModal}
            className='bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-medium'
          >
            Create New Project
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentView;
