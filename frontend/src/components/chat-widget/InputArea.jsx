import React from "react";

/**
 * Bottom input bar that lets the user enter the main prompt and kick-off the flow.
 */
export default function InputArea({
  isAuthenticated,
  selectedProject,
  prompt,
  setPrompt,
  loading,
  currentStep,
  handleStepClick,
  canSendTimeline,
  addingTimeline,
  onSendToTimeline,
}) {
  if (!isAuthenticated) {
    return (
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-400 text-sm text-center">
          Sign in to use chat features
        </p>
      </div>
    );
  }

  if (isAuthenticated && !selectedProject) {
    return (
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-400 text-sm text-center">
          Select a project to start creating content
        </p>
      </div>
    );
  }

  // Authenticated + project selected → show input
  return (
    <div className="p-4 border-t border-white/10 dark:border-gray-700/60">
      <div className="relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (
              e.nativeEvent &&
              typeof e.nativeEvent.stopImmediatePropagation === "function"
            ) {
              e.nativeEvent.stopImmediatePropagation();
            }
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              prompt.trim() &&
              !loading
            ) {
              e.preventDefault();
              if (currentStep === 0) handleStepClick(0);
            }
          }}
          placeholder="Start Creating..."
          className="w-full bg-transparent border border-white/25 dark:border-gray-600/40 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm text-white pl-4 pr-24 py-3 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />

        {/* Timeline Arrow Button */}
        {canSendTimeline && (
          <button
            type="button"
            className={`absolute top-1/2 right-14 -translate-y-1/2 flex items-center justify-center rounded-full h-8 w-8 transition-opacity duration-150 ${
              addingTimeline
                ? "opacity-40 cursor-not-allowed"
                : "hover:scale-105 active:scale-95"
            }`}
            disabled={addingTimeline}
            onClick={(e) => {
              e.preventDefault();
              onSendToTimeline();
            }}
            title="Add Videos to Timeline"
          >
            {addingTimeline ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="text-white text-lg font-bold">+</span>
            )}
          </button>
        )}

        {/* Send Button */}
        <button
          type="button"
          className={`absolute top-1/2 right-3 -translate-y-1/2 flex items-center justify-center rounded-full h-9 w-9 transition-opacity duration-150 ${
            loading || !prompt.trim()
              ? "opacity-40 cursor-not-allowed"
              : "hover:scale-105 active:scale-95"
          }`}
          disabled={loading || !prompt.trim()}
          onClick={(e) => {
            e.preventDefault();
            if (currentStep === 0) handleStepClick(0);
          }}
          title="Send"
        >
          <span className="text-white text-lg font-bold">↑</span>
        </button>
      </div>
    </div>
  );
}
