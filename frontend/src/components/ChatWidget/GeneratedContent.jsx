import React from 'react';

function GeneratedContent({ 
  generatedImages, 
  combinedVideosMap, 
  currentStep, 
  selectedScript, 
  onImageClick, 
  onVideoClick, 
  onAddToTimeline 
}) {
  return (
    <>
      {/* Generated Images */}
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
                  onClick={() => onImageClick(imageUrl)}
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

      {/* Generated Videos */}
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
                  onClick={() => onVideoClick(videoUrl)}
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
                  onClick={() => onAddToTimeline(segmentId)}
                >
                  <span className='text-white text-xs'>➕</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Content Summary */}
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
            {Object.keys(combinedVideosMap).length > 0 && (
              <div className='text-xs text-gray-400'>
                Videos: {Object.keys(combinedVideosMap).length}/{selectedScript.segments.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default GeneratedContent; 