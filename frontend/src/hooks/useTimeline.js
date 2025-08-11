import { useState } from "react";

export const useTimeline = () => {
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState({
    expected: 0,
    added: 0,
  });

  const sendVideosToTimeline = async (
    selectedScript,
    combinedVideosMap,
    setError,
  ) => {
    if (addingTimeline) return;

    let payload = [];
    if (selectedScript) {
      // Prefer the unified map so we cover both freshly generated and previously stored videos
      payload = selectedScript.segments
        .filter((s) => combinedVideosMap[s.id])
        .sort((a, b) => a.id - b.id)
        .map((s) => ({ id: s.id, url: combinedVideosMap[s.id] }));
    }

    // Fallback – use every video we currently know about
    if (payload.length === 0) {
      payload = Object.entries(combinedVideosMap).map(([id, url]) => {
        const numId = Number(id);
        return {
          id: isNaN(numId) ? id : numId,
          url,
        };
      });

      // If all IDs are numeric, sort them; otherwise keep original order
      const allNumeric = payload.every((p) => typeof p.id === "number");
      if (allNumeric) {
        payload.sort((a, b) => a.id - b.id);
      }
    }

    if (payload.length === 0) {
      setError("No videos to add.");
      return;
    }

    let success = false;
    setAddingTimeline(true);
    try {
      const addByUrlWithDir = window?.api?.ext?.timeline?.addByUrlWithDir;
      const addByUrlFn = window?.api?.ext?.timeline?.addByUrl;
      if (addByUrlFn) {
        if (addByUrlWithDir) {
          await addByUrlWithDir(payload);
        } else {
          await addByUrlFn(payload);
        }
        success = true;
      } else if (window?.electronAPI?.req?.timeline?.addByUrl) {
        if (window.electronAPI.req.timeline.addByUrlWithDir) {
          await window.electronAPI.req.timeline.addByUrlWithDir(payload);
        } else {
          await window.electronAPI.req.timeline.addByUrl(payload);
        }
        success = true;
      } else if (window.require) {
        const { ipcRenderer } = window.require("electron");
        await ipcRenderer.invoke("extension:timeline:addByUrlWithDir", payload);
        success = true;
      }
    } catch (err) {
      console.error("timeline add failed", err);
    }

    if (success) {
      setTimelineProgress({ expected: payload.length, added: 0 });
    } else {
      setError("Failed to add videos to timeline.");
    }
    setAddingTimeline(false);
  };

  const addSingleVideoToTimeline = async (
    segmentId,
    combinedVideosMap,
    setError,
  ) => {
    if (addingTimeline) return;
    const videoUrl =
      combinedVideosMap[segmentId] || combinedVideosMap[String(segmentId)];
    if (!videoUrl) {
      setError("Video not found.");
      return;
    }

    const payload = [{ id: Number(segmentId), url: videoUrl }];
    setAddingTimeline(true);
    let success = false;
    try {
      const addByUrlWithDir = window?.api?.ext?.timeline?.addByUrlWithDir;
      const addByUrlFn = window?.api?.ext?.timeline?.addByUrl;
      if (addByUrlFn) {
        if (addByUrlWithDir) {
          await addByUrlWithDir(payload);
        } else {
          await addByUrlFn(payload);
        }
        success = true;
      } else if (window?.electronAPI?.req?.timeline?.addByUrl) {
        if (window.electronAPI.req.timeline.addByUrlWithDir) {
          await window.electronAPI.req.timeline.addByUrlWithDir(payload);
        } else {
          await window.electronAPI.req.timeline.addByUrl(payload);
        }
        success = true;
      } else if (window.require) {
        const { ipcRenderer } = window.require("electron");
        await ipcRenderer.invoke("extension:timeline:addByUrlWithDir", payload);
        success = true;
      }
    } catch (err) {
      console.error("timeline add failed", err);
    }

    if (success) {
      setTimelineProgress({ expected: 1, added: 0 });
    } else {
      setError("Failed to add video to timeline.");
    }
    setAddingTimeline(false);
  };

  return {
    addingTimeline,
    timelineProgress,
    setTimelineProgress,
    sendVideosToTimeline,
    addSingleVideoToTimeline,
  };
};
