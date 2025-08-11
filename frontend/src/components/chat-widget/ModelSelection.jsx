import React from "react";
import ModelSelector from "../ModelSelector";

const ModelSelection = ({
  currentStep,
  selectedImageModel,
  selectedVideoModel,
  onImageModelChange,
  onVideoModelChange,
  loading,
}) => {
  // Show model selection when step 4 or 5 is active
  if (currentStep === 4 || currentStep === 5) {
    return (
      <div className='mb-4'>
        <h4 className='text-sm font-semibold text-white mb-2'>
          AI Model Selection:
        </h4>
        <div className='space-y-3'>
          {currentStep === 4 && (
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Image Generation Model:
              </label>
              <ModelSelector
                genType='IMAGE'
                selectedModel={selectedImageModel}
                onModelChange={onImageModelChange}
                disabled={loading}
                className='w-full'
              />
            </div>
          )}
          {currentStep === 5 && (
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Video Generation Model:
              </label>
              <ModelSelector
                genType='VIDEO'
                selectedModel={selectedVideoModel}
                onModelChange={onVideoModelChange}
                disabled={loading}
                className='w-full'
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ModelSelection;
