// Types and interfaces for VideoEditModal
export interface VideoElement {
  id?: string;
  filetype: string;
  key: string;
  localpath?: string;
  blob?: string;
  url?: string;
  src?: string;
  priority: number;
  track: number;
  startTime: number;
  duration: number;
  location: { x: number; y: number };
  timelineOptions: { color: string };
  width: number;
  height: number;
  ratio: number;
  opacity: number;
  rotation: number;
  animation: {
    opacity: { isActivate: boolean; x: number[]; ax: number[] };
    position: { isActivate: boolean; x: number[]; y: number[]; ax: number[]; ay: number[] };
    scale: { isActivate: boolean; x: number[]; ax: number[] };
    rotation: { isActivate: boolean; x: number[]; ax: number[] };
  };
  trim: { startTime: number; endTime: number };
  isExistAudio: boolean;
  codec: { video: string; audio: string };
  speed: number;
  filter: { enable: boolean; list: any[] };
  origin: { width: number; height: number };
}

export interface EditedVideoResult {
  s3Key: string;
  videoUrl?: string;
  creditsUsed?: number;
}

export interface UploadResult {
  cloudFrontUrl: string;
}

// Constants
export const CONSTANTS = {
  DEFAULT_DURATION: 5000,
  DEFAULT_DIMENSIONS: { width: 1920, height: 1080 },
  DEFAULT_RATIO: 16 / 9,
  DEFAULT_OPACITY: 100,
  DEFAULT_ROTATION: 0,
  DEFAULT_SPEED: 1,
  DEFAULT_TRIM: { startTime: 0, endTime: 5000 },
  DEFAULT_ANIMATION: {
    opacity: { isActivate: false, x: [] as number[], ax: [] as number[] },
    position: { isActivate: false, x: [] as number[], y: [] as number[], ax: [] as number[], ay: [] as number[] },
    scale: { isActivate: false, x: [] as number[], ax: [] as number[] },
    rotation: { isActivate: false, x: [] as number[], ax: [] as number[] },
  },
  DEFAULT_TIMELINE_OPTIONS: { color: "rgb(71, 59, 179)" },
  DEFAULT_LOCATION: { x: 0, y: 0 },
  DEFAULT_CODEC: { video: "", audio: "" },
  DEFAULT_FILTER: { enable: false, list: [] as any[] },
  DEFAULT_ORIGIN: { width: 1920, height: 1080 },
  AUTH_TOKEN_KEYS: ["authToken", "jwt", "token"],
  STORAGE_KEYS: ["localStorage", "sessionStorage"],
  API_ENDPOINTS: {
    UPLOAD: "https://backend.usuals.ai/upload/video",
  },
  ERROR_MESSAGES: {
    NO_VIDEO_FOUND: "No CloudFront URL found for video. Please ensure the video is properly loaded.",
    UPLOAD_FAILED: "Failed to upload video to CloudFront. Please try again.",
    NO_S3_KEY: "No S3 key received from API",
    ELECTRON_API_UNAVAILABLE: "Electron file system API not available",
    NO_CLOUDFRONT_URL: "No CloudFront URL returned from upload",
  },
  STATUS_MESSAGES: {
    PREPARING: "Preparing video for editing...",
    PROCESSING: "Processing video with AI...",
    UPLOADING: "Uploading video to CloudFront...",
    ADDING: "Adding to timeline...",
    SUCCESS: "Video added to timeline successfully!",
  },
} as const;
