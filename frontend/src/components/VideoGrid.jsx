import { useState } from 'react';

const VideoGrid = ({ options, onSelect, selectedId }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [soundEnabled, setSoundEnabled] = useState({});

  const handleVideoLoad = (optionId) => {
    setLoadingStates(prev => ({ ...prev, [optionId]: false }));
  };

  const handleVideoLoadStart = (optionId) => {
    setLoadingStates(prev => ({ ...prev, [optionId]: true }));
  };

  const toggleSound = (optionId, e) => {
    e.stopPropagation();
    setSoundEnabled(prev => ({ ...prev, [optionId]: !prev[optionId] }));
  };

  return (
    <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
      {options.map((option) => (
        <div
          key={option.id}
          onClick={() => onSelect(option)}
          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
            selectedId === option.id
              ? 'border-yellow-400 shadow-lg shadow-yellow-400/20'
              : 'border-white/20 hover:border-white/40'
          }`}
        >
          <div className="relative aspect-video bg-gray-900">
            {loadingStates[option.id] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            <video
              src={option.s3_key}
              autoPlay
              loop
              muted={!soundEnabled[option.id]}
              playsInline
              className="w-full h-full object-cover"
              onLoadStart={() => handleVideoLoadStart(option.id)}
              onLoadedData={() => handleVideoLoad(option.id)}
            />
            
            {/* Sound Toggle Button */}
            <button
              onClick={(e) => toggleSound(option.id, e)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors z-10"
            >
              {soundEnabled[option.id] ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.797A1 1 0 019.383 3.076zM12 6.414l1.293-1.293a1 1 0 011.414 1.414L13.414 8l1.293 1.293a1 1 0 01-1.414 1.414L12 9.414l-1.293 1.293a1 1 0 01-1.414-1.414L10.586 8 9.293 6.707a1 1 0 011.414-1.414L12 6.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.797A1 1 0 019.383 3.076zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {selectedId === option.id && (
              <div className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-900/80">
            <h3 className="text-white font-medium text-lg mb-2">{option.label || option.description}</h3>
            <p className="text-gray-400 text-sm">{option.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
