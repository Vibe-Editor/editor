import React from 'react';

function UserProfileDropdown({ 
  isAuthenticated, 
  user, 
  showUserMenu, 
  setShowUserMenu, 
  setShowMenu, 
  logout 
}) {
  if (!isAuthenticated || !user) return null;

  return (
    <div className='relative ml-2'>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowUserMenu((v) => !v);
          setShowMenu(false);
        }}
        className='flex items-center gap-1 focus:outline-none'
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt='Profile'
            className='w-7 h-7 rounded-full border border-gray-600'
          />
        ) : (
          <div className='w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center'>
            <span className='text-white text-xs font-medium'>
              {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </span>
          </div>
        )}
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='w-3 h-3 text-gray-300'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {showUserMenu && (
        <div
          className='absolute right-0 mt-2 w-44 bg-black/90 backdrop-blur-md border border-white/20 text-white rounded-md shadow-lg p-2 z-[10002] text-sm'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='px-2 py-1 border-b border-gray-700 mb-1'>{user.name || user.email}</div>
          <button
            onClick={logout}
            className='w-full text-left px-2 py-1 hover:bg-gray-800 rounded'
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfileDropdown; 