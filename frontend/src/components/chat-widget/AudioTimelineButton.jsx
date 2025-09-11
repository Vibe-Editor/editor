import React from 'react';

const AudioTimelineButton = ({
  canSendAudioTimeline,
  addingAudioTimeline,
  onSendAudioToTimeline,
  audioCount = 0,
}) => {
  if (!canSendAudioTimeline || audioCount === 0) return null;

  return (
    <div className="mt-3">
      <div
        onClick={addingAudioTimeline ? undefined : onSendAudioToTimeline}
        className={`w-full  text-[#94E7ED] py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          addingAudioTimeline ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M11.9996 15V12M11.9996 12V9M11.9996 12H8.99963M11.9996 12H14.9996M21.1496 12.0001C21.1496 17.0535 17.053 21.1501 11.9996 21.1501C6.9462 21.1501 2.84961 17.0535 2.84961 12.0001C2.84961 6.94669 6.9462 2.8501 11.9996 2.8501C17.053 2.8501 21.1496 6.94669 21.1496 12.0001Z" 
            stroke="#94E7ED" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        {addingAudioTimeline ? (
          <span>Adding audio to timeline...</span>
        ) : (
          <span>Add audio to the timeline</span>
        )}
      </div>
    </div>
  );
};

export default AudioTimelineButton;
