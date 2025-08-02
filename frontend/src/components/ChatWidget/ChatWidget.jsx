import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import LoadingSpinner from "../LoadingSpinner";
import CharacterGenerator from "../CharacterGenerator";
import { useAuth } from "../../hooks/useAuth";
import { webInfoApi } from "../../services/web-info";
import { conceptWriterApi } from "../../services/concept-writer";
import { segmentationApi } from "../../services/segmentationapi";
import { chatApi } from "../../services/chat";
import { s3Api } from "../../services/s3";
import { projectApi } from "../../services/project";
import React from "react";

// Import extracted components
import ChatFloatingButton from "./ChatFloatingButton";
import ChatSidebar from "./ChatSidebar";
import CreateProjectModal from "./modals/CreateProjectModal";
import ImagePreviewModal from "./modals/ImagePreviewModal";
import VideoPreviewModal from "./modals/VideoPreviewModal";
import RedoModal from "./modals/RedoModal";

// Import constants and hooks
import { STEPS } from "./constants/chatConstants";
import { useChatFlow } from "./hooks/useChatFlow";

function ChatWidget() {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      const stored = localStorage.getItem('project-store-selectedProject');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });
  const [storedVideosMap, setStoredVideosMap] = useState(() => {
    try {
      const stored = localStorage.getItem('project-store-selectedProject');
      if (stored) {
        const _project = JSON.parse(stored);
        return JSON.parse(localStorage.getItem(`project-store-videos`) || "{}");
      }
      return JSON.parse(localStorage.getItem("segmentVideos") || "{}");
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  const [, setTimelineProgress] = useState({
    expected: 0,
    added: 0,
  });

  const [addingTimeline, setAddingTimeline] = useState(false);
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [showCharacterGenerator, setShowCharacterGenerator] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [collapseSteps, setCollapseSteps] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const nameInputRef = useRef(null);

  // New 6-step flow states
  const [concepts, setConcepts] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [scripts, setScripts] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [generatedVideos, setGeneratedVideos] = useState({});
  const [generationProgress, setGenerationProgress] = useState({});
  // modal for viewing generated images
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  // video preview modal
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [modalVideoUrl, setModalVideoUrl] = useState(null);
  // model selection states
  const [selectedImageModel, setSelectedImageModel] = useState(chatApi.getDefaultModel('IMAGE'));
  const [selectedVideoModel, setSelectedVideoModel] = useState(chatApi.getDefaultModel('VIDEO'));
  // redo modal states
  const [showRedoModal, setShowRedoModal] = useState(false);
  const [redoStepId, setRedoStepId] = useState(null);
  const [redoImageModel, setRedoImageModel] = useState(chatApi.getDefaultModel('IMAGE'));
  const [redoVideoModel, setRedoVideoModel] = useState(chatApi.getDefaultModel('VIDEO'));

  // Use custom hook for flow management
  const {
    currentStep,
    setCurrentStep,
    stepStatus,
    resetFlow,
    updateStepStatus,
    getStepIcon,
    isStepDisabled
  } = useChatFlow(selectedProject, concepts, selectedConcept, scripts, selectedScript, generatedImages, generatedVideos);

  // Function to handle project changes
  const handleProjectChange = () => {
    try {
      const stored = localStorage.getItem('project-store-selectedProject');
      const newSelectedProject = stored ? JSON.parse(stored) : null;
      setSelectedProject(newSelectedProject);
      
      if (newSelectedProject) {
        setStoredVideosMap(
          JSON.parse(localStorage.getItem(`project-store-videos`) || "{}"),
        );
      } else {
        setStoredVideosMap(
          JSON.parse(localStorage.getItem("segmentVideos") || "{}"),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Function to handle project selection from dropdown
  const handleProjectSelect = (project) => {
    console.log('Project selected:', project);
    setSelectedProject(project);
    setShowProjectHistory(false);
    
    if (project) {
      setStoredVideosMap(
        JSON.parse(localStorage.getItem(`project-store-videos`) || "{}"),
      );
      // Reset flow state for new project
      resetFlow();
    } else {
      setStoredVideosMap(
        JSON.parse(localStorage.getItem("segmentVideos") || "{}"),
      );
      resetFlow();
    }
  };

  // Listen for storage events (from other windows/tabs)
  useEffect(() => {
    window.addEventListener("storage", handleProjectChange);
    return () => window.removeEventListener("storage", handleProjectChange);
  }, []);



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

  // Load project data when selectedProject changes
  useEffect(() => {
    console.log('selectedProject changed:', selectedProject);
    if (selectedProject) {
      loadProjectData();
    } else {
      resetFlow();
    }
  }, [selectedProject]);

  const handleStepClick = async (stepId) => {
    if (isStepDisabled(stepId, loading) || loading) return;
    
    setCurrentStep(stepId);
    
    // Only run the step if it's not already done
    if (stepStatus[stepId] !== 'done') {
      switch (stepId) {
        case 0:
          await runConceptWriter();
          break;
        case 2:
          await runScriptGeneration();
          break;
        case 4:
          await runImageGeneration();
          break;
        case 5:
          await runVideoGeneration();
          break;
      }
    }
  };

  const handleRedoStep = async (stepId) => {
    if (loading) return;
    
    // For steps that need model selection, show modal
    if (stepId === 4 || stepId === 5) {
      setRedoStepId(stepId);
      setRedoImageModel(selectedImageModel);
      setRedoVideoModel(selectedVideoModel);
      setShowRedoModal(true);
      return;
    }
    
    // For other steps, run immediately
    setCurrentStep(stepId);
    
    switch (stepId) {
      case 0:
        await runConceptWriter();
        break;
      case 2:
        await runScriptGeneration();
        break;
    }
  };

  const handleRedoWithModel = async () => {
    if (loading || !redoStepId) return;
    
    setShowRedoModal(false);
    setCurrentStep(redoStepId);
    
    // Update the main model selections with the redo selections
    if (redoStepId === 4) {
      setSelectedImageModel(redoImageModel);
    } else if (redoStepId === 5) {
      setSelectedVideoModel(redoVideoModel);
    }
    
    switch (redoStepId) {
      case 4:
        await runImageGeneration();
        break;
      case 5:
        await runVideoGeneration();
        break;
    }
    
    setRedoStepId(null);
  };

  const runConceptWriter = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(0, 'loading');

    try {
      console.log("Starting pipeline with web-info...");
      const webInfoResult = await webInfoApi.processWebInfo(prompt, selectedProject?.id);
      console.log("Web-info response:", webInfoResult);

      console.log("Calling concept-writer...");
      const webInfoContent = webInfoResult.choices[0].message.content;
      const conceptsResult = await conceptWriterApi.generateConcepts(
        prompt,
        webInfoContent,
        selectedProject?.id,
      );

      console.log("Concept-writer response:", conceptsResult);
      setConcepts(conceptsResult.concepts);
      updateStepStatus(0, 'done');
      setCurrentStep(1);
    } catch (error) {
      console.error("Error in concept writer:", error);
      setError(error.message || "Failed to generate concepts. Please try again.");
      updateStepStatus(0, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runScriptGeneration = async () => {
    if (!selectedConcept) {
      setError("Please select a concept first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(2, 'loading');

    try {
      const [res1, res2] = await Promise.all([
        segmentationApi.getSegmentation({
          prompt,
          concept: selectedConcept.title,
          negative_prompt: "",
          project_id: selectedProject?.id,
        }),
        segmentationApi.getSegmentation({
          prompt,
          concept: selectedConcept.title,
          negative_prompt: "",
          project_id: selectedProject?.id,
        }),
      ]);
      
      setScripts({ response1: res1, response2: res2 });
      updateStepStatus(2, 'done');
      setCurrentStep(3);
    } catch (error) {
      console.error("Error in script generation:", error);
      setError(error.message || "Failed to generate scripts. Please try again.");
      updateStepStatus(2, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runImageGeneration = async () => {
    if (!selectedScript) {
      setError("Please select a script first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(4, 'loading');
    setGenerationProgress({});

    try {
      const segments = selectedScript.segments;
      const artStyle = selectedScript.artStyle || "";
      const imagesMap = {};

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "image",
            status: "generating",
            index: i + 1,
            total: segments.length,
          },
        }));

        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        try {
          const result = await chatApi.generateImage({
            visual_prompt: segment.visual,
            art_style: artStyle,
            uuid: segment.id,
            project_id: selectedProject?.id,
            model: selectedImageModel,
          });

          if (result.s3_key) {
            const imageUrl = await s3Api.downloadImage(result.s3_key);
            imagesMap[segment.id] = imageUrl;
            segment.s3Key = result.s3_key;

            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "image",
                status: "completed",
                index: i + 1,
                total: segments.length,
              },
            }));
          }
        } catch (err) {
          console.error(`Error generating image for segment ${segment.id}:`, err);
          setGenerationProgress((prev) => ({
            ...prev,
            [segment.id]: {
              type: "image",
              status: "error",
              index: i + 1,
              total: segments.length,
              error: err.message,
            },
          }));
        }
      }

      // Update segments with s3Key for video generation
      const segmentsWithS3Key = segments.map(segment => ({
        ...segment,
        s3Key: segment.s3Key
      }));

      setGeneratedImages(imagesMap);
      
      // Update selectedScript with the segments that now have s3Key
      setSelectedScript(prev => ({
        ...prev,
        segments: segmentsWithS3Key
      }));

      updateStepStatus(4, 'done');
      setCurrentStep(5);
    } catch (error) {
      console.error("Error in image generation:", error);
      setError(error.message || "Failed to generate images. Please try again.");
      updateStepStatus(4, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runVideoGeneration = async () => {
    // Check if we have any images available from the API response
    if (Object.keys(generatedImages).length === 0) {
      setError("Please generate images first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(5, 'loading');
    setGenerationProgress({});

    try {
      const segments = selectedScript.segments;
      const artStyle = selectedScript.artStyle || "";
      const videosMap = {};

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Check if this segment has an image in the generatedImages map
        // Try different segment ID formats to match with generatedImages
        const segmentIdVariants = [
          segment.id,
          `seg-${segment.id}`,
          segment.segmentId,
          segment.uuid
        ];
        
        const matchingImageKey = segmentIdVariants.find(id => generatedImages[id]);
        if (!matchingImageKey) {
          console.log(`Skipping segment ${segment.id} - no image available. Tried IDs:`, segmentIdVariants);
          continue;
        }

        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "video",
            status: "generating",
            index: i + 1,
            total: segments.length,
          },
        }));

        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        try {
          // Extract s3Key from the image URL in generatedImages
          const imageUrl = generatedImages[matchingImageKey];
          let imageS3Key = null;
          
          if (imageUrl && imageUrl.includes('cloudfront.net/')) {
            // Extract s3Key from CloudFront URL
            const urlParts = imageUrl.split('cloudfront.net/');
            if (urlParts.length > 1) {
              imageS3Key = urlParts[1];
            }
          }
          
          console.log(`Generating video for segment ${segment.id} with imageS3Key: ${imageS3Key}`);
          const result = await chatApi.generateVideo({
            animation_prompt: segment.animation || segment.visual,
            art_style: artStyle,
            image_s3_key: imageS3Key,
            uuid: segment.id,
            project_id: selectedProject?.id,
            model: selectedVideoModel,
          });

          console.log(`Video generation result for segment ${segment.id}:`, result);

          if (result.s3_key) {
            const videoUrl = await s3Api.downloadVideo(result.s3_key);
            videosMap[segment.id] = videoUrl;

            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "completed",
                index: i + 1,
                total: segments.length,
              },
            }));
          } else {
            console.warn(`No s3_key returned for segment ${segment.id}`);
            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "error",
                index: i + 1,
                total: segments.length,
                error: "No video key returned from API",
              },
            }));
          }
        } catch (err) {
          console.error(`Error generating video for segment ${segment.id}:`, err);
          setGenerationProgress((prev) => ({
            ...prev,
            [segment.id]: {
              type: "video",
              status: "error",
              index: i + 1,
              total: segments.length,
              error: err.message,
            },
          }));
        }
      }

      setGeneratedVideos(videosMap);

      updateStepStatus(5, 'done');
    } catch (error) {
      console.error("Error in video generation:", error);
      setError(error.message || "Failed to generate videos. Please try again.");
      updateStepStatus(5, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const handleConceptSelect = (concept) => {
    setSelectedConcept(concept);
    updateStepStatus(1, 'done');
    setCurrentStep(2);
  };

  const handleScriptSelect = (script) => {
    setSelectedScript(script);
    updateStepStatus(3, 'done');
    setCurrentStep(4);
  };

  const sendVideosToTimeline = async () => {
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
      const allNumeric = payload.every((p) => typeof p.id === 'number');
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

  // add only one video (by segmentId) to timeline
  const addSingleVideoToTimeline = async (segmentId) => {
    if (addingTimeline) return;
    const videoUrl = combinedVideosMap[segmentId] || combinedVideosMap[String(segmentId)];
    if (!videoUrl) {
      setError('Video not found.');
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
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('extension:timeline:addByUrlWithDir', payload);
        success = true;
      }
    } catch (err) {
      console.error('timeline add failed', err);
    }

    if (success) {
      setTimelineProgress({ expected: 1, added: 0 });
    } else {
      setError('Failed to add video to timeline.');
    }
    setAddingTimeline(false);
  };

  const canSendTimeline = Object.keys(generatedVideos).length > 0 || Object.keys(storedVideosMap).length > 0;

  // Helper functions for project management
  const clearProjectLocalStorage = () => {
    // Clear project selection from localStorage
    localStorage.removeItem('project-store-projects');
    localStorage.removeItem('project-store-selectedProject');
    setSelectedProject(null);
  };

  const loadProjectData = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Loading project data for project ID: ${selectedProject.id}`);
      
      // Fetch project details and all related data from API
      const [
        projectDetails,
        projectConcepts,
        projectImages,
        projectVideos,
        projectSegmentations
      ] = await Promise.all([
        projectApi.getProjectById(selectedProject.id),
        projectApi.getProjectConcepts(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectImages(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectVideos(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectSegmentations(selectedProject.id, { page: 1, limit: 50 })
      ]);
      
      console.log('Raw API responses:', {
        projectDetails,
        projectConcepts,
        projectImages,
        projectVideos,
        projectSegmentations
      });
      
      // Set concepts if available
      if (projectConcepts && projectConcepts.success && projectConcepts.data && projectConcepts.data.length > 0) {
        console.log('Setting concepts:', projectConcepts.data);
        setConcepts(projectConcepts.data);
      } else {
        console.log('No concepts found in API response');
        setConcepts(null);
      }
      
      // Set segments/scripts if available first (we need this to map images/videos correctly)
      let segments = [];
      if (projectSegmentations && projectSegmentations.success && projectSegmentations.data && projectSegmentations.data.length > 0) {
        // Take the first segmentation (script) and extract its segments
        const firstSegmentation = projectSegmentations.data[0];
        if (firstSegmentation.segments && firstSegmentation.segments.length > 0) {
          segments = firstSegmentation.segments.map(seg => ({
            id: seg.segmentId || seg.id,
            visual: seg.visual,
            animation: seg.animation,
            narration: seg.narration,
            s3Key: seg.s3Key || seg.image_s3_key || seg.imageS3Key,
            imageUrl: seg.imageUrl || seg.image_url,
            videoUrl: seg.videoUrl || seg.video_url
          }));
          
          console.log('Setting selected script with segments:', segments);
          setSelectedScript({ 
            segments,
            artStyle: firstSegmentation.artStyle,
            concept: firstSegmentation.concept
          });
        } else {
          console.log('No segments found in segmentation data');
          setSelectedScript(null);
        }
      } else {
        console.log('No segmentations found in API response');
        setSelectedScript(null);
      }

      // Set images if available - map to segments properly
      if (projectImages && projectImages.success && Array.isArray(projectImages.data) && projectImages.data.length > 0) {
        const imagesMap = {};
        projectImages.data.forEach(img => {
          const segmentId = img.uuid || img.segment_id || img.segmentId || img.id;
          if (!segmentId) return;

          // Support old s3Key as well as new imageS3Key / imageS3key
          const key = img.s3Key || img.imageS3Key || img.imageS3key || img.image_s3_key;
          const imageUrl = key ? `https://ds0fghatf06yb.cloudfront.net/${key}` : (img.url || img.imageUrl);
          if (imageUrl) {
            imagesMap[segmentId] = imageUrl;

            // update segment data so we can reuse for video generation
            const segment = segments.find(seg => seg.id == segmentId);
            if (segment && !segment.s3Key) {
              segment.s3Key = key;
            }
          }
        });
        console.log('Setting generated images:', imagesMap);
        setGeneratedImages(imagesMap);
      } else {
        console.log('No images found in API response');
        setGeneratedImages({});
      }
 
      // Set videos if available - map to segments properly (supports new videoFiles array)
      if (projectVideos && projectVideos.success && Array.isArray(projectVideos.data) && projectVideos.data.length > 0) {
        const videosMap = {};
        projectVideos.data.forEach(video => {
          const segmentId = video.uuid || video.segment_id || video.segmentId || video.id;
          if (!segmentId) return;

          let videoKey = null;
          if (Array.isArray(video.s3Keys) && video.s3Keys.length > 0) {
            videoKey = video.s3Keys[0];
          } else if (Array.isArray(video.videoFiles) && video.videoFiles.length > 0) {
            videoKey = video.videoFiles[0].s3Key;
          }

          const videoUrl = videoKey ? `https://ds0fghatf06yb.cloudfront.net/${videoKey}` : (video.url || null);
          if (videoUrl) {
            videosMap[segmentId] = videoUrl;
          }
        });
        console.log('Setting generated videos:', videosMap);
        setGeneratedVideos(videosMap);
        setStoredVideosMap(videosMap);
      } else {
        console.log('No videos found in API response');
        setGeneratedVideos({});
        setStoredVideosMap({});
      }
      
      // Reset other states
      setSelectedConcept(null);
      setScripts(null);
      
      console.log('Project data loading completed');
      
    } catch (error) {
      console.error("Error loading project data from API:", error);
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setNewProjectName("");
    setNewProjectDesc("");
    setCreateProjectError(null);
    setCreateModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateProjectError(null);
  };

  const handleCreateProjectModal = async (e) => {
    e.preventDefault();
    setCreateProjectError(null);
    if (!newProjectName.trim()) {
      setCreateProjectError("Project name is required.");
      return;
    }
    setCreatingProject(true);
    try {
      const newProject = await projectApi.createProject({ name: newProjectName, description: newProjectDesc });
      clearProjectLocalStorage();
      localStorage.setItem('project-store-selectedProject', JSON.stringify(newProject));
      localStorage.setItem('project-store-projects', JSON.stringify([newProject]));
      setSelectedProject(newProject);
      resetFlow();
      setCreateModalOpen(false);
    } catch (err) {
      setCreateProjectError(err.message || 'Failed to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  // helper maps combining stored data so UI shows even after reload
  const combinedVideosMap = React.useMemo(() => ({ ...generatedVideos, ...storedVideosMap }), [generatedVideos, storedVideosMap]);

  return (
    <div className='z-10' onClick={() => {
        setShowMenu(false);
        setShowUserMenu(false);
      }}>
      {/* Floating chat button */}
      <ChatFloatingButton open={open} onOpen={() => setOpen(true)} />

      {/* Sliding sidebar */}
      <ChatSidebar
        open={open}
        // Header props
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        isAuthenticated={isAuthenticated}
        showProjectHistory={showProjectHistory}
        setShowProjectHistory={setShowProjectHistory}
        setShowCharacterGenerator={setShowCharacterGenerator}
        openCreateModal={openCreateModal}
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        onClose={() => setOpen(false)}
        // Project props
        selectedProject={selectedProject}
        // Step props
        steps={STEPS}
        currentStep={currentStep}
        stepStatus={stepStatus}
        loading={loading}
        collapseSteps={collapseSteps}
        setCollapseSteps={setCollapseSteps}
        getStepIcon={getStepIcon}
        isStepDisabled={(stepId) => isStepDisabled(stepId, loading)}
        onStepClick={handleStepClick}
        onRedoStep={handleRedoStep}
        // Content props
        error={error}
        setError={setError}
        concepts={concepts}
        selectedConcept={selectedConcept}
        onConceptSelect={handleConceptSelect}
        scripts={scripts}
        selectedScript={selectedScript}
        onScriptSelect={handleScriptSelect}
        selectedImageModel={selectedImageModel}
        setSelectedImageModel={setSelectedImageModel}
        selectedVideoModel={selectedVideoModel}
        setSelectedVideoModel={setSelectedVideoModel}
        generationProgress={generationProgress}
        generatedImages={generatedImages}
        combinedVideosMap={combinedVideosMap}
        onImageClick={(imageUrl) => {
          setModalImageUrl(imageUrl);
          setShowImageModal(true);
        }}
        onVideoClick={(videoUrl) => {
          setModalVideoUrl(videoUrl);
          setShowVideoModal(true);
        }}
        onAddToTimeline={addSingleVideoToTimeline}
        // Timeline props
        canSendTimeline={canSendTimeline}
        addingTimeline={addingTimeline}
        onSendVideosToTimeline={sendVideosToTimeline}
        // Input props
        prompt={prompt}
        setPrompt={setPrompt}
        onSend={() => handleStepClick(0)}
        // Auth props
        onCreateProject={openCreateModal}
        // Project selection callback
        onProjectSelect={handleProjectSelect}
      />

      {/* Character Generator Modal */}
      <CharacterGenerator
        isOpen={showCharacterGenerator}
        onClose={() => setShowCharacterGenerator(false)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        createModalOpen={createModalOpen}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDesc={newProjectDesc}
        setNewProjectDesc={setNewProjectDesc}
        creatingProject={creatingProject}
        createProjectError={createProjectError}
        nameInputRef={nameInputRef}
        onSubmit={handleCreateProjectModal}
        onClose={closeCreateModal}
      />

      {/* Image preview modal */}
      <ImagePreviewModal
        showImageModal={showImageModal}
        modalImageUrl={modalImageUrl}
        onClose={() => {
          setShowImageModal(false);
          setModalImageUrl(null);
        }}
      />

      {/* Video preview modal */}
      <VideoPreviewModal
        showVideoModal={showVideoModal}
        modalVideoUrl={modalVideoUrl}
        onClose={() => {
          setShowVideoModal(false);
          setModalVideoUrl(null);
        }}
      />

      {/* Redo modal with model selection */}
      <RedoModal
        showRedoModal={showRedoModal}
        redoStepId={redoStepId}
        redoImageModel={redoImageModel}
        setRedoImageModel={setRedoImageModel}
        redoVideoModel={redoVideoModel}
        setRedoVideoModel={setRedoVideoModel}
        loading={loading}
        onConfirm={handleRedoWithModel}
        onClose={() => setShowRedoModal(false)}
      />
    </div>
  );
}

export default ChatWidget; 