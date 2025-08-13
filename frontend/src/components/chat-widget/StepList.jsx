import React from "react";

/**
 * Renders the list of 6 video creation steps in a card-based grid layout.
 * Matches the design from the provided image.
 */
export default function StepList({
  steps,
  stepStatus,
  currentStep,
  loading,
  collapseSteps,
  setCollapseSteps,
  isStepDisabled,
  getStepIcon,
  handleStepClick,
  handleRedoStep,
  setCurrentStep,
}) {
  
  // Get proper icon for each step
  const getStepIconSvg = (stepId) => {
    switch (stepId) {
      case 0: // Concept Writer
      case 2: // Script Generation
        return (
          <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        );
      case 1: // Choose Concept
      case 3: // Choose Script
        return (
          <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 4: // Image Generation
        return (
          <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 5: // Video Generation
        return (
          <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">{stepId + 1}</span>
          </div>
        );
    }
  };

  const getStatusIcon = (stepId) => {
    const status = stepStatus[stepId];
    if (status === "done") {
      return (
        <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    if (status === "loading" || (loading && currentStep === stepId)) {
      return (
        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-1.5 h-1.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }
    return (
      <div className="w-3 h-3 border border-gray-500 rounded-full flex-shrink-0"></div>
    );
  };

  const completedSteps = Object.values(stepStatus).filter(status => status === "done").length;

  return (
    <div className="p-4">
      {/* Tasks container with backdrop blur and shadow */}
      <div 
        className={`bg-black/50 rounded-lg transition-all duration-300 ${collapseSteps ? 'px-4 py-2' : 'p-4'}`}
        style={{
          backdropFilter: 'blur(40px)',
          boxShadow: '0px 4px 72.9px 0px #2C2D2F'
        }}
      >
        {/* Header */}
        <div className={`flex items-center ${collapseSteps ? 'justify-center gap-40 mb-0' : 'justify-between mb-3'}`}>
          <button
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => setCollapseSteps(!collapseSteps)}
          >
            <h3 className="text-base font-semibold text-white">
              Tasks
            </h3>
            <div className={`text-gray-400 transition-transform duration-200 ${collapseSteps ? 'rotate-0' : 'rotate-180'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {/* Progress Ring */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgb(75 85 99)"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgb(34 197 94)"
                strokeWidth="3"
                strokeDasharray={`${(completedSteps / steps.length) * 100}, 100`}
                strokeLinecap="round"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {completedSteps}/{steps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Step cards in 2-column grid - compact version */}
        {!collapseSteps && (
          <div className="grid grid-cols-2 gap-3">
          {steps.map((step) => {
            const disabled = isStepDisabled(step.id) || loading;
            const isCurrent = currentStep === step.id;
            const isDone = stepStatus[step.id] === "done";
            const isLoading = stepStatus[step.id] === "loading" || (loading && currentStep === step.id);

            return (
              <div
                key={step.id}
                className={`relative bg-gray-800/40 hover:bg-gray-700/40 rounded-lg px-2 py-2 cursor-pointer transition-all duration-200 border flex items-center gap-2 ${
                  isCurrent
                    ? "border-blue-500 bg-blue-900/20" 
                    : isDone 
                    ? "border-green-500/50 bg-[#94E7ED26]" 
                    : "border-gray-700/30"
                } ${disabled && !isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (!disabled && !isLoading) {
                    handleStepClick(step.id);
                  }
                }}
              >
                {/* Main icon */}
                {getStepIconSvg(step.id)}

                {/* Step name */}
                <div className="flex-1 min-w-0 px-1">
                  <div className="text-white text-[11px] font-medium truncate leading-tight">
                    {step.name === "Concept Writer" ? "Concept" :
                     step.name === "Concept" ? "Choose" :
                     step.name === "Script Generation" ? "Script" :
                     step.name === "Script" ? "Choose" :
                     step.name === "Image Generation" ? "Image Gen" :
                     step.name === "Video Generation" ? "Video Gen" :
                     step.name}
                  </div>
                </div>

                {/* Status indicator and redo button */}
                <div className="flex items-center gap-0.5">
                  {isDone && !isLoading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRedoStep(step.id);
                      }}
                      className="p-0.5 text-gray-400 hover:text-white transition-colors rounded"
                      title="Redo step"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                  {getStatusIcon(step.id)}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}