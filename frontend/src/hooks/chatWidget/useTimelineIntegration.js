import { useState } from "react";
import { useProjectStore } from "../../store/useProjectStore";

export const useTimelineIntegration = () => {
  // Get storedVideosMap from Zustand store
  const { storedVideosMap, setStoredVideosMap } = useProjectStore();
  
  // Timeline states
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [addingAudioTimeline, setAddingAudioTimeline] = useState(false);
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [messageCounter, setMessageCounter] = useState(0);
  const [allUserMessages, setAllUserMessages] = useState([]);

  // Reset timeline states
  const resetTimelineStates = () => {
    setAddingTimeline(false);
    setAddingAudioTimeline(false);
    setCurrentUserMessage("");
    setMessageCounter(0);
    setAllUserMessages([]);
  };

  const updateStoredVideosMap = (videosMap, selectedProject) => {
    const updatedMap = { ...storedVideosMap, ...videosMap };
    setStoredVideosMap(updatedMap);
  };

  return {
    // States
    addingTimeline,
    addingAudioTimeline,
    currentUserMessage,
    messageCounter,
    allUserMessages,
    storedVideosMap,

    // Setters
    setAddingTimeline,
    setAddingAudioTimeline,
    setCurrentUserMessage,
    setMessageCounter,
    setAllUserMessages,
    setStoredVideosMap,

    // Actions
    resetTimelineStates,
    updateStoredVideosMap,
  };
};
