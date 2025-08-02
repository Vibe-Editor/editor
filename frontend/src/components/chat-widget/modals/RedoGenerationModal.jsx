import React from "react";
import { createPortal } from "react-dom";
import ModelSelector from "../../ModelSelector"; // relative path from modals folder

/**
 * Modal that lets the user redo image/video generation with a different model.
 */
function RedoGenerationModal({
  isOpen,
  stepId,
  redoImageModel,
  setRedoImageModel,
  redoVideoModel,
  setRedoVideoModel,
  loading,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;

  const handleWrapperClick = () => onCancel();
  const stopPropagation = (e) => e.stopPropagation();

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]"
      onClick={handleWrapperClick}
    >
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-lg w-96 flex flex-col gap-4 relative"
        onClick={stopPropagation}
      >
        <h3 className="text-lg font-semibold text-white mb-2">
          Redo {stepId === 4 ? "Image" : "Video"} Generation
        </h3>
        <p className="text-gray-300 text-sm">
          Choose a different AI model for regeneration:
        </p>

        {stepId === 4 && (
          <div>
            <label className="block text-xs text-gray-300 mb-1">Image Generation Model</label>
            <ModelSelector
              genType="IMAGE"
              selectedModel={redoImageModel}
              onModelChange={setRedoImageModel}
              disabled={loading}
              className="w-full"
            />
          </div>
        )}

        {stepId === 5 && (
          <div>
            <label className="block text-xs text-gray-300 mb-1">Video Generation Model</label>
            <ModelSelector
              genType="VIDEO"
              selectedModel={redoVideoModel}
              onModelChange={setRedoVideoModel}
              disabled={loading}
              className="w-full"
            />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Redo Generation"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default RedoGenerationModal;
