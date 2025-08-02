import React from 'react';

function SelectedContentDisplay({ selectedConcept, selectedScript, currentStep }) {
  return (
    <>
      {/* Show selected concept when step 1 is clicked */}
      {selectedConcept && currentStep === 1 && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>Selected Concept:</h4>
          <div className='p-3 bg-gray-800 border border-gray-700 rounded'>
            <div className='text-white font-medium text-sm mb-1'>{selectedConcept.title}</div>
            <div className='text-gray-300 text-xs mb-2'>{selectedConcept.concept}</div>
            <div className='flex flex-wrap gap-1'>
              <span className='px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded'>Tone: {selectedConcept.tone}</span>
              <span className='px-2 py-1 bg-green-600 text-green-100 text-xs rounded'>Goal: {selectedConcept.goal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Show selected script when step 3 is clicked */}
      {selectedScript && currentStep === 3 && (
        <div className='mb-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>Selected Script:</h4>
          <div className='p-3 bg-gray-800 border border-gray-700 rounded'>
            <div className='text-white font-medium text-sm mb-1'>Script with {selectedScript.segments.length} segments</div>
            <div className='text-gray-300 text-xs mb-2'>Art Style: {selectedScript.artStyle || 'Default'}</div>
            <div className='space-y-1'>
              {selectedScript.segments.slice(0, 3).map((segment, index) => (
                <div key={index} className='text-gray-400 text-xs'>
                  Segment {segment.id}: {segment.visual.substring(0, 50)}...
                </div>
              ))}
              {selectedScript.segments.length > 3 && (
                <div className='text-gray-500 text-xs'>... and {selectedScript.segments.length - 3} more segments</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SelectedContentDisplay; 