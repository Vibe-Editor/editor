import { useState, useCallback } from 'react';
import { audioApi } from '../../services/audio';

/**
 * Custom hook for audio generation functionality
 */
export const useAudio = () => {
  const [generatedAudios, setGeneratedAudios] = useState({});
  const [audioGenerationProgress, setAudioGenerationProgress] = useState({});
  const [audioGenerationComplete, setAudioGenerationComplete] = useState(false);
  const [audioGenerationLoading, setAudioGenerationLoading] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('EkK5I93UQWFDigLMpZcX'); // James (Default)

  // Voice model options
  const voiceModels = [
    { id: 'EkK5I93UQWFDigLMpZcX', name: 'James (Default)' },
    { id: 'BpjGufoPiobT79j2vtj4', name: 'Priyanka' },
    { id: 'kdmDKE6EkgrWrrykO9Qt', name: 'Alexandra' },
    { id: '1SM7GgM6IMuvQlz2BwM3', name: 'Mark' },
    { id: 'scOwDtmlUjD3prqpp97I', name: 'Sam' },
  ];

  /**
   * Generate audio for all segments that have videos
   * @param {Array} segments - Array of script segments
   * @param {string} projectId - Current project ID
   * @param {Object} generatedVideos - Map of generated videos by segment ID
   * @param {Function} onProgress - Callback for progress updates
   * @param {Function} onComplete - Callback for individual segment completion
   * @param {Function} onError - Callback for errors
   */
  const generateAudioForSegments = useCallback(async (
    segments, 
    projectId, 
    generatedVideos, 
    onProgress = () => {}, 
    onComplete = () => {}, 
    onError = () => {}
  ) => {
    if (!segments || !projectId) {
      console.error('❌ Missing segments or projectId for audio generation');
      return;
    }

    console.log('🎤 Starting audio generation for segments:', { 
      segmentCount: segments.length, 
      projectId, 
      voiceId: selectedVoiceId,
      generatedVideosCount: Object.keys(generatedVideos).length
    });

    setAudioGenerationLoading(true);
    setAudioGenerationProgress({});
    setAudioGenerationComplete(false);

    const audiosMap = {};
    
    // Filter segments that have generated videos
    const segmentsWithVideos = segments.filter(segment => 
      generatedVideos[segment.id] || segment.videoUrl || segment.video_url
    );

    console.log('🎤 Segments with videos to process:', segmentsWithVideos.length);

    if (segmentsWithVideos.length === 0) {
      console.warn('⚠️ No segments with videos found for audio generation');
      setAudioGenerationLoading(false);
      return;
    }

    try {
      // Process segments sequentially to maintain order
      for (let index = 0; index < segmentsWithVideos.length; index++) {
        const segment = segmentsWithVideos[index];
        const segmentId = segment.id;

        console.log(`🎤 Processing segment ${index + 1}/${segmentsWithVideos.length}: ${segmentId}`);

        // Update progress for this segment
        setAudioGenerationProgress(prev => ({
          ...prev,
          [segmentId]: {
            status: 'generating',
            index: index + 1,
            total: segmentsWithVideos.length,
          }
        }));

        // Call progress callback
        onProgress({
          current: index + 1,
          total: segmentsWithVideos.length,
          segmentId,
          status: 'generating'
        });

        try {
          // Generate audio for this segment
          const result = await audioApi.generateVoiceOver({
            narration: segment.narration,
            segmentId: segmentId,
            projectId: projectId,
            voiceId: selectedVoiceId,
          });

          console.log(`✅ Audio generated for segment ${segmentId}:`, result);

          if (result.s3_key) {
            const audioUrl = audioApi.getAudioUrl(result.s3_key);
            audiosMap[segmentId] = {
              url: audioUrl,
              s3Key: result.s3_key,
              segmentId: segmentId,
              credits: result.credits,
              audioSize: result.audio_size_bytes,
              model: result.model,
            };

            // Update progress for this segment
            setAudioGenerationProgress(prev => ({
              ...prev,
              [segmentId]: {
                status: 'completed',
                index: index + 1,
                total: segmentsWithVideos.length,
              }
            }));

            // Call completion callback for this segment
            onComplete({
              segmentId,
              audioData: audiosMap[segmentId],
              index: index + 1,
              total: segmentsWithVideos.length,
            });

          } else {
            console.warn(`⚠️ No s3_key returned for segment ${segmentId}`);
            setAudioGenerationProgress(prev => ({
              ...prev,
              [segmentId]: {
                status: 'error',
                index: index + 1,
                total: segmentsWithVideos.length,
                error: 'No audio key returned from API',
              }
            }));
          }

        } catch (segmentError) {
          console.error(`❌ Error generating audio for segment ${segmentId}:`, segmentError);
          
          setAudioGenerationProgress(prev => ({
            ...prev,
            [segmentId]: {
              status: 'error',
              index: index + 1,
              total: segmentsWithVideos.length,
              error: segmentError.message,
            }
          }));

          // Call error callback for this segment
          onError({
            segmentId,
            error: segmentError.message,
            index: index + 1,
            total: segmentsWithVideos.length,
          });
        }

        // Small delay between requests to avoid overwhelming the API
        if (index < segmentsWithVideos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update generated audios map
      setGeneratedAudios(prev => ({ ...prev, ...audiosMap }));
      setAudioGenerationComplete(true);

      console.log('✅ Audio generation completed for all segments:', audiosMap);

    } catch (error) {
      console.error('❌ Error in audio generation process:', error);
      onError({
        error: error.message,
        segmentId: null,
      });
    } finally {
      setAudioGenerationLoading(false);
    }
  }, [selectedVoiceId]);

  /**
   * Load audio history for a project
   * @param {string} projectId - Project ID to load audio history for
   */
  const loadAudioHistory = useCallback(async (projectId) => {
    if (!projectId) {
      console.error('❌ Missing projectId for audio history');
      return;
    }

    console.log('🎤 Loading audio history for project:', projectId);

    try {
      const response = await audioApi.getAudioHistory(projectId);
      
      if (response && Array.isArray(response)) {
        const audiosMap = {};
        
        response.forEach(audioData => {
          if (audioData.segmentId && audioData.s3_key) {
            const audioUrl = audioApi.getAudioUrl(audioData.s3_key);
            audiosMap[audioData.segmentId] = {
              url: audioUrl,
              s3Key: audioData.s3_key,
              segmentId: audioData.segmentId,
              credits: audioData.credits,
              audioSize: audioData.audio_size_bytes,
              model: audioData.model,
            };
          }
        });

        console.log('✅ Audio history loaded:', audiosMap);
        setGeneratedAudios(audiosMap);
        setAudioGenerationComplete(Object.keys(audiosMap).length > 0);
        
        return audiosMap;
      } else {
        console.log('ℹ️ No audio history found for project');
        return {};
      }
    } catch (error) {
      console.error('❌ Error loading audio history:', error);
      throw error;
    }
  }, []);

  /**
   * Reset audio state
   */
  const resetAudioState = useCallback(() => {
    console.log('🔄 Resetting audio state');
    setGeneratedAudios({});
    setAudioGenerationProgress({});
    setAudioGenerationComplete(false);
    setAudioGenerationLoading(false);
    setSelectedVoiceId('EkK5I93UQWFDigLMpZcX'); // Reset to James (Default)
  }, []);

  /**
   * Check if audio generation is available (videos must be completed first)
   * @param {Object} generatedVideos - Map of generated videos
   * @param {Array} segments - Array of script segments
   * @returns {boolean} Whether audio generation is available
   */
  const canGenerateAudio = useCallback((generatedVideos, segments) => {
    if (!segments || segments.length === 0) return false;
    if (!generatedVideos || Object.keys(generatedVideos).length === 0) return false;

    // Check if we have videos for at least some segments
    const segmentsWithVideos = segments.filter(segment => 
      generatedVideos[segment.id] || segment.videoUrl || segment.video_url
    );

    return segmentsWithVideos.length > 0;
  }, []);

  return {
    // State
    generatedAudios,
    audioGenerationProgress,
    audioGenerationComplete,
    audioGenerationLoading,
    selectedVoiceId,
    voiceModels,

    // Actions
    setSelectedVoiceId,
    generateAudioForSegments,
    loadAudioHistory,
    resetAudioState,
    canGenerateAudio,
  };
};

export default useAudio;
