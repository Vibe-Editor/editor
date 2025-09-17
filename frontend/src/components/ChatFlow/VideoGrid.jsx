import { useState } from "react";

const VideoGrid = ({ options, onSelect, selectedId, compact = false, showNavigation = false, onPrevious, onNext, canGoPrevious = false, canGoNext = false }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [soundEnabled, setSoundEnabled] = useState({});

  const handleVideoLoad = (optionId) => {
    setLoadingStates((prev) => ({ ...prev, [optionId]: false }));
  };

  const handleVideoLoadStart = (optionId) => {
    setLoadingStates((prev) => ({ ...prev, [optionId]: true }));
  };

  const toggleSound = (optionId, e) => {
    e.stopPropagation();
    setSoundEnabled((prev) => ({ ...prev, [optionId]: !prev[optionId] }));
  };

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      {showNavigation && (
        <>
          {/* Left Arrow */}
          <div
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`absolute left-0 top-1/2 -translate-y-1/2 translate-x-18 z-10 w-8 h-8 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center hover:bg-gray-700/80 transition-all duration-200 ${
              canGoPrevious ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Previous"
            title="Previous"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>

          {/* Right Arrow */}
          <div
            onClick={onNext}
            disabled={!canGoNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 -translate-x-18 z-10 w-8 h-8 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center hover:bg-gray-700/80 transition-all duration-200 ${
              canGoNext ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Next"
            title="Next"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </>
      )}

      <div
        className={`grid grid-cols-2 ${compact ? 'gap-2 max-w-3xl p-2' : 'gap-4 max-w-4xl p-4'} mx-auto`}
      >
      {options.map((option) => (
        <div
          key={option.id}
          onClick={() => onSelect(option)}
          className={`relative cursor-pointer transition-all duration-300 ${
            selectedId === option.id ? "scale-105" : "hover:scale-[1.02]"
          }`}
        >
          {/* Glass Card Container */}
          <div
            className={`relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl transition-all duration-300 ${
              selectedId === option.id
                ? "shadow-amber-500/30 border-amber-400/40 bg-white/15"
                : "hover:bg-white/15 hover:border-white/30"
            }`}
          >
            {/* Video Section - Takes up most of the card */}
            <div
              className={`relative ${compact ? 'aspect-[16/10]' : 'aspect-[4/3]'} bg-gradient-to-br from-amber-50/20 to-orange-100/20`}
            >
              {loadingStates[option.id] && (
                <div className='absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm'>
                  <div className='w-8 h-8 border-2 border-white/30 border-t-amber-400 rounded-full animate-spin'></div>
                </div>
              )}

              <video
                src={option.s3_key}
                autoPlay
                loop
                muted={!soundEnabled[option.id]}
                playsInline
                className='w-full h-full object-cover'
                onLoadStart={() => handleVideoLoadStart(option.id)}
                onLoadedData={() => handleVideoLoad(option.id)}
              />

              {/* Subtle gradient overlay */}
              <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5'></div>

              {/* Sound Toggle Button */}
              <button
                onClick={(e) => toggleSound(option.id, e)}
                className='absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 border border-white/30'
              >
                {soundEnabled[option.id] ? (
                  <svg
                    className='w-5 h-5 text-white drop-shadow-sm'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.797A1 1 0 019.383 3.076zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                ) : (
                  <svg
                    className='w-5 h-5 text-white drop-shadow-sm'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.797A1 1 0 019.383 3.076zM12 6.414l1.293-1.293a1 1 0 011.414 1.414L13.414 8l1.293 1.293a1 1 0 01-1.414 1.414L12 9.414l-1.293 1.293a1 1 0 01-1.414-1.414L10.586 8 9.293 6.707a1 1 0 011.414-1.414L12 6.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
              </button>

              {/* Selection Indicator */}
              {selectedId === option.id && (
                <div className='absolute inset-0 flex items-center justify-center bg-amber-400/10 backdrop-blur-sm'>
                  <div className='w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center shadow-xl animate-pulse'>
                    <svg
                      className='w-8 h-8 text-white'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Text Section */}
            <div className={`${compact ? 'px-4 py-3' : 'px-6 py-4'} bg-white/5 backdrop-blur-sm border-t border-white/10`}>
              <h3 className={`text-white font-medium ${compact ? 'text-sm' : 'text-base'} mb-1 leading-tight drop-shadow-sm`}>
                {option.label || option.description}
              </h3>
              <p className='text-white/80 text-xs leading-relaxed drop-shadow-sm line-clamp-2'>
                {option.description}
              </p>
            </div>
          </div>

          {/* Outer glow effect */}
          <div
            className={`absolute -inset-1 rounded-3xl blur-xl transition-opacity duration-300 -z-10 ${
              selectedId === option.id
                ? "bg-gradient-to-r from-amber-400/20 to-orange-400/20 opacity-100"
                : "bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-50"
            }`}
          ></div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default VideoGrid;
