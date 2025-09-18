import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../hooks/useAuthStore";
import { assets } from "../../assets/assets";

const STATUS_MESSAGES = [
  "Analyzing your story arc...",
  "Selecting matching visual motifs...",
  "Composing scenes and transitions...",
  "Tuning color and lighting...",
  "Syncing motion and pacing...",
  "Finalizing render plan...",
];

// Paste your S3 video URLs here (must be CORS-accessible). Now 7 items (2-3-2 layout).
// Example: 'https://your-bucket.s3.amazonaws.com/path/to/video.mp4'
const LOADING_VIDEOS = [
  {
    id: "v1",
    src: "https://ds0fghatf06yb.cloudfront.net/cmfl73asq03m3p0il6r1q3uti/videos/cmfl7g1ux03n5p0ilgu9yhovk/588a5440-b90e-4efb-9efe-884f50f13dc8.mp4",
  },
  {
    id: "v2",
    src: "https://ds0fghatf06yb.cloudfront.net/cmfl73asq03m3p0il6r1q3uti/videos/cmfl7g1ux03n5p0ilgu9yhovk/6c7f3cfa-ae2c-47b0-9b9e-064443a3ea9e.mp4",
  },
  {
    id: "v3",
    src: "https://ds0fghatf06yb.cloudfront.net/cmfl73asq03m3p0il6r1q3uti/videos/cmfl7g1ux03n5p0ilgu9yhovk/d68b2032-3ffd-4cc8-8044-91f4cf9a008d.mp4",
  },
  {
    id: "v4",
    src: "https://ds0fghatf06yb.cloudfront.net/cmfl73asq03m3p0il6r1q3uti/videos/cmfl7g1ux03n5p0ilgu9yhovk/659d4720-2949-468e-8510-cf99f5cbe2d2.mp4",
  },
  {
    id: "v5",
    src: "https://ds0fghatf06yb.cloudfront.net/cmfl73asq03m3p0il6r1q3uti/videos/cmfl7g1ux03n5p0ilgu9yhovk/a65c4a10-cd28-4f12-ac0e-84542d614f20.mp4",
  },
  {
    id: "v6",
    src: "https://ds0fghatf06yb.cloudfront.net/cmfl73asq03m3p0il6r1q3uti/videos/cmfl7g1ux03n5p0ilgu9yhovk/a019d446-45b5-4e77-b7af-917532e27fa6.mp4",
  },
  {
    id: "v7",
    src: "https://ds0fghatf06yb.cloudfront.net/cmfp89m7400hip0pbum4m3qtu/videos/cmfp8alik00icp0pb9nt7ny7s/ab66b55f-b7db-4fc6-ba71-a25ab47014ab.mp4", // Placeholder for 7th video - to be provided later
  },
];

const TOTAL_DURATION_MS = 15000; // 15 seconds

