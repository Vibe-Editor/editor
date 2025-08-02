import React from 'react';

function ChatMenu({ 
  showMenu, 
  isAuthenticated, 
  showProjectHistory, 
  setShowProjectHistory, 
  setShowCharacterGenerator, 
  openCreateModal 
}) {
  if (!showMenu) return null;

  return (
    <div
      className='absolute left-0 mt-2 w-48 bg-black/90 backdrop-blur-md border border-white/20 p-2 rounded-lg flex flex-col gap-2 z-[10002] text-sm'
      onClick={(e) => e.stopPropagation()}
    >
      {isAuthenticated && (
        <>
          <button
            className='w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded'
            onClick={() => setShowProjectHistory((v) => !v)}
          >
            🕒 <span>Project History</span>
          </button>
          <button
            onClick={() => setShowCharacterGenerator(true)}
            className='w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded'
          >
            👤 <span>Generate Character</span>
          </button>
          <button
            onClick={openCreateModal}
            className='w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded'
          >
            ➕ <span>Create Project</span>
          </button>
        </>
      )}
    </div>
  );
}

export default ChatMenu; 