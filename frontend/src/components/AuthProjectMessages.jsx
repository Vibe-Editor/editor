import React from 'react';
import ChatLoginButton from './ChatLoginButton';

const AuthProjectMessages = ({ 
  isAuthenticated, 
  selectedProject, 
  openCreateModal 
}) => {
  return (
    <>
      {/* Auth/Project Messages */}
      {!isAuthenticated && (
        <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-white mb-2'>Welcome to Usuals.ai</h3>
            <p className='text-gray-400 text-sm'>Sign in to access AI-powered video creation features</p>
          </div>
          <ChatLoginButton />
        </div>
      )}

      {isAuthenticated && !selectedProject && (
        <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-white mb-2'>No Project Selected</h3>
            <p className='text-gray-400 text-sm'>Please create or select a project to start creating video content</p>
          </div>
          <button
            onClick={openCreateModal}
            className='bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-medium'
          >
            Create New Project
          </button>
        </div>
      )}
    </>
  );
};

export default AuthProjectMessages;