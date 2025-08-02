import { useState, useEffect } from "react";
import { projectApi } from "../../services/project";

export const useProjectData = () => {
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  const [storedVideosMap, setStoredVideosMap] = useState(() => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      if (stored) {
        return JSON.parse(localStorage.getItem("project-store-videos") || "{}");
      }
      return JSON.parse(localStorage.getItem("segmentVideos") || "{}");
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  // --- Synchronisation helpers -------------------------------------------------
  const updateFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      const proj = stored ? JSON.parse(stored) : null;
      setSelectedProject(proj);
      if (proj) {
        setStoredVideosMap(
          JSON.parse(localStorage.getItem("project-store-videos") || "{}")
        );
      } else {
        setStoredVideosMap(
          JSON.parse(localStorage.getItem("segmentVideos") || "{}")
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Listen for real storage changes (other tabs) + custom in-app event
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "project-store-selectedProject") {
        updateFromLocalStorage();
      }
    };

    const handleProjectSwitch = (e) => {
      const proj = e.detail || null;
      setSelectedProject(proj);
      if (proj) {
        setStoredVideosMap(
          JSON.parse(localStorage.getItem("project-store-videos") || "{}")
        );
      } else {
        setStoredVideosMap(
          JSON.parse(localStorage.getItem("segmentVideos") || "{}")
        );
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("project-switch", handleProjectSwitch);

    // Initial sync (covers case where dropdown already updated LS)
    updateFromLocalStorage();

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("project-switch", handleProjectSwitch);
    };
  }, []);

  // -----------------------------------------------------------------------------
  const clearProjectLocalStorage = () => {
    localStorage.removeItem("project-store-projects");
    localStorage.removeItem("project-store-selectedProject");
    setSelectedProject(null);
  };

  // Load *all* project data from API (full endpoint and paginated lists)
  const loadProjectData = async () => {
    if (!selectedProject) return;

    try {
      console.log(`[useProjectData] Loading project data ${selectedProject.id}`);

      const [projectDetails, projectConcepts, projectImages, projectVideos, projectSegmentations] =
        await Promise.all([
          projectApi.getProjectById(selectedProject.id),
          projectApi.getProjectConcepts(selectedProject.id, { page: 1, limit: 50 }),
          projectApi.getProjectImages(selectedProject.id, { page: 1, limit: 50 }),
          projectApi.getProjectVideos(selectedProject.id, { page: 1, limit: 50 }),
          projectApi.getProjectSegmentations(selectedProject.id, { page: 1, limit: 50 }),
        ]);

      return {
        projectDetails,
        projectConcepts,
        projectImages,
        projectVideos,
        projectSegmentations,
      };
    } catch (error) {
      console.error("Error loading project data from API:", error);
      throw new Error("Failed to load project data. Please try again.");
    }
  };

  return {
    selectedProject,
    setSelectedProject,
    storedVideosMap,
    setStoredVideosMap,
    loadProjectData,
    clearProjectLocalStorage,
  };
};