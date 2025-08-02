import React from 'react';

const ScriptSelection = ({ 
  scripts, 
  currentStep, 
  handleScriptSelect 
}) => {
  if (!scripts || (currentStep !== 2 && currentStep !== 3)) return null;

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>Choose a Script:</h4>
      <div className='space-y-2'>
        <button
          onClick={() => handleScriptSelect(scripts.response1)}
          className='w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors'
        >
          <div className='text-white font-medium text-sm mb-1'>Script Option 1</div>
          <div className='text-gray-300 text-xs'>{scripts.response1.segments.length} segments</div>
        </button>
        <button
          onClick={() => handleScriptSelect(scripts.response2)}
          className='w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors'
        >
          <div className='text-white font-medium text-sm mb-1'>Script Option 2</div>
          <div className='text-gray-300 text-xs'>{scripts.response2.segments.length} segments</div>
        </button>
      </div>
    </div>
  );
};

export default ScriptSelection;