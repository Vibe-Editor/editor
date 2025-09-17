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
};
