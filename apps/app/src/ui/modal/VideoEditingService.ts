import { VideoElement, EditedVideoResult, UploadResult, CONSTANTS } from './VideoEditModal.types';
import {
  VIDEO_EDITING_CONFIG,
  getVideoEditingApiUrl,
  convertS3ToCloudFront,
  generateProjectId,
} from "../../config/video-editing";

export class VideoEditingService {
  static async getVideoUri(selectedVideoElement: VideoElement): Promise<string> {
    // Extract video ID from the key
    const videoId =
      selectedVideoElement.key?.replace("seg-", "") ||
      selectedVideoElement.id ||
      "";

    // Method 1: Check for existing CloudFront URL in video element
    for (const [key, value] of Object.entries(selectedVideoElement)) {
      if (value && typeof value === "string" && value.includes("cloudfront")) {
        return value;
      }
    }

    // Method 2: Check React stores for video URLs
    try {
      const projectStore = (window as any).__MY_GLOBAL_PROJECT_STORE__;
      if (projectStore) {
        const state = projectStore.getState();

        // Check videos array in project store
        if (state.videos && Array.isArray(state.videos)) {
          const video = state.videos.find((v: any) => v.id === videoId);
          if (video && video.url) {
            return video.url;
          }
        }

        // Check storedVideosMap (backward compatibility)
        if (state.storedVideosMap && videoId && state.storedVideosMap[videoId]) {
          const videoUrl = state.storedVideosMap[videoId];
          if (typeof videoUrl === "string" && videoUrl.includes("cloudfront")) {
            return videoUrl;
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not access project store:", error);
    }

    // Check segment store for video URLs
    try {
      const segmentStore =
        (window as any).useSegmentStore || (window as any).__SEGMENT_STORE__;
      if (segmentStore && segmentStore.getState) {
        const segmentState = segmentStore.getState();

        if (segmentState.projectVideos && videoId && segmentState.projectVideos[videoId]) {
          const videoUrl = segmentState.projectVideos[videoId];
          if (typeof videoUrl === "string" && videoUrl.includes("cloudfront")) {
            return videoUrl;
          }
        }

        if (segmentState.segmentVideos && videoId && segmentState.segmentVideos[videoId]) {
          const videoUrl = segmentState.segmentVideos[videoId];
          if (typeof videoUrl === "string" && videoUrl.includes("cloudfront")) {
            return videoUrl;
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not access segment store:", error);
    }

    // Method 3: Check window.videoStore or other global stores
    const globalStores = [
      (window as any).videoStore,
      (window as any).projectStore,
      (window as any).timelineStore,
    ];

    for (const store of globalStores) {
      if (store && typeof store === "object") {
        if (store.videos && Array.isArray(store.videos)) {
          const video = store.videos.find((v: any) => v.id === videoId);
          if (video && video.url) {
            return video.url;
          }
        }
      }
    }

    // Method 4: Last resort - upload local video to CloudFront
    const localPath = selectedVideoElement.localpath;
    if (
      localPath &&
      typeof localPath === "string" &&
      localPath.startsWith("/")
    ) {
      const uploadResult = await this.uploadVideoToCloudFront(localPath, selectedVideoElement);
      if (uploadResult && uploadResult.cloudFrontUrl) {
        return uploadResult.cloudFrontUrl;
      } else {
        throw new Error(CONSTANTS.ERROR_MESSAGES.UPLOAD_FAILED);
      }
    }

    throw new Error(CONSTANTS.ERROR_MESSAGES.NO_VIDEO_FOUND);
  }

  static async uploadVideoToCloudFront(
    localPath: string,
    selectedVideoElement: VideoElement
  ): Promise<UploadResult> {
    try {
      const projectId = generateProjectId();
      const videoId =
        selectedVideoElement.key?.replace("seg-", "") ||
        `video_${Date.now()}`;

      if (!window.electronAPI?.req?.readFile) {
        throw new Error(CONSTANTS.ERROR_MESSAGES.ELECTRON_API_UNAVAILABLE);
      }

      const fileBuffer = await window.electronAPI.req.readFile(localPath);

      const formData = new FormData();
      const videoBlob = new Blob([fileBuffer], { type: "video/mp4" });
      formData.append("video", videoBlob, `${videoId}.mp4`);
      formData.append("projectId", projectId);
      formData.append("videoId", videoId);

      const uploadUrl = CONSTANTS.API_ENDPOINTS.UPLOAD;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: this.getAuthToken(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      let cloudFrontUrl = result.cloudFrontUrl || result.url;

      if (!cloudFrontUrl && result.s3Key) {
        cloudFrontUrl = convertS3ToCloudFront(result.s3Key);
      }

      if (!cloudFrontUrl) {
        throw new Error(CONSTANTS.ERROR_MESSAGES.NO_CLOUDFRONT_URL);
      }

      return { cloudFrontUrl };
    } catch (error) {
      throw error;
    }
  }

  static async processVideo(
    videoUri: string,
    promptText: string
  ): Promise<EditedVideoResult> {
    const projectId = generateProjectId();
    const apiUrl = getVideoEditingApiUrl(
      VIDEO_EDITING_CONFIG.ENDPOINTS.VIDEO_EDIT_COMPLETE,
      { projectId }
    );

    const requestBody = {
      videoUri: videoUri,
      promptText: promptText.trim(),
      model: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.model,
      ratio: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.ratio,
      seed: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.seed(),
      references: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.references,
      contentModeration: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.contentModeration,
      publicFigureThreshold: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.publicFigureThreshold,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.getAuthToken(),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `API request failed: ${response.status}`;

      switch (response.status) {
        case 400:
          if (
            errorData.error &&
            errorData.error.includes("Failed to fetch asset") &&
            errorData.error.includes("403")
          ) {
            errorMessage = `Video URL not accessible (403 Forbidden). The CloudFront URL might be incorrect or the video doesn't exist at that location.`;
          } else {
            errorMessage =
              errorData.message ||
              errorData.error ||
              "Bad request - check video URI and parameters";
          }
          break;
        case 401:
          errorMessage = "Authentication failed - invalid API key or token";
          break;
        case 429:
          errorMessage = "Rate limit exceeded - please try again later";
          break;
        case 500:
          errorMessage = "Server error - please try again later";
          break;
        default:
          errorMessage =
            errorData.message ||
            errorData.error ||
            `Request failed with status ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.s3Key) {
      throw new Error(CONSTANTS.ERROR_MESSAGES.NO_S3_KEY);
    }

    return result;
  }

  static getAuthToken(): string {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("jwt") ||
      sessionStorage.getItem("token");

    if (token) {
      return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    return "Bearer temp-token";
  }
}
