import React from 'react';

function StepProgress({ 
  steps, 
  currentStep, 
  stepStatus, 
  loading, 
  collapseSteps, 
  setCollapseSteps, 
  getStepIcon, 
  isStepDisabled, 
  onStepClick, 
  onRedoStep 
}) {
  return (
    <div className='p-3 border-b border-gray-800'>
      <div className='flex items-center justify-between mb-1'>
        <h3 className='text-xs font-semibold text-gray-300 uppercase tracking-wide'>Video Steps</h3>
        <button
          className='text-gray-400 hover:text-gray-200 text-sm focus:outline-none'
          onClick={() => setCollapseSteps((v) => !v)}
        >
          {collapseSteps ? '▼' : '▲'}
        </button>
      </div>
      {!collapseSteps && (
        <div className='space-y-1'>
          {steps.map((step) => {
            const icon = getStepIcon(step.id);
            const isDisabled = isStepDisabled(step.id) || loading;
            const isCurrent = currentStep === step.id;
            return (
              <div
                key={step.id}
                className={`w-full flex items-center gap-2 p-1 rounded text-left transition-colors text-xs ${
                  isDisabled ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-800'
                } ${isCurrent ? 'bg-gray-800' : ''}`}
                onClick={() => {
                  if (!loading && !isDisabled && stepStatus[step.id] === 'done') {
                    onStepClick(step.id);
                  }
                }}
              >
                <span className='text-sm'>{icon}</span>
                <div className='flex-1'>
                  <div className='font-medium'>{step.name}</div>
                </div>
                {stepStatus[step.id] === 'done' && !collapseSteps && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRedoStep(step.id);
                    }}
                    className='px-2 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-500 rounded'
                  >
                    Redo
                  </button>
                )}
                {stepStatus[step.id] !== 'done' && !isDisabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStepClick(step.id);
                    }}
                    className='px-2 py-0.5 text-[10px] bg-green-600 hover:bg-green-500 rounded'
                  >
                    Run
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StepProgress; 