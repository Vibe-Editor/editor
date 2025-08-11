import { useState } from "react";
import { projectApi } from "../services/project";

export const useProjectManagement = () => {
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // Helper functions for project management
  const clearProjectLocalStorage = () => {
    // Clear project selection from localStorage
    localStorage.removeItem("project-store-projects");
    localStorage.removeItem("project-store-selectedProject");
  };

  const loadProjectData = async ({
    selectedProject,
    setLoading,
    setError,
    setConcepts,
    setSelectedScript,
    setGeneratedImages,
    setGeneratedVideos,
    setStoredVideosMap,
    setSelectedConcept,
    setScripts,
  }) => {
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
        projectSegmentations,
      ] = await Promise.all([
        projectApi.getProjectById(selectedProject.id),
        projectApi.getProjectConcepts(selectedProject.id, {
          page: 1,
          limit: 50,
        }),
        projectApi.getProjectImages(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectVideos(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectSegmentations(selectedProject.id, {
          page: 1,
          limit: 50,
        }),
      ]);

      console.log("Raw API responses:", {
        projectDetails,
        projectConcepts,
        projectImages,
        projectVideos,
        projectSegmentations,
      });

      // Set concepts if available
      if (
        projectConcepts &&
        projectConcepts.success &&
        projectConcepts.data &&
        projectConcepts.data.length > 0
      ) {
        console.log("Setting concepts:", projectConcepts.data);
        setConcepts(projectConcepts.data);
      } else {
        console.log("No concepts found in API response");
        setConcepts(null);
      }

      // Set segments/scripts if available first (we need this to map images/videos correctly)
      let segments = [];
      if (
        projectSegmentations &&
        projectSegmentations.success &&
        projectSegmentations.data &&
        projectSegmentations.data.length > 0
      ) {
        // Take the first segmentation (script) and extract its segments
        const firstSegmentation = projectSegmentations.data[0];
        if (
          firstSegmentation.segments &&
          firstSegmentation.segments.length > 0
        ) {
          segments = firstSegmentation.segments.map((seg) => ({
            id: seg.segmentId || seg.id,
            visual: seg.visual,
            animation: seg.animation,
            narration: seg.narration,
            s3Key: seg.s3Key || seg.image_s3_key || seg.imageS3Key,
            imageUrl: seg.imageUrl || seg.image_url,
            videoUrl: seg.videoUrl || seg.video_url,
          }));

          console.log("Setting selected script with segments:", segments);
          setSelectedScript({
            segments,
            artStyle: firstSegmentation.artStyle,
            concept: firstSegmentation.concept,
          });
        } else {
          console.log("No segments found in segmentation data");
          setSelectedScript(null);
        }
      } else {
        console.log("No segmentations found in API response");
        setSelectedScript(null);
      }

      // Set images if available - map to segments properly
      if (
        projectImages &&
        projectImages.success &&
        Array.isArray(projectImages.data) &&
        projectImages.data.length > 0
      ) {
        const imagesMap = {};
        projectImages.data.forEach((img) => {
          const segmentId =
            img.uuid || img.segment_id || img.segmentId || img.id;
          if (!segmentId) return;

          // Support old s3Key as well as new imageS3Key / imageS3key
          const key =
            img.s3Key || img.imageS3Key || img.imageS3key || img.image_s3_key;
          const imageUrl = key
            ? `https://ds0fghatf06yb.cloudfront.net/${key}`
            : img.url || img.imageUrl;
          if (imageUrl) {
            imagesMap[segmentId] = imageUrl;

            // update segment data so we can reuse for video generation
            const segment = segments.find((seg) => seg.id == segmentId);
            if (segment && !segment.s3Key) {
              segment.s3Key = key;
            }
          }
        });
        console.log("Setting generated images:", imagesMap);
        setGeneratedImages(imagesMap);
      } else {
        console.log("No images found in API response");
        setGeneratedImages({});
      }

      // Set videos if available - map to segments properly (supports new videoFiles array)
      if (
        projectVideos &&
        projectVideos.success &&
        Array.isArray(projectVideos.data) &&
        projectVideos.data.length > 0
      ) {
        const videosMap = {};
        projectVideos.data.forEach((video) => {
          const segmentId =
            video.uuid || video.segment_id || video.segmentId || video.id;
          if (!segmentId) return;

          let videoKey = null;
          if (Array.isArray(video.s3Keys) && video.s3Keys.length > 0) {
            videoKey = video.s3Keys[0];
          } else if (
            Array.isArray(video.videoFiles) &&
            video.videoFiles.length > 0
          ) {
            videoKey = video.videoFiles[0].s3Key;
          }

          const videoUrl = videoKey
            ? `https://ds0fghatf06yb.cloudfront.net/${videoKey}`
            : video.url || null;
          if (videoUrl) {
            videosMap[segmentId] = videoUrl;
          }
        });
        console.log("Setting generated videos:", videosMap);
        setGeneratedVideos(videosMap);
        setStoredVideosMap(videosMap);
      } else {
        console.log("No videos found in API response");
        setGeneratedVideos({});
        setStoredVideosMap({});
      }

      // Reset other states
      setSelectedConcept(null);
      setScripts(null);

      console.log("Project data loading completed");
    } catch (error) {
      console.error("Error loading project data from API:", error);
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (nameInputRef) => {
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

  const handleCreateProjectModal = async (
    e,
    { setSelectedProject, resetFlow },
  ) => {
    e.preventDefault();
    setCreateProjectError(null);
    if (!newProjectName.trim()) {
      setCreateProjectError("Project name is required.");
      return;
    }
    setCreatingProject(true);
    try {
      const newProject = await projectApi.createProject({
        name: newProjectName,
        description: newProjectDesc,
      });
      clearProjectLocalStorage();
      localStorage.setItem(
        "project-store-selectedProject",
        JSON.stringify(newProject),
      );
      localStorage.setItem(
        "project-store-projects",
        JSON.stringify([newProject]),
      );
      setSelectedProject(newProject);
      resetFlow();
      setCreateModalOpen(false);
    } catch (err) {
      setCreateProjectError(err.message || "Failed to create project.");
    } finally {
      setCreatingProject(false);
    }
  };

  return {
    creatingProject,
    createProjectError,
    createModalOpen,
    newProjectName,
    setNewProjectName,
    newProjectDesc,
    setNewProjectDesc,
    clearProjectLocalStorage,
    loadProjectData,
    openCreateModal,
    closeCreateModal,
    handleCreateProjectModal,
  };
};
