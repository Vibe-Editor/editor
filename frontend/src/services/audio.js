import { API_BASE_URL, CLOUDFRONT_URL } from "../config/baseurl";
import { getAuthHeaders } from "./api";

/**
 * Audio Generation API Service
 */
export const audioApi = {
  /**
   * Generate voice-over for a specific segment
   * @param {Object} params - Parameters for voice generation
   * @param {string} params.narration - The text script from the segment
   * @param {string} params.segmentId - The unique ID of the segment
   * @param {string} params.projectId - The ID of the project
   * @param {string} params.voiceId - The ID of the voice model
   * @returns {Promise} API response
   */
  async generateVoiceOver(params) {
    const { narration, segmentId, projectId, voiceId } = params;
    
    console.log('🎤 Generating voice-over:', { segmentId, projectId, voiceId, narrationLength: narration?.length });
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/voice-gen`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          narration,
          segmentId,
          projectId,
          voiceId,
          modelId:'eleven_v3',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to generate voice-over (${response.status})`);
      }

      const result = await response.json();
      console.log('🎤 Voice-over generation successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Voice-over generation failed:', error);
      throw error;
    }
  },

  /**
   * Fetch audio history for a project
   * @param {string} projectId - The ID of the project
   * @returns {Promise} API response with audio history
   */
  async getAudioHistory(projectId) {
    console.log('🎤 Fetching audio history for project:', projectId);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/voice-gen/history?projectId=${projectId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch audio history (${response.status})`);
      }

      const result = await response.json();
      console.log('🎤 Audio history fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Audio history fetch failed:', error);
      throw error;
    }
  },

  /**
   * Get audio URL from S3 key
   * @param {string} s3Key - The S3 key for the audio file
   * @returns {string} Full audio URL
   */
  getAudioUrl(s3Key) {
    if (!s3Key) {
      console.warn('⚠️ getAudioUrl called with empty s3Key');
      return null;
    }
    
    // Use CloudFront URL for audio files similar to videos
    const audioUrl = `${CLOUDFRONT_URL}/${s3Key}`;
    console.log('🎵 Generated audio URL:', audioUrl);
    return audioUrl;
  },
};

export default audioApi;
