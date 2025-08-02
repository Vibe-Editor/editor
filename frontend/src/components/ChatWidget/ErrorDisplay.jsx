import React from 'react';

function ErrorDisplay({ error, onClearError }) {
  if (!error) return null;

  return (
    <div className='mb-4 p-3 bg-red-900 text-red-100 rounded text-sm'>
      {error}
      <button
        onClick={onClearError}
        className='ml-2 text-red-300 hover:text-red-100'
      >
        ✕
      </button>
    </div>
  );
}

export default ErrorDisplay; 