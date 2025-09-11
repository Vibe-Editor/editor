import React, { useState, useRef, useEffect } from "react";

/**
 * Audio Player Component with waveform visualization, controls, and download
 */
const AudioPlayer = ({ audioData, segmentNumber, onAddToTimeline }) => {
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
      console.error("Audio loading error:", e);
      setError("Failed to load audio");
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioData?.url]);

  // Draw waveform with progress indicator
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate progress
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = width * progress;

    // Draw waveform bars
    const barWidth = 2;
    const barGap = 1;
    const totalBars = Math.floor(width / (barWidth + barGap));

    for (let i = 0; i < totalBars; i++) {
      const x = i * (barWidth + barGap);
      // Generate varied heights for realistic waveform
      const barHeight =
        Math.abs(
          Math.sin(i * 0.1) * 12 +
            Math.cos(i * 0.15) * 8 +
            Math.sin(i * 0.05) * 6,
        ) + 4;
      const y = (height - barHeight) / 2;

      // Color based on progress - white for played, gray for unplayed
      if (x < progressX) {
        ctx.fillStyle = "#ffffff"; // White for played portion
      } else {
        ctx.fillStyle = "#6b7280"; // Gray for unplayed portion
      }

      ctx.fillRect(x, y, barWidth, barHeight);
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
      console.error("Audio play error:", error);
      setError("Failed to play audio");
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

    const link = document.createElement("a");
    link.href = audioData.url;
    link.download = `segment-${segmentNumber}-audio.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-3'>
        <div className='text-red-300 text-sm'>❌ {error}</div>
      </div>
    );
  }

  return (
    <div className='bg-[#FFFFFF0D] rounded-xl p-2 mb-2 max-w-md mx-auto'>
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={audioData?.url}
        preload='metadata'
        style={{ display: "none" }}
      />

      {/* Header with title and action buttons */}
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-1.5'>
          {/* Album cover placeholder */}
          <div className='w-6 h-6 rounded flex items-center justify-center'>
            <svg
              width='12'
              height='12'
              viewBox='0 0 24 24'
              fill='none'
              className='text-gray-300'
            >
              <path
                d='M9 18V5l12-2v13'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <circle
                cx='6'
                cy='18'
                r='3'
                stroke='currentColor'
                strokeWidth='2'
              />
              <circle
                cx='18'
                cy='16'
                r='3'
                stroke='currentColor'
                strokeWidth='2'
              />
            </svg>
          </div>
          <span className='text-white text-xs font-medium'>
            {audioData?.title || `Segment ${segmentNumber}`}
          </span>
        </div>

        <div className='flex items-center gap-1'>
          {/* Download Button */}
          <div
            onClick={handleDownload}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isLoading || error
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-700"
            }`}
            title='Download audio'
          >
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              className='text-gray-300'
            >
              <path
                d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <polyline
                points='7,10 12,15 17,10'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <line
                x1='12'
                y1='15'
                x2='12'
                y2='3'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Waveform and Controls */}
      <div className='flex items-center gap-2'>
        {/* Play/Pause Button */}
        <div
          onClick={togglePlay}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isLoading || error
              ? "opacity-50 cursor-not-allowed "
              : ""
          }`}
        >
          {isPlaying ? (
            // Pause icon
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
              <rect
                x='6'
                y='4'
                width='4'
                height='16'
                fill='currentColor'
                className='text-white'
              />
              <rect
                x='14'
                y='4'
                width='4'
                height='16'
                fill='currentColor'
                className='text-white'
              />
            </svg>
          ) : (
            // Play icon
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
              <polygon
                points='8,5 19,12 8,19'
                fill='currentColor'
                className='text-white'
              />
            </svg>
          )}
        </div>

        {/* Waveform and Time Container */}
        <div className='flex-1 flex items-center gap-1.5'>
          {/* Waveform Canvas */}
          <div className='relative flex-1'>
            <canvas
              ref={canvasRef}
              width={300}
              height={20}
              className='w-full h-5 cursor-pointer'
              onClick={handleSeek}
              style={{ maxWidth: "100%", height: "20px" }}
            />

            {isLoading && (
              <div className='absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded'>
                <div className='text-gray-400 text-xs flex items-center gap-1'>
                  <div className='w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin'></div>
                  Loading...
                </div>
              </div>
            )}
          </div>

          {/* Time Display */}
          <div className='text-gray-400 text-xs font-mono min-w-[1.5rem]'>
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
