import React from 'react';
import ChatMenu from './ChatMenu';
import UserProfileDropdown from './UserProfileDropdown';
import { ProjectHistoryDropdown } from '../ProjectHistoryDropdown';

function ChatHeader({ 
  showMenu, 
  setShowMenu, 
  isAuthenticated, 
  showProjectHistory, 
  setShowProjectHistory, 
  setShowCharacterGenerator, 
  openCreateModal, 
  user, 
  showUserMenu, 
  setShowUserMenu, 
  logout, 
  onClose,
  onProjectSelect
}) {
  return (
    <div className='flex justify-between items-center p-3 border-b border-gray-800 sticky top-0 relative'>
      <div className='flex items-center gap-2 relative'>
        {/* Hamburger */}
        <button
          className='text-white text-xl focus:outline-none hover:text-gray-300'
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((v) => !v);
          }}
          title='Menu'
        >
          ☰
        </button>

        {/* Dropdown Menu */}
        <ChatMenu
          showMenu={showMenu}
          isAuthenticated={isAuthenticated}
          showProjectHistory={showProjectHistory}
          setShowProjectHistory={setShowProjectHistory}
          setShowCharacterGenerator={setShowCharacterGenerator}
          openCreateModal={openCreateModal}
        />
        
        {isAuthenticated && (
          <>
            {showProjectHistory && (
              <div className='absolute left-48 top-10 z-[10002]'>
                <ProjectHistoryDropdown
                  onSelect={onProjectSelect}
                />
              </div>
            )}
          </>
        )}
        
        <UserProfileDropdown
          isAuthenticated={isAuthenticated}
          user={user}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          setShowMenu={setShowMenu}
          logout={logout}
        />
      </div>
      
      <button
        className='text-white text-xl focus:outline-none hover:text-gray-300'
        aria-label='Close chat'
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}

export default ChatHeader; 