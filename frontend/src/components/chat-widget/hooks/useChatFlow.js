import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useProjectStore } from '../../../store/useProjectStore';
import { chatApi } from '../../../services/chat';
import { s3Api } from "../../../services/s3";
import { projectApi } from "../../../services/project";
import { conceptWriterApi } from '../../../services/concept-writer';
import { segmentationApi } from "../../../services/segmentationapi";
import { webInfoApi } from "../../../services/web-info";

import {
  getTextCreditCost,
  getImageCreditCost,
  getVideoCreditCost,
  formatCreditDeduction,
} from '../../../lib/pricing';

export function useChatFlow() {
  const { isAuthenticated, user } = useAuth();
  const { 
    fetchBalance,
    selectedProject,
    setSelectedProject: setStoreProject,
    images,
    videos,
    setImages,
    setVideos,
    fetchProjectEssentials
  } = useProjectStore();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({
    0: 'pending', 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending',
  });

  const [storedVideosMap, setStoredVideosMap] = useState(() => {
    try {
      if (selectedProject) {
        return JSON.parse(localStorage.getItem(`project-store-videos`) || "{}");
      }
      return JSON.parse(localStorage.getItem("segmentVideos") || "{}");
    } catch { return {}; }
  });

  const [, setTimelineProgress] = useState({ expected: 0, added: 0 });
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [concepts, setConcepts] = useState(null);
  const [scripts, setScripts] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [generatedVideos, setGeneratedVideos] = useState({});
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [generationProgress, setGenerationProgress] = useState({});
  const [selectedImageModel, setSelectedImageModel] = useState(chatApi.getDefaultModel('IMAGE'));
  const [selectedVideoModel, setSelectedVideoModel] = useState(chatApi.getDefaultModel('VIDEO'));
  const [creditDeductionMessage, setCreditDeductionMessage] = useState(null);

  // Sync project store images and videos with local state
  useEffect(() => {
    if (images && Object.keys(images).length > 0) {
      setGeneratedImages(images);
    }
    if (videos && Object.keys(videos).length > 0) {
      setGeneratedVideos(videos);
      setStoredVideosMap(videos);
    }
  }, [images, videos]);

  const resetFlow = useCallback(() => {
    setConcepts(null);
    setScripts(null);
    setGeneratedImages({});
    setGeneratedVideos({});
    setSelectedConcept(null);
    setSelectedScript(null);
    setGenerationProgress({});
    setCurrentStep(0);
    setStepStatus({ 0: 'pending', 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending' });
    setSelectedImageModel(chatApi.getDefaultModel('IMAGE'));
    setSelectedVideoModel(chatApi.getDefaultModel('VIDEO'));
  }, []);

  const loadProjectData = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      await fetchProjectEssentials(selectedProject.id);
      const [projectConcepts, projectSegmentations] = await Promise.all([
        projectApi.getProjectConcepts(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectSegmentations(selectedProject.id, { page: 1, limit: 50 })
      ]);

      if (projectConcepts?.success && projectConcepts.data?.length > 0) {
        setConcepts(projectConcepts.data);
      }

      if (projectSegmentations?.success && projectSegmentations.data?.[0]?.segments?.length > 0) {
        const firstSegmentation = projectSegmentations.data[0];
        const segments = firstSegmentation.segments.map(seg => ({
          id: seg.segmentId || seg.id,
          visual: seg.visual,
          animation: seg.animation,
          narration: seg.narration,
          s3Key: seg.s3Key || seg.image_s3_key || seg.imageS3Key,
          imageUrl: seg.imageUrl || seg.image_url,
          videoUrl: seg.videoUrl || seg.video_url
        }));
        setSelectedScript({ segments, artStyle: firstSegmentation.artStyle, concept: firstSegmentation.concept });
      }
    } catch {
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedProject, fetchProjectEssentials]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    } else {
      resetFlow();
    }
  }, [selectedProject, loadProjectData, resetFlow]);

  // ... rest of the code remains the same ...

  const runImageGeneration = async () => {
    if (!selectedScript) return setError("Please select a script first");
    setLoading(true); setError(null); updateStepStatus(4, 'loading'); setGenerationProgress({});
    try {
      const { segments, artStyle } = selectedScript;
      const imagesMap = {};
      await Promise.allSettled(segments.map(async (segment) => {
        setGenerationProgress(prev => ({ ...prev, [segment.id]: { type: "image", status: "generating" } }));
        try {
          const result = await chatApi.generateImage({ visual_prompt: segment.visual, art_style: artStyle || "", uuid: segment.id, project_id: selectedProject?.id, model: selectedImageModel });
          if (result.s3_key) {
            imagesMap[segment.id] = await s3Api.downloadImage(result.s3_key);
            segment.s3Key = result.s3_key;
            setGenerationProgress(prev => ({ ...prev, [segment.id]: { type: "image", status: "completed" } }));
          } else {
            setGenerationProgress(prev => ({ ...prev, [segment.id]: { type: "image", status: "error", error: "No image key returned" } }));
          }
        } catch (err) { setGenerationProgress(prev => ({ ...prev, [segment.id]: { type: "image", status: "error", error: err.message } })); }
      }));
      showCreditDeduction("Image Generation", selectedImageModel, segments.length);
      setGeneratedImages(imagesMap);
      setImages(imagesMap); // Update project store
      setSelectedScript(prev => ({ ...prev, segments }));
      updateStepStatus(4, 'done');
      setCurrentStep(5);
    } catch (err) {
      showRequestFailed("Image Generation");
      setError(err.message || "Failed to generate images.");
      updateStepStatus(4, 'pending');
    } finally { setLoading(false); }
  };

  const runVideoGeneration = async () => {
    if (Object.keys(generatedImages).length === 0) return setError("Please generate images first");
    setLoading(true); setError(null); updateStepStatus(5, 'loading'); setGenerationProgress({});
    try {
      const { segments, artStyle } = selectedScript;
      const videosMap = {};
      const validSegments = segments.filter(seg => generatedImages[seg.id]);
      await Promise.allSettled(validSegments.map(async (segment) => {
        setGenerationProgress(prev => ({ ...prev, [segment.id]: { type: "video", status: "generating" } }));
        try {
          const imageUrl = generatedImages[segment.id];
          const imageS3Key = imageUrl.includes('cloudfront.net/') ? imageUrl.split('cloudfront.net/')[1] : null;
          const result = await chatApi.generateVideo({ animation_prompt: segment.animation || segment.visual, art_style: artStyle || "", image_s3_key: imageS3Key, uuid: segment.id, project_id: selectedProject?.id, model: selectedVideoModel });
          if (result.s3_key) {
            videosMap[segment.id] = await s3Api.downloadVideo(result.s3_key);
            setGenerationProgress(prev => ({ ...prev, [segment.id]: { type: "video", status: "completed" } }));
          } else {
            setGenerationProgress(prev => ({ ...prev, [segment.id]: { type: "video", status: "error", error: "No video key returned" } }));
          }
        } catch (err) { setGenerationProgress(prev => ({ ...prev, [segment.id]: { type: "video", status: "error", error: err.message } })); }
      }));
      if (validSegments.length > 0) showCreditDeduction("Video Generation", selectedVideoModel, validSegments.length);
      setGeneratedVideos(videosMap);
      setVideos(videosMap); // Update project store
      updateStepStatus(5, 'done');
    } catch (err) {
      showRequestFailed("Video Generation");
      setError(err.message || "Failed to generate videos.");
      updateStepStatus(5, 'pending');
    } finally { setLoading(false); }
  };

  const handleConceptSelect = (concept) => { setSelectedConcept(concept); updateStepStatus(1, 'done'); setCurrentStep(2); };
  const handleScriptSelect = (script) => { setSelectedScript(script); updateStepStatus(3, 'done'); setCurrentStep(4); };

  const sendVideosToTimeline = async (videoMap) => {
    if (addingTimeline) return;
    const payload = Object.entries(videoMap).map(([id, url]) => ({ id: Number(id), url }));
    if (payload.length === 0) return setError("No videos to add.");
    setAddingTimeline(true);
    try {
      if (window?.api?.ext?.timeline?.addByUrlWithDir) await window.api.ext.timeline.addByUrlWithDir(payload);
      else if (window?.api?.ext?.timeline?.addByUrl) await window.api.ext.timeline.addByUrl(payload);
      else if (window?.electronAPI?.req?.timeline?.addByUrlWithDir) await window.electronAPI.req.timeline.addByUrlWithDir(payload);
      else if (window?.electronAPI?.req?.timeline?.addByUrl) await window.electronAPI.req.timeline.addByUrl(payload);
      else if (window.require) {
        const { ipcRenderer } = window.require("electron");
        await ipcRenderer.invoke("extension:timeline:addByUrlWithDir", payload);
      }
      setTimelineProgress({ expected: payload.length, added: 0 });
    } catch { setError("Failed to add videos to timeline."); }
    setAddingTimeline(false);
  };
  
  const addSingleVideoToTimeline = (segmentId, url) => {
    if (!url) return setError('Video not found.');
    sendVideosToTimeline({ [segmentId]: url });
  };
  
  const combinedVideosMap = useMemo(() => ({ ...generatedVideos, ...storedVideosMap }), [generatedVideos, storedVideosMap]);

  return {
    isAuthenticated, user, prompt, setPrompt, loading, error, setError, selectedProject, setSelectedProject: setStoreProject, addingTimeline, currentStep,
    setCurrentStep, stepStatus, updateStepStatus, concepts, selectedConcept, scripts, selectedScript, generatedImages, generatedVideos,
    generationProgress, selectedImageModel, setSelectedImageModel, selectedVideoModel, setSelectedVideoModel, creditDeductionMessage,
    handleConceptSelect, handleScriptSelect, runConceptWriter, runScriptGeneration, runImageGeneration, runVideoGeneration,
    sendVideosToTimeline: () => sendVideosToTimeline(combinedVideosMap),
    addSingleVideoToTimeline, resetFlow, combinedVideosMap,
  };
}