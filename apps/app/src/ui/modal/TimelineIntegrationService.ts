import { VideoElement, CONSTANTS } from './VideoEditModal.types';
import { convertS3ToCloudFront } from "../../config/video-editing";
import { ITimelineStore } from "../../states/timelineStore";

export class TimelineIntegrationService {
  static async addVideoToTimeline(
    editedVideoResult: { s3Key: string },
    timelineState: ITimelineStore
  ): Promise<void> {
    if (!editedVideoResult || !editedVideoResult.s3Key) {
      throw new Error("No S3 key provided for timeline addition");
    }

    // Get the CloudFront URL for the edited video
    const cloudFrontUrl = convertS3ToCloudFront(editedVideoResult.s3Key);

    // Calculate the end position of current timeline
    const currentTimeline = timelineState.timeline;
    let endPosition = 0;

    if (currentTimeline && Object.keys(currentTimeline).length > 0) {
      Object.values(currentTimeline).forEach((element: any) => {
        if (element && typeof element === "object") {
          const elementEndTime =
            (element.startTime || 0) + (element.duration || 0);
          endPosition = Math.max(endPosition, elementEndTime);
        }
      });
    }

    // Create the new video element
    const videoId = Date.now();
    const newVideoElement: VideoElement = {
      filetype: "video",
      key: `seg-edited-${videoId}`,
      localpath: undefined,
      blob: cloudFrontUrl,
      url: cloudFrontUrl,
      src: cloudFrontUrl,
      priority: 0,
      track: 0,
      startTime: endPosition,
      duration: CONSTANTS.DEFAULT_DURATION,
      location: CONSTANTS.DEFAULT_LOCATION,
      timelineOptions: CONSTANTS.DEFAULT_TIMELINE_OPTIONS,
      width: CONSTANTS.DEFAULT_DIMENSIONS.width,
      height: CONSTANTS.DEFAULT_DIMENSIONS.height,
      ratio: CONSTANTS.DEFAULT_RATIO,
      opacity: CONSTANTS.DEFAULT_OPACITY,
      rotation: CONSTANTS.DEFAULT_ROTATION,
      animation: CONSTANTS.DEFAULT_ANIMATION,
      trim: CONSTANTS.DEFAULT_TRIM,
      isExistAudio: true,
      codec: CONSTANTS.DEFAULT_CODEC,
      speed: CONSTANTS.DEFAULT_SPEED,
      filter: CONSTANTS.DEFAULT_FILTER,
      origin: CONSTANTS.DEFAULT_ORIGIN,
    };

    // Add the video element to the timeline store
    const updatedTimeline = {
      ...currentTimeline,
      [newVideoElement.key]: newVideoElement,
    };

    timelineState.patchTimeline(updatedTimeline);

    // Trigger UI update
    const elementTimelineCanvas = document.querySelector("element-timeline-canvas");
    if (elementTimelineCanvas) {
      elementTimelineCanvas.requestUpdate();
    }
  }
}
