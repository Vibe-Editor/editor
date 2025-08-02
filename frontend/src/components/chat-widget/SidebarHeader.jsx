import React from "react";
import { ProjectHistoryDropdown } from "../ProjectHistoryDropdown";

/**
 * Collocated header for the chat sidebar.
 * Handles hamburger menu, project history, character generator, user menu and close-button.
 * All heavy state is held in the parent and injected via props.
 */
function SidebarHeader({
  isAuthenticated,
  user,
  logout,
  showMenu,
  setShowMenu,
  showUserMenu,
  setShowUserMenu,
  showProjectHistory,
  setShowProjectHistory,
  setShowCharacterGenerator,
  openCreateModal,
  setOpen,
}) {
  return (
    <div className="flex justify-between items-center p-3 border-b border-gray-800 sticky top-0 relative">
      <div className="flex items-center gap-2 relative">
        {/* Hamburger */}
        <button
          className="text-white text-xl focus:outline-none hover:text-gray-300"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((v) => !v);
          }}
          title="Menu"
        >
          ☰
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            className="absolute left-0 mt-2 w-48 bg-black/90 backdrop-blur-md border border-white/20 p-2 rounded-lg flex flex-col gap-2 z-[10002] text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {isAuthenticated && (
              <>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded"
                  onClick={() => setShowProjectHistory((v) => !v)}
                >
                  🕒 <span>Project History</span>
                </button>
                <button
                  onClick={() => setShowCharacterGenerator(true)}
                  className="w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded"
                >
                  👤 <span>Generate Character</span>
                </button>
                <button
                  onClick={openCreateModal}
                  className="w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded"
                >
                  ➕ <span>Create Project</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Project history dropdown placed beside menu */}
        {isAuthenticated && showProjectHistory && (
          <div className="absolute left-48 top-10 z-[10002]">
            <ProjectHistoryDropdown onSelect={() => setShowProjectHistory(false)} />
          </div>
        )}

        {/* User menu */}
        {isAuthenticated && user && (
          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu((v) => !v);
                setShowMenu(false);
              }}
              className="flex items-center gap-1 focus:outline-none"
            >
              <span className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </span>
              <svg
                className="w-4 h-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-44 bg-black/90 backdrop-blur-md border border-white/20 text-white rounded-md shadow-lg p-2 z-[10002] text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 border-b border-gray-700 mb-1">{user.name || user.email}</div>
                <button
                  onClick={logout}
                  className="w-full text-left px-2 py-1 hover:bg-gray-800 rounded"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close sidebar button */}
      <button
        className="text-white text-xl focus:outline-none hover:text-gray-300"
        aria-label="Close chat"
        onClick={() => setOpen(false)}
      >
        ✕
      </button>
    </div>
  );
}

export default SidebarHeader;
