import { contextBridge, ipcRenderer } from "electron";

const request = {
  app: {
    forceClose: () => ipcRenderer.send("app:forceClose"),
    restart: () => ipcRenderer.send("app:restart"),
    getResourcesPath: () => ipcRenderer.invoke("app:getResourcesPath"),
    getTempPath: () => ipcRenderer.invoke("app:getTempPath"),
    getAppInfo: () => ipcRenderer.invoke("app:getAppInfo"),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
    openFile: (extension) => ipcRenderer.invoke("dialog:openFile", extension),
    exportVideo: () => ipcRenderer.invoke("dialog:exportVideo"),
  },
  store: {
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
    get: (key) => ipcRenderer.invoke("store:get", key),
    delete: (key) => ipcRenderer.invoke("store:delete", key),
  },
  font: {
    getLists: () => ipcRenderer.invoke("font:getLists"),
    getLocalFontLists: () => ipcRenderer.invoke("font:getLocalFontLists"),
  },
  project: {
    save: () => ipcRenderer.invoke("dialog:saveProject"),
  },
  desktopCapturer: {
    getSources: () => ipcRenderer.invoke("desktopCapturer:getSources"),
  },
  overlayRecord: {
    show: () => ipcRenderer.invoke("overlayRecord:show"),
    stop: () => ipcRenderer.invoke("overlayRecord:stop"),
  },
  filesystem: {
    getDirectory: (dir) => ipcRenderer.invoke("filesystem:getDirectory", dir),
    openDirectory: (path) => ipcRenderer.send("OPEN_PATH", path),
    test: () => ipcRenderer.invoke("filesystem:test"),
    mkdir: (path, options) =>
      ipcRenderer.invoke("filesystem:mkdir", path, options),
    emptyDirSync: (path) => ipcRenderer.invoke("filesystem:emptyDirSync", path),
    removeDirectory: (path) =>
      ipcRenderer.invoke("filesystem:removeDirectory", path),

    writeFile: (filename, data, options) =>
      ipcRenderer.invoke("filesystem:writeFile", filename, data, options),
    readFile: (filename) => ipcRenderer.invoke("filesystem:readFile", filename),
    existFile: (filepath) =>
      ipcRenderer.invoke("filesystem:existFile", filepath),
    removeFile: (filepath) =>
      ipcRenderer.invoke("filesystem:removeFile", filepath),
  },
  progressBar: {
    test: () => ipcRenderer.send("PROGRESSBARTEST"),
  },
  ffmpeg: {
    getMetadata: (bloburl, mediapath) =>
      ipcRenderer.invoke("GET_METADATA", bloburl, mediapath),
    combineFrame: (outputDir, elementId) =>
      ipcRenderer.invoke("ffmpeg:combineFrame", outputDir, elementId),
    extractAudioFromVideo: (outputAudio, videoPath) =>
      ipcRenderer.invoke(
        "ffmpeg:extractAudioFromVideo",
        outputAudio,
        videoPath,
      ),
    installFFmpeg: () => ipcRenderer.send("DOWNLOAD_FFMPEG"),
  },
  render: {
    outputVideo: (elements, options) =>
      ipcRenderer.send("RENDER", elements, options),
    v2: {
      sendFrame: (base64Data) =>
        ipcRenderer.send("render:v2:sendFrame", base64Data),
      finishStream: () => ipcRenderer.send("render:v2:finishStream"),
      start: (options, timeline) =>
        ipcRenderer.send("render:v2:start", options, timeline),
    },
    offscreen: {
      readyToRender: () => ipcRenderer.invoke("render:offscreen:readyToRender"),
      start: (options, timeline) =>
        ipcRenderer.send("render:offscreen:start", options, timeline),
      sendFrame: (base64Data, pers) =>
        ipcRenderer.send("render:offscreen:sendFrame", base64Data, pers),
      finishStream: () => ipcRenderer.send("render:offscreen:finishStream"),
    },
  },
  url: {
    openUrl: (url) => ipcRenderer.send("OPEN_URL", url),
  },
  ai: {
    stt: (path) => ipcRenderer.invoke("ai:stt", path),
    text: (model, question) => ipcRenderer.invoke("ai:text", model, question),
    setKey: (key) => ipcRenderer.invoke("ai:setKey", key),
    getKey: () => ipcRenderer.invoke("ai:getKey"),
    runMcpServer: () => ipcRenderer.invoke("ai:runMcpServer"),
  },
  auth: {
    initiateLogin: () => ipcRenderer.invoke("auth:initiateLogin"),
    checkStatus: () => ipcRenderer.invoke("auth:checkStatus"),
    logout: () => ipcRenderer.invoke("auth:logout"),
    getToken: () => ipcRenderer.invoke("auth:getToken"),
  },
  payment: {
    openStripe: (paymentUrl) => ipcRenderer.invoke("payment:openStripe", paymentUrl),
    close: () => ipcRenderer.invoke("payment:close"),
    onResult: (callback) => ipcRenderer.on("stripe-payment-result", callback),
    removeResultListener: () => ipcRenderer.removeAllListeners("stripe-payment-result"),
  },
  stream: {
    saveBufferToVideo: (arrayBuffer) =>
      ipcRenderer.invoke("stream:saveBufferToVideo", arrayBuffer),

    saveBufferToAudio: (arrayBuffer) =>
      ipcRenderer.invoke("stream:saveBufferToAudio", arrayBuffer),

    saveBufferToTempFile: (arrayBuffer, ext) =>
      ipcRenderer.invoke("stream:saveBufferToTempFile", arrayBuffer, ext),
  },
  ytdlp: {
    downloadVideo: (url, options) =>
      ipcRenderer.invoke("ytdlp:downloadVideo", url, options),
  },
  extension: {
    openDir: (dir) => ipcRenderer.invoke("extension:open:dir", dir),
    openFile: (file) => ipcRenderer.invoke("extension:open:file", file),
  },
  media: {
    backgroundRemove: (path) =>
      ipcRenderer.invoke("media:backgroundRemove", path),
  },
  selfhosted: {
    run: () => ipcRenderer.invoke("selfhosted:run"),
  },
  // Expose timeline helpers so any renderer (React widget) can invoke even if custom bridge is missing
  timeline: {
    addByUrl: (list) => ipcRenderer.invoke("extension:timeline:addByUrl", list),
    addByUrlWithDir: (list) => ipcRenderer.invoke("extension:timeline:addByUrlWithDir", list),
    addFromDir: (dirPath) => ipcRenderer.invoke("extension:timeline:addFromDir", dirPath),
    addAudioByUrl: (list) => ipcRenderer.invoke("extension:timeline:addAudioByUrl", list),
    addAudioByUrlWithDir: (list) => ipcRenderer.invoke("extension:timeline:addAudioByUrlWithDir", list),
  },
};

