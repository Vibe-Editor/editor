const API_BASE_URL = "https://backend.usuals.ai";

// Segmentation API
export const segmentationApi = {
  getSegmentation: async (prompt) => {
    try {
      const response = await fetch(`${API_BASE_URL}/segmentation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch segmentation: ${response.status}`);
      }

      const data = await response.json();
      console.log("Segmentation response:", data);

      if (!data.segments || !Array.isArray(data.segments)) {
        throw new Error("Invalid response format: missing segments array");
      }

      // Ensure art_style exists for downstream calls
      if (!data.artStyle) {
        console.warn("segmentation API did not return artStyle; falling back to style");
        data.artStyle = data.style || "";
      }

      // Validate art_style is not empty
      if (!data.artStyle || data.artStyle.trim() === "") {
        throw new Error("artStyle is required but was empty or missing from segmentation response");
      }

      return data;
    } catch (error) {
      console.error("Error in getSegmentation:", error);
      throw error;
    }
  },
};

// Image generation API wrapper
export const imageApi = {
  generateImage: async (visual_prompt, artStyle) => {
    try {
      const response = await fetch(`${API_BASE_URL}/image-gen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visual_prompt, art_style: artStyle }),
      });

      console.log("Sending to image-gen:", { visual_prompt, art_style: artStyle });

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.status}`);
      }

      const data = await response.json();
      console.log("Image generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateImage:", error);
      throw error;
    }
  },
};

// Video generation API wrapper
export const videoApi = {
  generateVideo: async (animation_prompt, image_url, artStyle) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video-gen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animation_prompt,
          image_url,
          art_style: artStyle,
        }),
      });

      console.log("Sending to video-gen:", { animation_prompt, image_url, art_style: artStyle });

      if (!response.ok) {
        throw new Error(`Failed to generate video: ${response.status}`);
      }

      const data = await response.json();
      console.log("Video generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateVideo:", error);
      throw error;
    }
  },
};
