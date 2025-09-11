import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';

/**
 * Audio Generation Component
 * Handles voice-over generation approval, progress, and results display
 */
const AudioGeneration = ({ 
  chatFlow, 
  onAddAudioToTimeline,
  showApproval = false,
  onApprove = () => {},
  onCancel = () => {}
}) => {
  const [selectedVoiceId, setSelectedVoiceId] = useState('EkK5I93UQWFDigLMpZcX'); // James (Default)
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get voice model options from chatFlow (which comes from useAudio hook)
  const voiceModels = chatFlow?.voiceModels || [
    { id: 'EkK5I93UQWFDigLMpZcX', name: 'James' },
    { id: 'BpjGufoPiobT79j2vtj4', name: 'Priyanka' },
    { id: 'kdmDKE6EkgrWrrykO9Qt', name: 'Alexandra' },
    { id: '1SM7GgM6IMuvQlz2BwM3', name: 'Mark' },
    { id: 'scOwDtmlUjD3prqpp97I', name: 'Sam' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsVoiceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoiceId(voiceId);
    setIsVoiceDropdownOpen(false);
  };

  const handleApproveGeneration = () => {
    const selectedVoice = voiceModels.find(v => v.id === selectedVoiceId);
    console.log('🎤 Voice generation approved with voice:', selectedVoice);
    
    // Update the chatFlow's selected voice
    if (chatFlow?.setSelectedVoiceId) {
      chatFlow.setSelectedVoiceId(selectedVoiceId);
    }
    
    onApprove(selectedVoiceId, selectedVoice);
  };

  const currentVoice = voiceModels.find(v => v.id === selectedVoiceId);

  // Show approval UI
  if (showApproval) {
    return (
      <div className='bg-white/10 border border-gray-600/40 rounded-lg p-4 mb-3'>
        <div className='flex items-center justify-between mb-3'>
          <div className='text-white font-bold text-sm'>
            Voice Generation Approval
          </div>
          <div className='bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded text-xs'>
            Waiting
          </div>
        </div>
        
        <div className='text-gray-300 text-xs mb-3 leading-relaxed'>
          <div className='mb-2 text-cyan-300 font-medium'>Voice-Over Generation Ready</div>
          <div>I'm ready to generate voice-over audio for all video segments using AI voice synthesis. This will create professional narration for your content.</div>
        </div>

        {/* Voice Selection Dropdown */}
        <div className='mb-3'>
          <div className='text-gray-300 text-xs mb-2 font-medium'>Select Voice:</div>
          <div className='relative' ref={dropdownRef}>
            <button
              type='button'
              onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
              className='text-gray-300 text-xs px-3 py-2 rounded-md focus:outline-none transition-all duration-200 cursor-pointer flex items-center justify-between w-full'
              style={{
                background: "rgba(24, 25, 28, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(5px)",
                minWidth: "200px",
              }}
            >
              <span className='truncate'>
                {currentVoice?.name || 'Select Voice'}
              </span>
              <svg
                className={`ml-2 flex-shrink-0 transition-transform duration-200 ${
                  isVoiceDropdownOpen ? "rotate-180" : ""
                }`}
                width='12'
                height='12'
                viewBox='0 0 20 20'
                fill='none'
              >
                <path
                  stroke='#6b7280'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='1.5'
                  d='M6 8l4 4 4-4'
                />
              </svg>
            </button>

            {/* Voice Dropdown Menu */}
            {isVoiceDropdownOpen && (
              <div
                className='absolute z-50 w-full rounded-lg shadow-lg overflow-hidden mt-1'
                style={{
                  background: "rgba(30, 30, 34, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                }}
              >
                {voiceModels.map((voice) => (
                  <div
                    key={voice.id}
                    onClick={() => handleVoiceSelect(voice.id)}
                    className='px-3 py-2 cursor-pointer transition-all duration-200 flex items-center justify-between group'
                    style={{
                      background:
                        selectedVoiceId === voice.id
                          ? "rgba(59, 130, 246, 0.2)"
                          : "transparent",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background =
                        selectedVoiceId === voice.id
                          ? "rgba(59, 130, 246, 0.3)"
                          : "rgba(255, 255, 255, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background =
                        selectedVoiceId === voice.id
                          ? "rgba(59, 130, 246, 0.2)"
                          : "transparent";
                    }}
                  >
                    <span className='text-gray-200 text-sm font-medium'>
                      {voice.name}
                    </span>
                    {selectedVoiceId === voice.id && (
                      <svg width='16' height='16' viewBox='0 0 20 20' fill='none'>
                        <path
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          fill='currentColor'
                          className='text-blue-400'
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className='flex gap-2'>
          <button
            onClick={handleApproveGeneration}
            className='bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 px-3 py-1.5 rounded text-xs transition-colors font-medium'
          >
            Approve
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className='bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 text-gray-300 px-3 py-1.5 rounded text-xs transition-colors font-medium'
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show generation progress
  if (chatFlow?.audioGenerationLoading) {
    const progress = chatFlow.audioGenerationProgress || {};
    const progressEntries = Object.entries(progress);
    const completedCount = progressEntries.filter(([_, p]) => p.status === 'completed').length;
    const totalCount = progressEntries.length;

    return (
      <div className='bg-gray-800/50 border border-gray-700/30 rounded-lg p-4 mb-3'>
        <div className='text-gray-100 text-sm mb-3 flex items-center gap-2'>
          <div className='w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin'></div>
          <span>Generating audio... ({completedCount}/{totalCount})</span>
        </div>
        
        {progressEntries.length > 0 && (
          <div className='space-y-2'>
            {progressEntries.map(([segmentId, progressInfo]) => (
              <div key={segmentId} className='flex items-center gap-3'>
                <span className='text-gray-400 text-xs w-16'>
                  Segment {progressInfo.index}
                </span>
                <div className='flex-1 bg-gray-700 rounded-full h-2'>
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progressInfo.status === 'completed' ? 'bg-green-500' :
                      progressInfo.status === 'error' ? 'bg-red-500' :
                      'bg-cyan-500 animate-pulse'
                    }`}
                    style={{ 
                      width: progressInfo.status === 'completed' ? '100%' : 
                             progressInfo.status === 'error' ? '100%' : '60%' 
                    }}
                  />
                </div>
                <span className='text-gray-400 text-xs w-20'>
                  {progressInfo.status === 'completed' ? '✅ Done' :
                   progressInfo.status === 'error' ? '❌ Error' :
                   '🎤 Generating'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show generated audio players
  const generatedAudios = chatFlow?.generatedAudios || {};
  const audioEntries = Object.entries(generatedAudios);
  
  if (audioEntries.length > 0) {
    return (
      <div className='mb-3'>
        <div className='text-gray-100 text-sm mb-4'>
          🎤 Generated Voice-Overs ({audioEntries.length} segments):
        </div>
        
        <div className='space-y-3'>
          {audioEntries
            .sort(([a], [b]) => {
              // Sort by segment number (extract number from segment ID)
              const aNum = parseInt(a.replace(/\D/g, '')) || 0;
              const bNum = parseInt(b.replace(/\D/g, '')) || 0;
              return aNum - bNum;
            })
            .map(([segmentId, audioData], index) => (
              <AudioPlayer
                key={segmentId}
                audioData={audioData}
                segmentNumber={index + 1}
                onAddToTimeline={onAddAudioToTimeline}
              />
            ))}
        </div>
      </div>
    );
  }

  // Default empty state
  return null;
};

export default AudioGeneration;
