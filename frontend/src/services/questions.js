import { getAuthHeaders } from "./api";
import axios from "axios";
import { API_BASE_URL } from "../config/baseurl.js";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Questions API wrapper
export const questionsApi = {
  // Get all questions data
  getQuestions: async () => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get("/questions", { headers });
      return data;
    } catch (error) {
      console.error("Error in getQuestions:", error);
      throw error;
    }
  },

  // Create/Save Video Preferences
  createVideoPreferences: async (projectId, preferences) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        `/projects/${projectId}/video-preferences`,
        preferences,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in createVideoPreferences:", error);
      throw error;
    }
  },

  // Update Video Preferences
  updateVideoPreferences: async (projectId, preferences) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.patch(
        `/projects/${projectId}/video-preferences`,
        preferences,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in updateVideoPreferences:", error);
      throw error;
    }
  },

  // Get Video Preferences
  getVideoPreferences: async (projectId) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.get(
        `/projects/${projectId}/video-preferences`,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in getVideoPreferences:", error);
      throw error;
    }
  },

  // Generate segments with preferences
  generateSegmentsWithPreferences: async (projectId, preferences) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        `/projects/${projectId}/generate-segments-with-preferences`,
        preferences,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in generateSegmentsWithPreferences:", error);
      throw error;
    }
  },

  // Generate basic concept
  generateBasicConcept: async (projectId, conceptData) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        `/projects/${projectId}/generate-basic-concept`,
        conceptData,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in generateBasicConcept:", error);
      throw error;
    }
  },
};
