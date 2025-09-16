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
};
