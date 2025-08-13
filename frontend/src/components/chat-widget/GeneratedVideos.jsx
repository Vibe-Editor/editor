import React from "react";

const GeneratedVideos = ({
  combinedVideosMap,
  onVideoClick,
  onAddSingleVideo,
}) => {
  if (Object.keys(combinedVideosMap).length === 0) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        Generated Videos:
      </h4>
      <div className='grid grid-cols-2 gap-2'>
        {Object.entries(combinedVideosMap).map(([segmentId, videoUrl]) => (
          <div
            key={segmentId}
            className='relative group cursor-pointer'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Video container clicked - segmentId:', segmentId, 'videoUrl:', videoUrl);
              if (onVideoClick && typeof onVideoClick === 'function') {
                onVideoClick(videoUrl);
              } else {
                console.error('onVideoClick is not defined or not a function!', onVideoClick);
              }
            }}
          >
            <video
              src={videoUrl}
              className='w-full h-20 object-cover rounded border border-gray-700 hover:opacity-80 transition-opacity'
              muted
              loop
              preload="metadata"
              onError={(e) => {
                console.log('Video failed to load:', videoUrl);
                e.target.style.display = "none";
              }}
              onLoadedData={() => {
                console.log('Video loaded successfully:', videoUrl);
              }}
            />
            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center'>
              <div className='opacity-0 group-hover:opacity-100 flex flex-col items-center gap-1'>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span className='text-white text-xs'>
                  Expand • Segment {segmentId}
                </span>
              </div>
            </div>
            <div
              className='absolute top-1 right-1 bg-black bg-opacity-70 rounded px-1 cursor-pointer z-10'
              title='Add to Timeline'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add to timeline clicked for segment:', segmentId);
                onAddSingleVideo(segmentId);
              }}
            >
              <span className='text-white text-xs'>➕</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedVideos;
