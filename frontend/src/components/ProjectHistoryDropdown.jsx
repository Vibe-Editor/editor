import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useProjectStore } from "../store/useProjectStore";

export function ProjectHistoryDropdown({ onSelect }) {
  const { isAuthenticated } = useAuth();
  const {
    projects,
    selectedProject,
    loading,
    error,
    fetchProjects,
    setSelectedProject,
    fetchProjectEssentials,
  } = useProjectStore();

  // Fetch projects if needed
  useEffect(() => {
    if (isAuthenticated && projects.length === 0 && !loading) {
      fetchProjects(1, 20);
    }
  }, [isAuthenticated, projects.length, loading, fetchProjects]);

  if (loading) return <div className="p-4 text-gray-400">Loading projects...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;
  if (!projects || projects.length === 0) return <div className="p-4 text-gray-400">No projects found.</div>;

  const handleSelect = async (e) => {
    const projectId = e.target.value;
    const selected = projects.find((p) => String(p.id) === String(projectId));

    if (selected) {
      // Update Zustand store
      setSelectedProject(selected);
      // Persist in localStorage so other widgets pick up the change
      try {
        localStorage.setItem(
          "project-store-selectedProject",
          JSON.stringify(selected)
        );
        // Clear previous cached essentials to avoid stale data
        localStorage.removeItem("project-store-images");
        localStorage.removeItem("project-store-videos");
        localStorage.removeItem("project-store-segmentations");
        // Notify same-tab listeners
        window.dispatchEvent(
          new CustomEvent("project-switch", { detail: selected })
        );
      } catch (e) {
        console.warn("Failed to write project selection to localStorage", e);
      }
      if (onSelect) onSelect(selected);
      await fetchProjectEssentials(projectId);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-[1100] max-h-96 overflow-y-auto">
      <div className="p-2 border-b border-gray-800 font-semibold text-white">Your Projects</div>
      <select
        className="w-full bg-gray-900 text-white p-2 rounded"
        value={selectedProject?.id || ""}
        onChange={handleSelect}
      >
        <option value="" disabled>
          Select a project...
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name} - {project.description}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProjectLoader() {
  return null;
}

export function SelectedProjectBanner() {
  const { selectedProject } = useProjectStore();
  if (!selectedProject) return null;
  return (
    <div className="bg-blue-900 text-blue-100 px-4 py-2 text-sm font-medium border-b border-blue-800">
      Working on: <span className="font-semibold">{selectedProject.name}</span>
    </div>
  );
}
