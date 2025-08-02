import { projectApi } from "../../services/project";

export const useProjectActions = ({
  setNewProjectName,
  setNewProjectDesc,
  setCreateProjectError,
  setCreateModalOpen,
  setCreatingProject,
  nameInputRef,
  clearProjectLocalStorage,
  setSelectedProject,
  resetFlow
}) => {
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
    
    // Use the controlled component values instead of form elements
    if (!newProjectName.trim()) {
      setCreateProjectError("Project name is required.");
      return;
    }
    
    setCreatingProject(true);
    try {
      const newProject = await projectApi.createProject({ 
        name: newProjectName.trim(), 
        description: newProjectDesc.trim() 
      });
      
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

  return {
    openCreateModal,
    closeCreateModal,
    handleCreateProjectModal
  };
};