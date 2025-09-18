import { getAuthHeaders } from "./api";
import { API_BASE_URL } from "../config/baseurl.js";

export const agentApi = {
  // Start streaming agent run with EventSource (better for SSE)
  startAgentRunStreamWithEventSource: async (
    userInput,
    userId,
    segmentId,
    projectId,
  ) => {
    try {
      const headers = await getAuthHeaders();

      // Ensure prompt is a valid string
      if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
        throw new Error("Invalid prompt: must be a non-empty string");
      }

      const body = {
        prompt: userInput.trim(),
        segmentId: segmentId || `workflow-${Date.now()}`,
        projectId: projectId,
      };

      console.log("EventSource Text-to-Video Workflow API request:", {
        body,
        headers,
      });

      // Use the new text-to-video workflow endpoint
      const url = new URL(`${API_BASE_URL}/texttovideo/workflow`);

      // For EventSource, we need to send the data differently
      // Let's make a POST request first to start the stream, then connect via EventSource
      const initResponse = await fetch(url.toString(), {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
      });

      console.log(
        "Text-to-Video Workflow init response:",
        initResponse.status,
        initResponse.headers,
      );

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        console.error("Text-to-Video Workflow init failed:", errorText);
        throw new Error(`HTTP error! status: ${initResponse.status} - ${errorText}`);
      }

      return initResponse;
    } catch (error) {
      console.error("Error starting text-to-video workflow stream:", error);
      throw error;
    }
  },

  // Start streaming agent run with fetch (main method for text-to-video workflow)
  startAgentRunStream: async (userInput, userId, segmentId, projectId) => {
    try {
      const headers = await getAuthHeaders();

      // Ensure prompt is a valid string
      if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
        throw new Error("Invalid prompt: must be a non-empty string");
      }

      const body = {
        prompt: userInput.trim(),
        segmentId: segmentId || `workflow-${Date.now()}`,
        projectId: projectId,
      };

      console.log("🚀 Text-to-Video Workflow API request:", { body, headers });

      const response = await fetch(`${API_BASE_URL}/texttovideo/workflow`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(body),
      });

      console.log(
        "📡 Text-to-Video Workflow response:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Text-to-Video Workflow failed:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      // Return the response for streaming
      return response;
    } catch (error) {
      console.error("Error starting text-to-video workflow stream:", error);
      throw error;
    }
  },

  // Handle approval request for text-to-video workflow
  handleApproval: async (
    approvalId,
    approved,
    userId,
    additionalData = null,
  ) => {
    try {
      const headers = await getAuthHeaders();

      const body = {
        approvalId,
        approved,
        ...(additionalData || {}), // Spread additional data directly into the body
      };

      console.log("🟢 Sending text-to-video workflow approval request:", {
        url: `${API_BASE_URL}/texttovideo/approval`,
        headers,
        body,
      });

      const response = await fetch(`${API_BASE_URL}/texttovideo/approval`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log(
        "📡 Text-to-video workflow approval response status:",
        response.status,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Text-to-video workflow approval request failed:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();
      console.log("✅ Text-to-video workflow approval response:", result);
      return result;
    } catch (error) {
      console.error("Failed to handle text-to-video workflow approval:", error);
      throw error;
    }
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/agent/approvals`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting pending approvals:", error);
      throw error;
    }
  },
};