const Loading = ({ onDone, onCancel }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Get user data for avatar
  const { user } = useAuthStore();

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const progress = Math.min(1, elapsedMs / TOTAL_DURATION_MS);

  const currentMessage = useMemo(() => {
    const step = Math.floor(progress * STATUS_MESSAGES.length);
    const index = Math.min(STATUS_MESSAGES.length - 1, step);
    return STATUS_MESSAGES[index];
  }, [progress]);

  useEffect(() => {
    let rafId;
    let start;

    const tick = (ts) => {
      if (!start) start = ts;
      const diff = ts - start;
      setElapsedMs(diff);
      if (diff < TOTAL_DURATION_MS) {
        rafId = requestAnimationFrame(tick);
      } else {
        setIsComplete(true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Safe sources (filter out empties so layout still renders gracefully)
  const sources = useMemo(() => {
    const filled = LOADING_VIDEOS.map((v) => ({
      ...v,
      src: (v.src || "").trim(),
    }));
    return filled;
  }, []);

  return (
    <div className='w-full h-screen bg-gradient-to-b from-[#373738] to-[#1D1D1D] flex flex-col relative'>
      {/* Radial gradient overlay */}
      <div
        className='absolute inset-0 opacity-60'
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at center, #3A2849 0%, transparent 70%, transparent 100%)",
        }}
      ></div>

      {/* Small gradient above center */}
      <div
        className='absolute inset-0'
        style={{
          background:
            "radial-gradient(ellipse 40% 20% at center top 25%, #556771B2 0%, transparent 60%, transparent 100%)",
        }}
      ></div>

      {/* Small gradient below center */}
      <div
        className='absolute inset-0'
        style={{
          background:
            "radial-gradient(ellipse 40% 20% at center bottom 25%, #556771B2 0%, transparent 60%, transparent 100%)",
        }}
      ></div>
      {/* Header elements copied from ProjectEditor.jsx */}
      <div className='absolute top-6 left-6 z-10 flex items-center gap-3'>
        <img src={assets.SandBoxLogo} alt='Usuals.ai' className='w-10 h-10' />
        <div className='flex flex-col'>
          <h1 className='text-2xl text-white font-semibold'>Usuals</h1>
        </div>
      </div>

      {/* Top Right Buttons */}
      <div className='absolute top-6 right-6 z-10 flex items-center gap-3'>
        {/* Credits Button */}
        <div
          className='text-[#F9D312] hover:text-[#F9D312] hover:bg-[#f9d21240] transition-colors border-1 border-[#F9D312] bg-[#f9d21229] px-3 py-1.5 rounded-lg cursor-pointer'
          aria-label='Credits'
          title='Credits'
        >
          <div className='flex items-center gap-2'>
            <svg
              width='14'
              height='14'
              viewBox='0 0 14 14'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z'
                stroke='#F9D312'
                strokeWidth='1.33'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M5.86848 5.46472C6.2645 5.0687 6.4625 4.87069 6.69083 4.7965C6.89168 4.73124 7.10802 4.73124 7.30887 4.7965C7.53719 4.87069 7.7352 5.0687 8.13122 5.46472L8.53515 5.86864C8.93116 6.26466 9.12917 6.46267 9.20336 6.69099C9.26862 6.89184 9.26862 7.10819 9.20336 7.30903C9.12917 7.53736 8.93116 7.73537 8.53515 8.13138L8.13122 8.53531C7.7352 8.93132 7.53719 9.12933 7.30887 9.20352C7.10802 9.26878 6.89168 9.26878 6.69083 9.20352C6.4625 9.12933 6.2645 8.93132 5.86848 8.53531L5.46455 8.13138C5.06854 7.73537 4.87053 7.53736 4.79634 7.30903C4.73108 7.10819 4.73108 6.89184 4.79634 6.69099C4.87053 6.46267 5.06854 6.26466 5.46455 5.86864L5.86848 5.46472Z'
                stroke='#F9D312'
                strokeWidth='1.33'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <span className='text-base'>2000</span>
          </div>
        </div>

        {/* User Avatar */}
        {user?.email && (
          <div className='w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20'>
            <span className='text-black font-semibold text-lg'>
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Center Content Area */}
      <div className='flex-1 flex flex-col px-6 pt-16'>
        {/* Loading Text - aligned with header */}
        <div className='text-center mb-6'>
          <h2 className='text-white text-4xl font-semibold mb-2'>
            Loading your <span className='text-[#F9D312]'>Video</span>
          </h2>
          <p className='text-gray-300 text-lg'>Please wait for a few seconds</p>
        </div>

        <div className='flex-1 flex items-center justify-center -mt-8'>
          <div className='relative w-full max-w-5xl'>
            {!isComplete ? (
              <>
                {/* New 7-video layout: 2-3-2 arrangement */}
                <div className='flex flex-col gap-4'>
                  {/* Top Row - 2 videos */}
                  <div className='flex gap-4 justify-center'>
                    <div className='relative w-80 h-48 rounded-2xl overflow-hidden bg-gray-900'>
                      <video
                        key={sources[0]?.src || "v1"}
                        src={sources[0]?.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className='absolute inset-0 w-full h-full object-cover block'
                      />
                    </div>
                    <div className='relative w-80 h-48 rounded-2xl overflow-hidden bg-gray-900'>
                      <video
                        key={sources[1]?.src || "v2"}
                        src={sources[1]?.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className='absolute inset-0 w-full h-full object-cover block'
                      />
                    </div>
                  </div>

                  {/* Middle Row - 3 videos */}
                  <div className='flex gap-4 justify-center'>
                    <div className='relative w-80 h-48 rounded-2xl overflow-hidden bg-gray-900'>
                      <video
                        key={sources[2]?.src || "v3"}
                        src={sources[2]?.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className='absolute inset-0 w-full h-full object-cover block'
                      />
                    </div>
                    <div className='relative w-80 h-48 rounded-2xl overflow-hidden bg-gray-900'>
                      <video
                        key={sources[3]?.src || "v4"}
                        src={sources[3]?.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className='absolute inset-0 w-full h-full object-cover block'
                      />
                    </div>
                    <div className='relative w-80 h-48 rounded-2xl overflow-hidden bg-gray-900'>
                      <video
                        key={sources[4]?.src || "v5"}
                        src={sources[4]?.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className='absolute inset-0 w-full h-full object-cover block'
                      />
                    </div>
                  </div>

                  {/* Bottom Row - 2 videos */}
                  <div className='flex gap-4 justify-center'>
                    <div className='relative w-80 h-48 rounded-2xl overflow-hidden bg-gray-900'>
                      <video
                        key={sources[5]?.src || "v6"}
                        src={sources[5]?.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className='absolute inset-0 w-full h-full object-cover block'
                      />
                    </div>
                    <div className='relative w-80 h-48 rounded-2xl overflow-hidden bg-gray-900'>
                      {sources[6]?.src ? (
                        <video
                          key={sources[6]?.src || "v7"}
                          src={sources[6]?.src}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className='absolute inset-0 w-full h-full object-cover block'
                        />
                      ) : (
                        <div className='absolute inset-0 w-full h-full flex items-center justify-center bg-gray-800'>
                          <div className='text-gray-500 text-lg'>
                            Video 7 Coming Soon
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center text-center py-10'>
                <div className='w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center mb-4'>
                  <svg
                    className='w-7 h-7 text-black'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <h2 className='text-white text-2xl font-semibold mb-2'>
                  Your videos are ready
                </h2>
                <p className='text-gray-400 mb-6'>
                  Everything is set. You can add them to your timeline now.
                </p>
                <div className='flex items-center gap-3'>
                  <button
                    className='px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-medium transition-colors'
                    onClick={onDone}
                  >
                    Add to timeline
                  </button>
                  {onCancel && (
                    <button
                      className='px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors'
                      onClick={onCancel}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar - Fixed at bottom with full width */}
        {!isComplete && (
          <div className='absolute bottom-0 left-0 right-0 w-full h-2 bg-gray-800'>
            <div
              className='h-full bg-yellow-400 transition-[width] duration-150 ease-linear'
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Loading;
