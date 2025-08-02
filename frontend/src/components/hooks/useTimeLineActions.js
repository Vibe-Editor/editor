import { useState, useMemo, useEffect } from "react";

export const useTimelineActions = ({
  selectedScript,
  generatedVideos,
  storedVideosMap,
  setError,
}) => {
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState({
    expected: 0,
    added: 0,
  });

  // Helper map combining stored data so UI shows even after reload
  const combinedVideosMap = useMemo(
    () => ({
      ...generatedVideos,
      ...storedVideosMap,
    }),
    [generatedVideos, storedVideosMap]
  );

  const canSendTimeline =
    Object.keys(generatedVideos).length > 0 ||
    Object.keys(storedVideosMap).length > 0;

  // Listen for timeline add events
  useEffect(() => {
    if (window?.electronAPI?.res?.timeline?.add) {
      window.electronAPI.res.timeline.add((_evt, payload) => {
        setTimelineProgress((prev) => ({
          ...prev,
          added: prev.added + Object.keys(payload || {}).length,
        }));
      });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers to call the various IPC bridges (we prefer the silent one first)
  const tryAddViaPreload = async (payload) => {
    const addByUrlFn = window?.api?.ext?.timeline?.addByUrl;
    const addByUrlWithDir = window?.api?.ext?.timeline?.addByUrlWithDir;

    if (!addByUrlFn) return false;

    const resMain = await addByUrlFn(payload);
    if (resMain?.status === 1 || resMain === undefined) return true;
    if (addByUrlWithDir) {
      const resDir = await addByUrlWithDir(payload);
      return resDir?.status === 1 || resDir === undefined;
    }
    return false;
  };

  const tryAddViaElectronBridge = async (payload) => {
    if (!window?.electronAPI?.req?.timeline?.addByUrl) return false;

    if (window.electronAPI.req.timeline.addByUrlWithDir) {
      await window.electronAPI.req.timeline.addByUrlWithDir(payload);
    } else {
      await window.electronAPI.req.timeline.addByUrl(payload);
    }
    return true;
  };

  const tryAddViaIpcRenderer = async (payload) => {
    if (!window.require) return false;
    const { ipcRenderer } = window.require("electron");
    await ipcRenderer.invoke("extension:timeline:addByUrlWithDir", payload);
    return true;
  };

  const addPayloadToTimeline = async (payload) => {
    if (await tryAddViaPreload(payload)) return true;
    if (await tryAddViaElectronBridge(payload)) return true;
    if (await tryAddViaIpcRenderer(payload)) return true;
    return false;
  };

  // ---------------------------------------------------------------------------
  const sendVideosToTimeline = async () => {
    if (addingTimeline) return;

    let payload = [];
    if (selectedScript) {
      payload = selectedScript.segments
        .filter((s) => combinedVideosMap[s.id])
        .sort((a, b) => a.id - b.id)
        .map((s) => ({ id: s.id, url: combinedVideosMap[s.id] }));
    }

    if (payload.length === 0) {
      payload = Object.entries(combinedVideosMap).map(([id, url]) => {
        const numId = Number(id);
        return { id: isNaN(numId) ? id : numId, url };
      });
      const allNumeric = payload.every((p) => typeof p.id === "number");
      if (allNumeric) payload.sort((a, b) => a.id - b.id);
    }

    if (payload.length === 0) {
      setError("No videos to add.");
      return;
    }

    setAddingTimeline(true);
    const success = await addPayloadToTimeline(payload);
    if (success) {
      setTimelineProgress({ expected: payload.length, added: 0 });
    } else {
      setError("Failed to add videos to timeline.");
    }
    setAddingTimeline(false);
  };

  const addSingleVideoToTimeline = async (segmentId) => {
    if (addingTimeline) return;
    const videoUrl =
      combinedVideosMap[segmentId] || combinedVideosMap[String(segmentId)];
    if (!videoUrl) {
      setError("Video not found.");
      return;
    }
    const payload = [{ id: Number(segmentId), url: videoUrl }];
    setAddingTimeline(true);
    const success = await addPayloadToTimeline(payload);
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
    canSendTimeline,
    sendVideosToTimeline,
    addSingleVideoToTimeline,
    combinedVideosMap,
  };
};