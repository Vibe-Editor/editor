import { getAuthHeaders } from "./api";
import axios from "axios";
import { API_BASE_URL } from "../config/baseurl.js";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Story Engine API wrapper
export const storyEngineApi = {
  // Generate concept with preferences
  generateConceptWithPreferences: async (projectId) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        `/projects/${projectId}/generate-concept-with-preferences`,
        {},
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in generateConceptWithPreferences:", error);
      throw error;
    }
  },

  // Update story segment
  updateStorySegment: async (segmentId, content) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.put(
        `/projects/${segmentId}/storyline`,
        { content },
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in updateStorySegment:", error);
      throw error;
    }
  },

  // Regenerate segments with word limit
  regenerateSegments: async (segmentIds, maxWordCount) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.put(
        `/projects/${segmentIds[0]}/regenerate-segments`,
        { 
          segmentIds,
          maxWordCount 
        },
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in regenerateSegments:", error);
      throw error;
    }
  },
};
