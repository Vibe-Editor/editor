import { getAuthHeaders } from "./api";
import axios from "axios";
import { API_BASE_URL } from "../config/baseurl.js";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Template service for handling template-related API calls
 */
export const templateService = {
  /**
   * Find similar templates based on description
   * @param {string} description - Description of the video to find similar templates for
   * @returns {Promise<Object>} Response containing templates array and totalCount
   */
  async findSimilarTemplates(description) {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        "/video-templates/find-similar",
        {
          description: description
        },
        { headers }
      );
      return data;
    } catch (error) {
      console.error("Error finding similar templates:", error);
      throw error;
    }
  }
};
