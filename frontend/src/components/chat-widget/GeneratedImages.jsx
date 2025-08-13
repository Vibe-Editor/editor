import React from "react";

const GeneratedImages = ({ generatedImages, onImageClick }) => {
  if (Object.keys(generatedImages).length === 0) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        Generated Images:
      </h4>
      <div className='grid grid-cols-2 gap-2'>
        {Object.entries(generatedImages).map(([segmentId, imageUrl]) => (
          <div
            key={segmentId}
            className='relative group cursor-pointer'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Image container clicked - segmentId:', segmentId, 'imageUrl:', imageUrl);
              if (onImageClick && typeof onImageClick === 'function') {
                onImageClick(imageUrl);
              } else {
                console.error('onImageClick is not defined or not a function!', onImageClick);
              }
            }}
          >
            <img
              src={imageUrl}
              alt={`Generated image for segment ${segmentId}`}
              className='w-full h-20 object-cover rounded border border-gray-700 hover:opacity-80 transition-opacity'
              onError={(e) => {
                console.log('Image failed to load:', imageUrl);
                e.target.style.display = "none";
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', imageUrl);
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedImages;
