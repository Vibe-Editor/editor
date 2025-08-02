import React from "react";
import { createPortal } from "react-dom";

/**
 * Modal that allows the user to create a new project.
 * Pure presentational component – all state & handlers are injected via props.
 */
function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  creatingProject,
  createProjectError,
  newProjectName,
  setNewProjectName,
  newProjectDesc,
  setNewProjectDesc,
  nameInputRef,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]">
      <form
        onSubmit={onSubmit}
        className="bg-gray-800 p-4 rounded-lg shadow-lg w-96 flex flex-col gap-3 relative"
      >
        <h3 className="text-lg font-semibold text-white mb-2">Create New Project</h3>

        <label className="text-xs text-gray-300 mb-1">Project Name</label>
        <input
          ref={nameInputRef}
          name="projectName"
          className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          disabled={creatingProject}
          required
          autoFocus
        />

        <label className="text-xs text-gray-300 mb-1">Description (optional)</label>
        <textarea
          name="projectDesc"
          className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none resize-y min-h-[60px] max-h-[300px]"
          value={newProjectDesc}
          onChange={(e) => setNewProjectDesc(e.target.value)}
          disabled={creatingProject}
          rows={4}
          style={{ minHeight: 60 }}
        />

        {createProjectError && (
          <div className="text-xs text-red-400">{createProjectError}</div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-2 py-1"
            onClick={onClose}
            disabled={creatingProject}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded px-2 py-1"
            disabled={creatingProject || !newProjectName.trim()}
          >
            {creatingProject ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

export default CreateProjectModal;
