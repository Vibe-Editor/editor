import React, { useEffect, useMemo, useState } from "react";

const STATUS_MESSAGES = [
  "Analyzing your story arc...",
  "Selecting matching visual motifs...",
  "Composing scenes and transitions...",
  "Tuning color and lighting...",
  "Syncing motion and pacing...",
  "Finalizing render plan...",
];

// Paste your S3 video URLs here (must be CORS-accessible). Exactly 6 items.
// Example: 'https://your-bucket.s3.amazonaws.com/path/to/video.mp4'
const BENTO_VIDEOS = [
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
];

const TOTAL_DURATION_MS = 15000; // 15 seconds

const Loading = ({ onDone, onCancel }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

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
    const filled = BENTO_VIDEOS.map((v) => ({
      ...v,
      src: (v.src || "").trim(),
    }));
    return filled;
  }, []);

  return (
    <div className='w-full h-screen bg-black flex items-center justify-center'>
      <div className='relative w-full px-6'>
        {!isComplete ? (
          <>
            {/* Bento Grid fills most of the viewport height */}
            <div className='grid grid-cols-12 grid-rows-6 gap-4 mb-8 h-[70vh] sm:h-[72vh] lg:h-[75vh]'>
              {/* Small 1 */}
              <div className='relative col-span-12 sm:col-span-6 lg:col-span-3 row-span-2 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900'>
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

              {/* Small 2 */}
              <div className='relative col-span-12 sm:col-span-6 lg:col-span-3 row-span-2 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900'>
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

              {/* Big 1 */}
              <div className='relative col-span-12 lg:col-span-6 row-span-4 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900'>
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

              {/* Big 2 */}
              <div className='relative col-span-12 lg:col-span-6 row-span-4 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900'>
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

              {/* Small 3 */}
              <div className='relative col-span-12 sm:col-span-6 lg:col-span-3 row-span-2 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900'>
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

              {/* Small 4 */}
              <div className='relative col-span-12 sm:col-span-6 lg:col-span-3 row-span-2 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900'>
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
            </div>

            {/* Status Text */}
            <div className='text-center mb-4 min-h-[28px]'>
              <p className='text-gray-300 text-base'>{currentMessage}</p>
            </div>

            {/* Progress Bar */}
            <div className='w-full h-2 bg-gray-800 rounded-full overflow-hidden'>
              <div
                className='h-full bg-yellow-400 transition-[width] duration-150 ease-linear'
                style={{ width: `${progress * 100}%` }}
              />
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
  );
};

export default Loading;
