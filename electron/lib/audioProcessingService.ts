import fs from "fs";
import path from "path";
import { detectAudio, removeAudioFromVideo, extractAudioFromVideo, generateAudioFileName, generateNoAudioFileName } from "./audioUtils";

export interface ProcessedVideoResult {
  originalPath: string;
  videoPath: string;
  audioPath?: string;
  hasAudio: boolean;
  duration: number;
}

export class AudioProcessingService {
  static async processVideoForTimeline(inputPath: string, destDir: string, segmentId: string | number): Promise<ProcessedVideoResult> {
    const audioInfo = await detectAudio(inputPath);
    const duration = await this.getVideoDuration(inputPath);
    
    const baseFileName = `seg-${segmentId}-${Date.now()}`;
    const videoOutputPath = path.join(destDir, `${baseFileName}.mp4`);
    
    let audioOutputPath: string | undefined;
    let finalVideoPath = videoOutputPath;

    if (audioInfo.hasAudio) {
      audioOutputPath = path.join(destDir, `${baseFileName}_audio.aac`);
      
      const videoNoAudioPath = path.join(destDir, `${baseFileName}_noaudio.mp4`);
      
      const [videoSuccess, audioSuccess] = await Promise.all([
        removeAudioFromVideo(inputPath, videoNoAudioPath),
        extractAudioFromVideo(inputPath, audioOutputPath)
      ]);

      if (videoSuccess && audioSuccess) {
        finalVideoPath = videoNoAudioPath;
      } else {
        console.warn(`Audio separation failed for ${inputPath}, using original video`);
        fs.copyFileSync(inputPath, videoOutputPath);
        audioOutputPath = undefined;
      }
    } else {
      fs.copyFileSync(inputPath, videoOutputPath);
    }

    return {
      originalPath: inputPath,
      videoPath: finalVideoPath,
      audioPath: audioOutputPath,
      hasAudio: audioInfo.hasAudio && !!audioOutputPath,
      duration
    };
  }

  private static async getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve) => {
      const { spawn } = require("child_process");
      const ffprobe = spawn("ffprobe", [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        filePath
      ]);

      let output = "";
      ffprobe.stdout.on("data", (data) => {
        output += data.toString();
      });

      ffprobe.on("close", () => {
        const duration = parseFloat(output.trim()) || 5;
        resolve(Math.round(duration * 1000));
      });

      ffprobe.on("error", () => {
        resolve(5000);
      });
    });
  }

  static createVideoElement(processedResult: ProcessedVideoResult, cursor: number, track: number = 0) {
    return {
      filetype: "video",
      key: `seg-${Date.now()}`,
      localpath: processedResult.videoPath,
      blob: "",
      priority: 0,
      track,
      startTime: cursor,
      duration: processedResult.duration,
      location: { x: 0, y: 0 },
      timelineOptions: { color: "rgb(71, 59, 179)" },
      width: 1920,
      height: 1080,
      ratio: 16 / 9,
      opacity: 100,
      rotation: 0,
      animation: {
        opacity: { isActivate: false, x: [], ax: [] },
        position: { isActivate: false, x: [], y: [], ax: [], ay: [] },
        scale: { isActivate: false, x: [], ax: [] },
        rotation: { isActivate: false, x: [], ax: [] },
      },
      trim: { startTime: 0, endTime: processedResult.duration },
      isExistAudio: false,
      codec: { video: "", audio: "" },
      speed: 1,
      filter: { enable: false, list: [] },
      origin: { width: 1920, height: 1080 },
    };
  }

  static createAudioElement(processedResult: ProcessedVideoResult, cursor: number, track: number = 1) {
    if (!processedResult.hasAudio || !processedResult.audioPath) {
      return null;
    }

    return {
      filetype: "audio",
      key: `audio-${Date.now()}`,
      localpath: processedResult.audioPath,
      blob: "",
      priority: 0,
      track,
      startTime: cursor,
      duration: processedResult.duration,
      location: { x: 0, y: 0 },
      trim: { startTime: 0, endTime: processedResult.duration },
      speed: 1,
      timelineOptions: {
        color: "rgb(133, 179, 59)",
      },
    };
  }
}
