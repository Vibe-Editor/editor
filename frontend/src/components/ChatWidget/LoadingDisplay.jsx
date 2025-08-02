import React from 'react';
import LoadingSpinner from '../LoadingSpinner';

function LoadingDisplay({ loading }) {
  if (!loading) return null;

  return (
    <div className='flex items-center justify-center py-8'>
      <LoadingSpinner />
      <span className='ml-2 text-gray-300'>Processing...</span>
    </div>
  );
}

export default LoadingDisplay; 