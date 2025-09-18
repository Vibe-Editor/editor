import { getAuthHeaders } from "./api";
import axios from "axios";
import { API_BASE_URL } from "../config/baseurl.js";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Prompt Optimizer service for handling video generation API calls
 */
export const promptOptimizerService = {
  /**
   * Optimize prompt and generate video
   * @param {Object} data - Request data
   * @param {string} data.jsonPrompt - JSON prompt from selected template
   * @param {string} data.description - Description from selected template
   * @param {string} data.userPreferences - User preferences as string
   * @param {string} data.segmentId - Segment ID
   * @param {string} data.projectId - Project ID
   * @returns {Promise<Object>} Response containing optimizedPrompt and s3Key
   */
  async optimizeAndGenerate(data) {
    try {
      const headers = await getAuthHeaders();
      const { data: response } = await axiosInstance.post(
        "/prompt-optimizer/optimize-and-generate",
        {
          jsonPrompt: data.jsonPrompt,
          description: data.description,
          userPreferences: data.userPreferences,
          segmentId: data.segmentId,
          projectId: data.projectId
        },
        { headers }
      );
      return response;
    } catch (error) {
      console.error("Error in optimize and generate:", error);
      throw error;
    }
  }
};
