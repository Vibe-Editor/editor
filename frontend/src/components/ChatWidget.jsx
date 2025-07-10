import { useState } from 'react';
import { segmentationApi, imageApi, videoApi } from '../services/api';
import { AssetController } from '../../../apps/app/src/controllers/asset';
import SegmentList from './SegmentList';
import ComparisonView from './ComparisonView';
import SegmentDetail from './SegmentDetail';
import LoadingSpinner from './LoadingSpinner';

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    localStorage.removeItem('segments');
    localStorage.removeItem('segmentImages');
    localStorage.removeItem('segmentVideos');

    setLoading(true);
    setError(null);
    setResponses(null); // Reset responses
    
    try {
      console.log('Sending parallel requests...'); // Debug log
      
      // Make two parallel requests
      const results = await Promise.all([
        segmentationApi.getSegmentation(prompt),
        segmentationApi.getSegmentation(prompt)
      ]);
      
      console.log('Received both responses:', results); // Debug log
      
      // Validate responses
      if (!results[0] || !results[1]) {
        throw new Error('One or both responses are empty');
      }
      
      setResponses({
        response1: results[0],
        response2: results[1]
      });
      
      console.log('Set responses state:', {
        response1: results[0],
        response2: results[1]
      }); // Debug log
      
      setSelectedResponse(null);
      setSelectedSegment(null);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to generate segments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download generated videos into user-selected directory and insert into timeline
  const handleDownloadToEditor = async () => {
    if (!selectedResponse) return;

    try {
      // Check if we're in Electron environment
      if (typeof window === 'undefined' || !window.electronAPI?.req?.dialog?.openDirectory) {
        setError('This feature is only available in the desktop build.');
        return;
      }

      // Check if downloadFromUrl is available
      if (!window.electronAPI?.req?.stream?.downloadFromUrl) {
        setError('Download functionality not available in this version.');
        return;
      }

      const targetDir = await window.electronAPI.req.dialog.openDirectory();
      if (!targetDir) return; // user cancelled

      const assetCtrl = new AssetController();

      setDownloading(true);

      const importedFiles = [];

      await Promise.all(
        selectedResponse.segments.map(async (segment) => {
          if (!segment.videoUrl) return;

          // derive extension early
          const urlParts = segment.videoUrl.split('.');
          let ext = urlParts[urlParts.length - 1].split('?')[0];
          if (ext.length > 4) ext = 'mp4';

          const filename = `${targetDir}/scene-${segment.id}.${ext}`;

          // Download file directly via Node (no memory overhead)
          const result = await window.electronAPI.req.stream.downloadFromUrl(segment.videoUrl, filename);
          if (!result?.status) {
            throw new Error(`Failed saving scene ${segment.id}: ${result?.error || 'unknown'}`);
          }

          // inject into timeline
          assetCtrl.add(filename);

          importedFiles.push({ filename });
        })
      );

      // After all assets are added, arrange sequentially in timeline
      try {
        // Wait longer for metadata to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));
 
         const elementControl = document.querySelector('element-control');
         if (elementControl) {
           const timelineCopy = { ...elementControl.timeline };
           let currentStart = 0;
           let arrangedCount = 0;
          let retryCount = 0;
          const maxRetries = 3;

          // Retry logic to ensure all videos are properly loaded
          while (retryCount < maxRetries) {
            const timelineKeys = Object.keys(timelineCopy);
            const videoElements = timelineKeys.filter(key => 
              timelineCopy[key].filetype === 'video' && 
              timelineCopy[key].localpath && 
              timelineCopy[key].localpath.includes('scene-')
            );

            console.log(`Attempt ${retryCount + 1}: Found ${videoElements.length} video elements`);

            if (videoElements.length >= importedFiles.length) {
              break; // All videos are loaded
            }

            console.log(`Waiting for more videos to load... (${videoElements.length}/${importedFiles.length})`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            retryCount++;
          }
 
           importedFiles.forEach(({ filename }) => {
             // find the element with matching localpath
             for (const key in timelineCopy) {
               if (timelineCopy[key].localpath === filename) {
                const videoDuration = timelineCopy[key].duration || 5000; // fallback to 5 seconds
                console.log(`Arranging ${filename} at startTime ${currentStart}, duration ${videoDuration}`);
                timelineCopy[key].startTime = currentStart;
                // also adjust trim if needed
                if (timelineCopy[key].trim) {
                  timelineCopy[key].trim.startTime = 0;
                  timelineCopy[key].trim.endTime = videoDuration;
                }
                currentStart += videoDuration;
                arrangedCount++;
                break;
              }
            }
          });
 
          console.log(`Successfully arranged ${arrangedCount}/${importedFiles.length} videos in timeline`);
          elementControl.timelineState.patchTimeline(timelineCopy);
          elementControl.timelineState.checkPointTimeline();

          // Final verification
          setTimeout(() => {
            const finalTimeline = elementControl.timeline;
            const finalVideoCount = Object.keys(finalTimeline).filter(key => 
              finalTimeline[key].filetype === 'video' && 
              finalTimeline[key].localpath && 
              finalTimeline[key].localpath.includes('scene-')
            ).length;
            console.log(`Final timeline has ${finalVideoCount} video elements`);
          }, 2000);
        }
      } catch (err) {
        console.error('Timeline arrangement error', err);
      }

      document
        .querySelector('toast-box')
        ?.showToast({ message: 'Videos imported to timeline', delay: '3000' });
    } catch (err) {
      console.error('Download to editor error', err);
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreferResponse = async (option) => {
    const selectedResp = option === 1 ? responses?.response1 : responses?.response2;
    console.log('Selected response:', option, selectedResp); // Debug log

    if (!selectedResp) {
      setError('Selected response is not available');
      return;
    }

    // Update UI states immediately
    setSelectedResponse(selectedResp);
    setResponses(null);
    setSelectedSegment(null);

    try {
      // Save segments to localStorage for later use
      localStorage.setItem('segments', JSON.stringify(selectedResp.segments));

      // Trigger image generation for every segment in parallel
      setLoading(true);

      // Validate art_style before proceeding
      if (!selectedResp.artStyle || selectedResp.artStyle.trim() === "") {
        throw new Error("artStyle is required for image generation");
      }

      const imageResults = await Promise.all(
        selectedResp.segments.map((segment) => imageApi.generateImage(segment.visual, selectedResp.artStyle))
      );

      const imagesMap = {};
      selectedResp.segments.forEach((segment, idx) => {
        const res = imageResults[idx];
        const url = res?.images?.[0]?.url;
        if (url) {
          imagesMap[segment.id] = url;
        }
      });

      // Persist generated image URLs in localStorage
      localStorage.setItem('segmentImages', JSON.stringify(imagesMap));

      console.log('Image generation completed for all segments', imagesMap);

      // Generate videos for all segments using their respective images
      const videoResults = await Promise.all(
        selectedResp.segments.map((segment) => {
          const imageUrl = imagesMap[segment.id];
          if (!imageUrl) return null;
          return videoApi.generateVideo(
            segment.visual,
            imageUrl,
            selectedResp.artStyle
          );
        })
      );

      const videosMap = {};
      selectedResp.segments.forEach((segment, idx) => {
        const res = videoResults[idx];
        const url = res?.video?.url;
        if (url) {
          videosMap[segment.id] = url;
        }
      });

      // Persist video URLs in localStorage
      localStorage.setItem('segmentVideos', JSON.stringify(videosMap));

      console.log('Video generation completed for all segments', videosMap);

      // Attach generated URLs to the selected response for immediate UI use
      const updatedSegments = selectedResp.segments.map((segment) => ({
        ...segment,
        imageUrl: imagesMap[segment.id],
        videoUrl: videosMap[segment.id],
      }));

      setSelectedResponse({ ...selectedResp, segments: updatedSegments });
      
      // Select the first segment
      if (updatedSegments.length > 0) {
        setSelectedSegment(updatedSegments[0]);
      }
    } catch (err) {
      console.error('Error during generation:', err);
      setError(err.message || 'Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="z-10">
      {/* Floating chat button */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-700 text-white text-2xl flex items-center justify-center shadow-2xl z-[1001]"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
        >
          💬
        </button>
      )}

      {/* Sliding sidebar - now wider */}
      <div className={`fixed top-0 right-0 h-screen w-[80vw] max-w-[1200px] bg-[#0d0d0d] text-white transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} z-[1000] flex flex-col shadow-xl`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 sticky top-0">
          <h2 className="text-lg font-semibold">Segmentation Assistant</h2>
          <button
            className="text-white text-xl focus:outline-none"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - Segment list */}
          {selectedResponse && (
            <div className="w-1/4 border-r border-gray-800 flex flex-col overflow-hidden">
              <SegmentList
                segments={selectedResponse.segments}
                selectedSegmentId={selectedSegment?.id}
                onSegmentClick={setSelectedSegment}
              />
            </div>
          )}

          {/* Main content area */}
          <div className={`flex-1 flex flex-col ${selectedResponse ? 'w-3/4' : 'w-full'}`}>
            <div className="flex-1 overflow-y-auto">
              {loading || downloading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-400 text-center p-4">
                    <p>{error}</p>
                    <button 
                      onClick={() => setError(null)}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : responses ? (
                <ComparisonView
                  response1={responses.response1}
                  response2={responses.response2}
                  onPreferResponse={handlePreferResponse}
                />
              ) : selectedResponse ? (
                <SegmentDetail segment={selectedSegment} />
              ) : (
                <div className="p-4 text-gray-400">
                  Enter a prompt to generate segmentation options.
                </div>
              )}
            </div>

            {/* Input area */}
            <form
              className="p-4 border-t border-gray-800 bg-gray-900 flex gap-2"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                }}
                placeholder="Enter your prompt for segmentation..."
                className="flex-1 rounded-md bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500"
                disabled={loading}
              />
              <button
                type="submit"
                className={`rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </form>
            {/* Download button */}
            {selectedResponse && !loading && !downloading && (
              <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-end">
                <button
                  onClick={handleDownloadToEditor}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md font-medium"
                >
                  Download to Editor
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWidget; 