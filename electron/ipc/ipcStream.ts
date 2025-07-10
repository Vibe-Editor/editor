import { app, dialog } from "electron";
import fs from "fs";
import { mainWindow } from "../lib/window";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const ipcStream = {
  saveBufferToVideo: async (event, arrayBuffer) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save Video",
      buttonLabel: "Export",
      filters: [
        {
          name: "Export Video",
          extensions: ["webm"],
        },
      ],
      properties: [],
    });

    if (filePath) {
      const result = new Promise((resolve, reject) => {
        fs.writeFile(filePath, arrayBuffer, async (err) => {
          if (err) {
            console.error("Failed to save video file:", err);
            resolve({
              status: false,
            });
          } else {
            console.log("Video file saved successfully:", filePath);
            resolve({
              status: true,
              path: filePath,
            });
          }
        });
      });

      return result;
    }
  },

  saveBufferToAudio: async (event, arrayBuffer) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save Audio",
      buttonLabel: "Export",
      filters: [
        {
          name: "Export Audio",
          extensions: ["wav"],
        },
      ],
      properties: [],
    });

    if (filePath) {
      const result = new Promise((resolve, reject) => {
        fs.writeFile(filePath, arrayBuffer, async (err) => {
          if (err) {
            console.error("Failed to save video file:", err);
            resolve({
              status: false,
            });
          } else {
            console.log("Video file saved successfully:", filePath);
            resolve({
              status: true,
              path: filePath,
            });
          }
        });
      });

      return result;
    }
  },

  saveBufferToTempFile: async (event, arrayBuffer, ext) => {
    const tmppath = app.getPath("temp");
    const filename = uuidv4() + "." + ext;

    const filePath = path.join(tmppath, filename);

    if (filePath) {
      const result = new Promise((resolve, reject) => {
        fs.writeFile(filePath, arrayBuffer, async (err) => {
          if (err) {
            console.error("Failed to save file:", err);
            resolve({
              status: false,
            });
          } else {
            console.log("file saved successfully:", filePath);
            resolve({
              status: true,
              path: filePath,
            });
          }
        });
      });

      return result;
    }
  },

  // Download a remote file directly to disk using Node streams to avoid renderer memory overhead
  downloadFromUrl: async (event, fileUrl, savePath) => {
    const { default: https } = await import('https');
    const { default: http } = await import('http');
    const protocol = fileUrl.startsWith('https') ? https : http;

    return new Promise((resolve) => {
      const fileStream = fs.createWriteStream(savePath);

      protocol.get(fileUrl, (response) => {
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            resolve({ status: true, path: savePath });
          });
        });
      }).on('error', (err) => {
        console.error('Download error:', err);
        fs.unlink(savePath, () => {});
        resolve({ status: false, error: err.message });
      });
    });
  },
};
