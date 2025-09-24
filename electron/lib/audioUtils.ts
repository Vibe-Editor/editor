import { spawn } from "child_process";
import path from "path";

export interface AudioInfo {
  hasAudio: boolean;
  duration?: number;
  audioStreams?: number;
}

export async function detectAudio(filePath: string): Promise<AudioInfo> {
  return new Promise((resolve) => {
    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "a",
      "-show_entries", "stream=index,duration",
      "-of", "csv=p=0",
      filePath
    ]);

    let output = "";
    let hasError = false;

    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on("data", (data) => {
      console.warn("ffprobe stderr:", data.toString());
      hasError = true;
    });

    ffprobe.on("close", (code) => {
      if (code !== 0 || hasError) {
        resolve({ hasAudio: false });
        return;
      }

      const lines = output.trim().split('\n').filter(line => line.length > 0);
      const hasAudio = lines.length > 0;
      
      resolve({
        hasAudio,
        audioStreams: lines.length,
        duration: hasAudio ? parseFloat(lines[0].split(',')[1]) || undefined : undefined
      });
    });

    ffprobe.on("error", () => {
      resolve({ hasAudio: false });
    });
  });
}

export async function removeAudioFromVideo(inputPath: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-i", inputPath,
      "-c", "copy",
      "-an",
      outputPath
    ]);

    let hasError = false;

    ffmpeg.stderr.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Error") || output.includes("error")) {
        hasError = true;
      }
    });

    ffmpeg.on("close", (code) => {
      resolve(code === 0 && !hasError);
    });

    ffmpeg.on("error", () => {
      resolve(false);
    });
  });
}

export async function extractAudioFromVideo(inputPath: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-i", inputPath,
      "-vn",
      "-acodec", "copy",
      outputPath
    ]);

    let hasError = false;

    ffmpeg.stderr.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Error") || output.includes("error")) {
        hasError = true;
      }
    });

    ffmpeg.on("close", (code) => {
      resolve(code === 0 && !hasError);
    });

    ffmpeg.on("error", () => {
      resolve(false);
    });
  });
}

export function generateAudioFileName(videoPath: string): string {
  const ext = path.extname(videoPath);
  const base = path.basename(videoPath, ext);
  const dir = path.dirname(videoPath);
  return path.join(dir, `${base}_audio.aac`);
}

export function generateNoAudioFileName(videoPath: string): string {
  const ext = path.extname(videoPath);
  const base = path.basename(videoPath, ext);
  const dir = path.dirname(videoPath);
  return path.join(dir, `${base}_noaudio${ext}`);
}