const response = {
  app: {
    forceClose: (callback) => ipcRenderer.on("WHEN_CLOSE_EVENT", callback),
    getAppPath: (callback) => ipcRenderer.on("GET_PATH", callback),
  },
  auth: {
    loginSuccess: (callback) => ipcRenderer.on("LOGIN_SUCCESS", callback),
  },
  filesystem: {
    getAllDirectory: (callback) => ipcRenderer.on("RES_ALL_DIR", callback),
  },
  render: {
    progressing: (callback) => ipcRenderer.on("PROCESSING", callback),
    finish: (callback) => ipcRenderer.on("PROCESSING_FINISH", callback),
    error: (callback) => ipcRenderer.on("PROCESSING_ERROR", callback),
    finishCombineFrame: (callback) =>
      ipcRenderer.on("FINISH_COMBINE_FRAME", callback),
    offscreen: {
      start: (callback) => ipcRenderer.on("render:offscreen:start", callback),
    },
  },
  overlayRecord: {
    stop: (callback) => ipcRenderer.on("overlayRecord:stop:res", callback),
  },
  ffmpeg: {
    getMetadata: (callback) => ipcRenderer.on("GET_METADATA", callback),
    extractAudioFromVideoProgress: (callback) =>
      ipcRenderer.on("ffmpeg:extractAudioFromVideo:progress", callback),
    extractAudioFromVideoFinish: (callback) =>
      ipcRenderer.on("ffmpeg:extractAudioFromVideo:finish", callback),
  },
  ytdlp: {
    finish: (callback) => ipcRenderer.on("ytdlp:finish", callback),
  },
  shortcut: {
    controlS: (callback) => ipcRenderer.on("SHORTCUT_CONTROL_S", callback),
    controlO: (callback) => ipcRenderer.on("SHORTCUT_CONTROL_O", callback),
  },
  timeline: {
    get: (callback) => ipcRenderer.on("timeline:get", callback),
    add: (callback) => ipcRenderer.on("timeline:add", callback),
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      req: request,
      res: response,
    });
  } catch (error) {
    console.error(error);
  }
}

// Add extension bridge so frontend (ChatWidget) can use window.api.ext.timeline.addByUrl
const extension = {
  timeline: {
    get: () => ipcRenderer.invoke("extension:timeline:get"),
    add: (timelineElement) =>
      ipcRenderer.invoke("extension:timeline:add", timelineElement),
    addByUrl: (list) =>
      ipcRenderer.invoke("extension:timeline:addByUrl", list),
    addByUrlWithDir: (list) =>
      ipcRenderer.invoke("extension:timeline:addByUrlWithDir", list),
    addFromDir: (dirPath) => ipcRenderer.invoke("extension:timeline:addFromDir", dirPath),
    addAudioByUrl: (list) =>
      ipcRenderer.invoke("extension:timeline:addAudioByUrl", list),
    addAudioByUrlWithDir: (list) =>
      ipcRenderer.invoke("extension:timeline:addAudioByUrlWithDir", list),
  },
};

try {
  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld("api", {
      ext: extension,
    });
  } else {
    // When contextIsolation is disabled, we can assign directly.
    // This covers dev environments where the flag is off.
    (window as any).api = { ext: extension };
  }
} catch (error) {
  console.error("Failed to expose api in preload", error);
}
