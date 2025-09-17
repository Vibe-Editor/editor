import axios from "axios";
import { API_BASE_URL } from "../config/baseurl.js";
import { getAuthHeaders } from "./api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Prompt Optimizer API wrapper
export const promptOptimizerApi = {
  // Optimize a prompt and generate a video in a single request
  optimizeAndGenerate: async ({
    jsonPrompt,
    description,
    userPreferences,
    segmentId,
    projectId,
  }) => {
    try {
      const headers = await getAuthHeaders();
      const payload = {
        jsonPrompt,
        description,
        userPreferences,
        segmentId,
        projectId,
      };

      const { data } = await axiosInstance.post(
        "/prompt-optimizer/optimize-and-generate",
        payload,
        { headers },
      );
      return data;
    } catch (error) {
      console.error("Error in optimizeAndGenerate:", error);
      throw error;
    }
  },
};


