import { useState } from "react";

const VideoGrid = ({
  options,
  onSelect,
  selectedId,
  compact = false,
  showNavigation = false,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}) => {
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
    <div className='relative'>
      {/* Navigation Arrows */}
      {showNavigation && (
        <>
          {/* Left Arrow */}
          <div
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`absolute left-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 flex items-center justify-center transition-all duration-200 ${
              canGoPrevious
                ? "opacity-100 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
            aria-label='Previous'
            title='Previous'
          >
            <svg
              width='30'
              height='30'
              viewBox='0 0 26 26'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M12.9356 17.9999C11.155 16.7036 9.55566 15.1892 8.1772 13.4951C8.05894 13.3498 7.99982 13.1748 7.99982 12.9999M12.9356 7.99988C11.155 9.29618 9.55566 10.8105 8.1772 12.5046C8.05894 12.6499 7.99982 12.8249 7.99982 12.9999M7.99982 12.9999L17.9998 12.9999M1.56238 13C1.56238 19.3168 6.68312 24.4375 12.9999 24.4375C19.3166 24.4375 24.4374 19.3168 24.4374 13C24.4374 6.68324 19.3166 1.5625 12.9999 1.5625C6.68312 1.5625 1.56238 6.68324 1.56238 13Z'
                stroke='white'
                strokeOpacity='0.5'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>

          {/* Right Arrow */}
          <div
            onClick={onNext}
            disabled={!canGoNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 flex items-center justify-center transition-all duration-200 ${
              canGoNext
                ? "opacity-100 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
            aria-label='Next'
            title='Next'
          >
            <svg
              width='30'
              height='30'
              viewBox='0 0 26 26'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M13.0643 8.00012C14.8449 9.29642 16.4442 10.8108 17.8227 12.5049C17.9409 12.6502 18.0001 12.8252 18.0001 13.0001M13.0643 18.0001C14.8449 16.7038 16.4442 15.1895 17.8227 13.4954C17.9409 13.3501 18.0001 13.1751 18.0001 13.0001M18.0001 13.0001L8.00006 13.0001M24.4375 13C24.4375 6.68324 19.3168 1.5625 13 1.5625C6.68324 1.5625 1.5625 6.68324 1.5625 13C1.5625 19.3168 6.68324 24.4375 13 24.4375C19.3168 24.4375 24.4375 19.3168 24.4375 13Z'
                stroke='white'
                strokeOpacity='0.5'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
        </>
      )}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${
          compact ? "gap-3 max-w-2xl p-2" : "gap-4 sm:gap-6 max-w-5xl p-4"
        } mx-auto`}
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
              className={`relative overflow-hidden transition-all duration-300 ${
                selectedId === option.id ? "shadow-amber-500/30" : ""
              }`}
              style={{
                borderRadius: "9.79px",
                aspectRatio: "301.33 / 230.39",
              }}
            >
              {/* Video Section - Takes up the full card */}
              <div className='relative w-full h-full bg-gradient-to-br from-amber-50/20 to-orange-100/20'>
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

                {/* Text overlay with transparent background */}
                <div className='absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-4 py-3'>
                  <h3
                    className={`text-white font-medium ${
                      compact ? "text-sm" : "text-base"
                    } mb-1 leading-tight drop-shadow-sm`}
                  >
                    {option.label || option.description}
                  </h3>
                  <p className='text-white/90 text-xs leading-relaxed drop-shadow-sm line-clamp-2'>
                    {option.description}
                  </p>
                </div>

                {/* Sound Toggle Button */}
                <div
                  onClick={(e) => toggleSound(option.id, e)}
                  className='absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 border border-white/30'
                >
                  {soundEnabled[option.id] ? (
                    <svg
                      className='w-5 h-5 text-white drop-shadow-sm'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z' />
                    </svg>
                  ) : (
                    <svg
                      className='w-5 h-5 text-white drop-shadow-sm'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z' />
                    </svg>
                  )}
                </div>

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
            </div>

            {/* Outer glow effect */}
            <div
              className={`absolute -inset-1 blur-xl transition-opacity duration-300 -z-10 ${
                selectedId === option.id
                  ? "bg-gradient-to-r from-amber-400/20 to-orange-400/20 opacity-100"
                  : "bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-50"
              }`}
              style={{
                borderRadius: "9.79px",
              }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
