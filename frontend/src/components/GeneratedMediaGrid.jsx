import React from 'react';
import { useProjectStore } from '../store/useProjectStore';

const GeneratedMediaGrid = ({ 
  generatedImages, 
  combinedVideosMap, 
  currentStep,
  setModalImageUrl,
  setShowImageModal,
  setModalVideoUrl,
  setShowVideoModal,
  addSingleVideoToTimeline
}) => {
  const { loadingData } = useProjectStore();
  
  const hasImages = Object.keys(generatedImages).length > 0;
  const hasVideos = Object.keys(combinedVideosMap).length > 0;
  
  // Show images only in steps 4 (Image Generation) and 5 (Video Generation)
  const shouldShowImages = hasImages && (currentStep === 4 || currentStep === 5);
  
  // Show videos only in step 5 (Video Generation)
  const shouldShowVideos = hasVideos && currentStep === 5;

  // Don't render anything if no content should be shown
  if (!shouldShowImages && !shouldShowVideos) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Generated Images Section */}
      {shouldShowImages && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>
            Generated Images
            {loadingData.images && <span className="ml-2 text-blue-400">(Loading...)</span>}
          </h4>
          <div className='grid grid-cols-2 gap-2'>
            {Object.entries(generatedImages).map(([segmentId, imageUrl]) => (
              <div key={segmentId} className='relative group'>
                <img
                  src={imageUrl}
                  alt={`Generated image for segment ${segmentId}`}
                  className='w-full h-20 object-cover rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors'
                  onClick={() => {
                    setModalImageUrl(imageUrl);
                    setShowImageModal(true);
                  }}
                  onError={(e) => {
                    console.error(`Failed to load image for segment ${segmentId}`);
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

      {/* Generated Videos Section */}
      {shouldShowVideos && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>
            Generated Videos
            {loadingData.videos && <span className="ml-2 text-blue-400">(Loading...)</span>}
          </h4>
          <div className='grid grid-cols-2 gap-2'>
            {Object.entries(combinedVideosMap).map(([segmentId, videoUrl]) => (
              <div key={segmentId} className='relative group'>
                <video
                  src={videoUrl}
                  className='w-full h-20 object-cover rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors'
                  muted
                  loop
                  onClick={() => {
                    setModalVideoUrl(videoUrl);
                    setShowVideoModal(true);
                  }}
                  onError={(e) => {
                    console.error(`Failed to load video for segment ${segmentId}`);
                    e.target.style.display = 'none';
                  }}
                />
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center'>
                  <span className='text-white text-xs opacity-0 group-hover:opacity-100'>Segment {segmentId}</span>
                </div>
                <button
                  className='absolute top-1 right-1 bg-black bg-opacity-70 rounded px-1 cursor-pointer hover:bg-opacity-90'
                  title='Add to Timeline'
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent video modal from opening
                    addSingleVideoToTimeline(segmentId);
                  }}
                >
                  <span className='text-white text-xs'>➕</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedMediaGrid;