import React from 'react';
import ModelSelector from '../../ModelSelector';

function ImageGenStep({
  selectedImageModel,
  setSelectedImageModel,
  loading,
  generationProgress,
  generatedImages,
  onImageClick,
}) {
  return (
    <div className="mb-4">
      {/* Model Selection */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-2">AI Model Selection:</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Image Generation Model:</label>
            <ModelSelector
              genType="IMAGE"
              selectedModel={selectedImageModel}
              onModelChange={setSelectedImageModel}
              disabled={loading}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      {Object.keys(generationProgress).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-white mb-2">Generation Progress:</h4>
          <div className="space-y-2">
            {Object.entries(generationProgress)
              .filter(([, p]) => p.type === 'image')
              .map(([segmentId, progress]) => (
              <div key={segmentId} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-300 text-xs">Segment {segmentId}</span>
                <div className="flex items-center gap-2">
                  {progress.status === "generating" && (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-400 text-xs">Generating image...</span>
                    </>
                  )}
                  {progress.status === "completed" && (
                    <span className="text-green-400 text-xs">✓ Image completed</span>
                  )}
                  {progress.status === "error" && (
                    <span className="text-red-400 text-xs">✗ Image failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Images */}
      {Object.keys(generatedImages).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-white mb-2">Generated Images:</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(generatedImages).map(([segmentId, imageUrl]) => (
              <div key={segmentId} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Generated for segment ${segmentId}`}
                  className="w-full h-20 object-cover rounded border border-gray-700 cursor-pointer"
                  onClick={() => onImageClick(imageUrl)}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                  <span className="text-white text-xs opacity-0 group-hover:opacity-100">Segment {segmentId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGenStep;
