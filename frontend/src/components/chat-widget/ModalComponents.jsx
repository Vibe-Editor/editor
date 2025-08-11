import React from "react";
import { createPortal } from "react-dom";
import ModelSelector from "../ModelSelector";

// Image Preview Modal
export const ImageModal = ({ show, imageUrl, onClose }) => {
  if (!show || !imageUrl) return null;

  return createPortal(
    <div
      className='fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10003]'
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt='Preview'
        className='max-w-full max-h-full rounded shadow-lg'
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className='absolute top-4 right-4 text-white text-2xl'
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ✕
      </button>
    </div>,
    document.body,
  );
};

// Video Preview Modal
export const VideoModal = ({ show, videoUrl, onClose }) => {
  if (!show || !videoUrl) return null;

  return createPortal(
    <div
      className='fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10003]'
      onClick={onClose}
    >
      <video
        src={videoUrl}
        controls
        autoPlay
        className='max-w-full max-h-full rounded shadow-lg'
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className='absolute top-4 right-4 text-white text-2xl'
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ✕
      </button>
    </div>,
    document.body,
  );
};

// Create Project Modal
export const CreateProjectModal = ({
  show,
  newProjectName,
  setNewProjectName,
  newProjectDesc,
  setNewProjectDesc,
  creatingProject,
  createProjectError,
  nameInputRef,
  onSubmit,
  onClose,
}) => {
  if (!show) return null;

  return createPortal(
    <div className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]'>
      <form
        onSubmit={onSubmit}
        className='bg-gray-800 p-4 rounded-lg shadow-lg w-96 flex flex-col gap-3 relative'
      >
        <h3 className='text-lg font-semibold text-white mb-2'>
          Create New Project
        </h3>
        <label className='text-xs text-gray-300 mb-1'>Project Name</label>
        <input
          ref={nameInputRef}
          className='p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none'
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          disabled={creatingProject}
          required
          autoFocus
        />
        <label className='text-xs text-gray-300 mb-1'>
          Description (optional)
        </label>
        <textarea
          className='p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none resize-y min-h-[60px] max-h-[300px]'
          value={newProjectDesc}
          onChange={(e) => setNewProjectDesc(e.target.value)}
          disabled={creatingProject}
          rows={4}
          style={{ minHeight: 60 }}
        />
        {createProjectError && (
          <div className='text-xs text-red-400'>{createProjectError}</div>
        )}
        <div className='flex gap-2 mt-2'>
          <button
            type='button'
            className='flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-2 py-1'
            onClick={onClose}
            disabled={creatingProject}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='flex-1 bg-green-600 hover:bg-green-500 text-white rounded px-2 py-1'
            disabled={creatingProject || !newProjectName.trim()}
          >
            {creatingProject ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

// Redo Modal with Model Selection
export const RedoModal = ({
  show,
  redoStepId,
  redoImageModel,
  setRedoImageModel,
  redoVideoModel,
  setRedoVideoModel,
  loading,
  onConfirm,
  onClose,
}) => {
  if (!show) return null;

  return createPortal(
    <div
      className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]'
      onClick={onClose}
    >
      <div
        className='bg-gray-800 p-6 rounded-lg shadow-lg w-96 flex flex-col gap-4 relative'
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className='text-lg font-semibold text-white mb-2'>
          Redo {redoStepId === 4 ? "Image" : "Video"} Generation
        </h3>
        <p className='text-gray-300 text-sm'>
          Choose a different AI model for regeneration:
        </p>

        {redoStepId === 4 && (
          <div>
            <label className='block text-xs text-gray-300 mb-1'>
              Image Generation Model
            </label>
            <ModelSelector
              genType='IMAGE'
              selectedModel={redoImageModel}
              onModelChange={setRedoImageModel}
              disabled={loading}
              className='w-full'
            />
          </div>
        )}

        {redoStepId === 5 && (
          <div>
            <label className='block text-xs text-gray-300 mb-1'>
              Video Generation Model
            </label>
            <ModelSelector
              genType='VIDEO'
              selectedModel={redoVideoModel}
              onModelChange={setRedoVideoModel}
              disabled={loading}
              className='w-full'
            />
          </div>
        )}

        <div className='flex gap-3 mt-4'>
          <button
            type='button'
            className='flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2'
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type='button'
            className='flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2'
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
};
