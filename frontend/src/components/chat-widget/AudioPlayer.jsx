import React, { useState, useRef, useEffect } from 'react';

/**
 * Audio Player Component with waveform visualization, controls, and download
 */
const AudioPlayer = ({ 
  audioData, 
  segmentNumber, 
  onAddToTimeline 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioData?.url) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      drawWaveform();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      console.error('Audio loading error:', e);
      setError('Failed to load audio');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioData?.url]);

  // Draw simple waveform visualization
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(24, 25, 28, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // Draw simple waveform bars
    const barWidth = 2;
    const barGap = 1;
    const totalBars = Math.floor(width / (barWidth + barGap));
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.6)'; // Blue bars
    
    for (let i = 0; i < totalBars; i++) {
      const x = i * (barWidth + barGap);
      // Generate pseudo-random heights for waveform effect
      const barHeight = Math.sin(i * 0.1) * 15 + Math.cos(i * 0.05) * 10 + 20;
      const y = (height - Math.abs(barHeight)) / 2;
      
      // Highlight played portion
      if (duration > 0 && (i / totalBars) <= (currentTime / duration)) {
        ctx.fillStyle = 'rgba(59, 130, 246, 1)'; // Bright blue for played
      } else {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Dim blue for unplayed
      }
      
      ctx.fillRect(x, y, barWidth, Math.abs(barHeight));
    }
  };

  // Redraw waveform when time changes
  useEffect(() => {
    if (duration > 0) {
      drawWaveform();
    }
  }, [currentTime, duration]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio play error:', error);
      setError('Failed to play audio');
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / canvas.width;
    const newTime = clickRatio * duration;

    audio.currentTime = Math.max(0, Math.min(newTime, duration));
  };

  const handleDownload = () => {
    if (!audioData?.url) return;
    
    const link = document.createElement('a');
    link.href = audioData.url;
    link.download = `segment-${segmentNumber}-audio.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-3'>
        <div className='text-red-300 text-sm'>
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-800/50 border border-gray-700/30 rounded-lg p-4 mb-3 backdrop-blur-sm'>
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={audioData?.url}
        preload='metadata'
        style={{ display: 'none' }}
      />

      {/* Segment Label */}
      <div className='text-gray-300 text-sm font-medium mb-3 flex items-center gap-2'>
        <span className='bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs'>
          Segment {segmentNumber}
        </span>
        <span className='text-gray-400 text-xs'>
          Voice-over Audio
        </span>
        {audioData?.model && (
          <span className='text-gray-500 text-xs'>
            • {audioData.model}
          </span>
        )}
      </div>

      {/* Waveform Canvas */}
      <div className='relative mb-3'>
        <canvas
          ref={canvasRef}
          width={300}
          height={60}
          className='w-full h-15 cursor-pointer rounded border border-gray-600/30'
          onClick={handleSeek}
          style={{ maxWidth: '100%', height: '60px' }}
        />
        
        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded'>
            <div className='text-gray-400 text-xs flex items-center gap-2'>
              <div className='w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin'></div>
              Loading audio...
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading || error}
            className='w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isPlaying ? (
              // Pause icon
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
                <rect x='6' y='4' width='4' height='16' fill='currentColor' className='text-blue-300' />
                <rect x='14' y='4' width='4' height='16' fill='currentColor' className='text-blue-300' />
              </svg>
            ) : (
              // Play icon
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
                <polygon points='5,3 19,12 5,21' fill='currentColor' className='text-blue-300' />
              </svg>
            )}
          </button>

          {/* Time Display */}
          <div className='text-gray-400 text-xs font-mono'>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isLoading || error}
            className='p-1.5 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            title='Download audio'
          >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' className='text-gray-300'>
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
              <polyline points='7,10 12,15 17,10' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
              <line x1='12' y1='15' x2='12' y2='3' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/>
            </svg>
          </button>

          {/* Audio Size Info */}
          {audioData?.audioSize && (
            <span className='text-gray-500 text-xs'>
              {Math.round(audioData.audioSize / 1024)}KB
            </span>
          )}
        </div>
      </div>

      {/* Add to Timeline Button */}
      {onAddToTimeline && (
        <div className='mt-3 pt-3 border-t border-gray-700/30'>
          <button
            onClick={() => onAddToTimeline(audioData, segmentNumber)}
            disabled={isLoading || error}
            className='w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium'
          >
            Add to Timeline
          </button>
        </div>
      )}

      {/* Credit Usage Info */}
      {audioData?.credits && (
        <div className='mt-2 text-gray-500 text-xs'>
          Credits used: {audioData.credits.used} • Balance: {audioData.credits.balance}
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
