import { create } from "zustand";
import { projectApi } from "../services/project";
import { creditApi } from "../services/credit";
import { useSegmentStore } from "./useSegmentStore";

const storeImpl = (set, get) => ({
  projects: [],
  selectedProject: null,
  // Note: storedVideosMap is now managed by useSegmentStore
  // This is kept for backward compatibility but will be deprecated
  storedVideosMap: {},
  conversations: [],
  concepts: [],
  images: [],
  videos: [],
  voiceovers: [],
  segmentations: [],
  summaries: [],
  research: [],
  loading: false,
  
  // Authentication State
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  
  // Project Editor State
  projectEditor: {
    currentStep: 'greeting',
    questionsData: null,
    videoTypeSelection: null,
    userPrompt: '',
    preferenceAnswers: {},
    chatMessages: [],
    conceptGenerated: false,
    isGeneratingConcept: false,
  },

  // Template selections per story section (0..4)
  templateSelections: {},
  
  // Preserve user preference videos for Loading component (before preferenceAnswers gets cleared)
  preferenceVideos: [],
  
  // Store generated video results from TemplateSelection for timeline integration
  generatedVideoResults: [],
  loadingData: {
    conversations: false,
    concepts: false,
    images: false,
    videos: false,
    voiceovers: false,
    segmentations: false,
    summaries: false,
    research: false,
    balance: false,
  },
  error: null,
  creditBalance: 0,

  setProjects: (projects) => {
    set({ projects });
  },
  setStoredVideosMap: (videosMap) => {
    const { selectedProject } = get();
    set({ storedVideosMap: videosMap });
    
    // Also update the segment store
    const segmentStore = useSegmentStore.getState();
    segmentStore.setSegmentVideos(videosMap, !!selectedProject);
  },
  setSelectedProject: (project) => {
    console.log('🏪 Store: Setting selected project:', project?.name);
    set({ selectedProject: project });
    
    // Clear project editor state when switching projects
    get().resetProjectEditor();
    
    // Update storedVideosMap based on project selection
    const { setStoredVideosMap } = get();
    if (project) {
      // Get project videos from segment store
      const segmentStore = useSegmentStore.getState();
      const projectVideos = segmentStore.projectVideos || {};
      setStoredVideosMap(projectVideos);
    } else {
      // Get segment videos from segment store
      const segmentStore = useSegmentStore.getState();
      const segmentVideos = segmentStore.segmentVideos || {};
      setStoredVideosMap(segmentVideos);
    }
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('projectChanged', { 
      detail: { project } 
    }));
    
    if (project?.id) {
      get().fetchProjectEssentials(project.id);
    }
  },

  // Selected project management methods
  getSelectedProject: () => {
    const { selectedProject } = get();
    return selectedProject;
  },

  clearSelectedProject: () => {
    console.log('🏪 Store: Clearing selected project');
    set({ selectedProject: null });
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('projectChanged', { 
      detail: { project: null } 
    }));
  },

  loadSelectedProjectFromStorage: () => {
    const { selectedProject } = get();
    return selectedProject;
  },

  saveSelectedProjectToStorage: (project) => {
    set({ selectedProject: project });
    return true;
  },

  hasProjectInStorage: () => {
    const { selectedProject } = get();
    return selectedProject !== null;
  },

  getProjectFromStorage: () => {
    const { selectedProject } = get();
    return selectedProject;
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setConversations: (conversations) => set({ conversations }),
  setConcepts: (concepts) => set({ concepts }),
  setImages: (images) => set({ images }),
  setVideos: (videos) => set({ videos }),
  setVoiceovers: (voiceovers) => set({ voiceovers }),
  setSegmentations: (segmentations) => set({ segmentations }),
  setSummaries: (summaries) => set({ summaries }),
  setResearch: (research) => set({ research }),
  setCreditBalance: (balance) => set({ creditBalance: balance }),

  // Authentication Actions
  setAuthUser: (user) => {
    set((state) => ({
      auth: { ...state.auth, user, isAuthenticated: !!user }
    }));
    // Sync to localStorage
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  },
  setAuthToken: (token) => {
    set((state) => ({
      auth: { ...state.auth, token }
    }));
    // Sync to localStorage
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  },
  setAuthLoading: (loading) => set((state) => ({
    auth: { ...state.auth, loading }
  })),
  setAuthError: (error) => set((state) => ({
    auth: { ...state.auth, error }
  })),
  setAuthData: (authData) => {
    set((state) => ({
      auth: {
        ...state.auth,
        user: authData.user,
        token: authData.access_token,
        isAuthenticated: !!authData.user,
        error: null
      }
    }));
    // Sync to localStorage
    if (authData.access_token) {
      localStorage.setItem('authToken', authData.access_token);
    }
    if (authData.user) {
      localStorage.setItem('authUser', JSON.stringify(authData.user));
    }
  },
  clearAuth: () => {
    set((state) => ({
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }
    }));
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  },
  
  // Initialize auth from localStorage
  initAuthFromStorage: () => {
    try {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('authUser');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (token || user) {
        set((state) => ({
          auth: {
            ...state.auth,
            user,
            token,
            isAuthenticated: !!user
          }
        }));
      }
    } catch (error) {
      console.error('Failed to initialize auth from localStorage:', error);
    }
  },

  // Project Editor Actions
  setProjectEditorStep: (step) => set((state) => ({
    projectEditor: { ...state.projectEditor, currentStep: step }
  })),
  setQuestionsData: (data) => set((state) => ({
    projectEditor: { ...state.projectEditor, questionsData: data }
  })),
  setVideoTypeSelection: (selection) => set((state) => ({
    projectEditor: { ...state.projectEditor, videoTypeSelection: selection, currentStep: 'user_prompt' }
  })),
  setUserPrompt: (prompt) => set((state) => ({
    projectEditor: { ...state.projectEditor, userPrompt: prompt, currentStep: 'preference_questions' }
  })),
  setPreferenceAnswer: (questionKey, answer) => set((state) => ({
    projectEditor: {
      ...state.projectEditor,
      preferenceAnswers: { ...state.projectEditor.preferenceAnswers, [questionKey]: answer }
    }
  })),
  setChatMessages: (messages) => set((state) => ({
    projectEditor: { ...state.projectEditor, chatMessages: messages }
  })),
  setConceptGenerated: (generated) => set((state) => ({
    projectEditor: { ...state.projectEditor, conceptGenerated: generated }
  })),
  setIsGeneratingConcept: (generating) => set((state) => ({
    projectEditor: { ...state.projectEditor, isGeneratingConcept: generating }
  })),
  resetProjectEditor: () => {
    console.log('🏪 Store: Resetting project editor state');
    set((state) => ({
      projectEditor: {
        currentStep: 'greeting',
        questionsData: null,
        videoTypeSelection: null,
        userPrompt: '',
        preferenceAnswers: {},
        chatMessages: [],
        conceptGenerated: false,
        isGeneratingConcept: false,
      }
    }));
  },

  // Template selection actions
  setTemplateSelection: (sectionIndex, template) => {
    set((state) => ({
      templateSelections: {
        ...state.templateSelections,
        [sectionIndex]: template,
      },
    }));
  },
  getTemplateSelection: (sectionIndex) => {
    const { templateSelections } = get();
    return templateSelections?.[sectionIndex] || null;
  },
  clearTemplateSelections: () => set({ templateSelections: {} }),

  // Preference videos actions (to preserve videos before preferenceAnswers gets cleared)
  setPreferenceVideos: (videos) => set({ preferenceVideos: videos }),
  clearPreferenceVideos: () => set({ preferenceVideos: [] }),

  // Generated video results actions (for timeline integration)
  setGeneratedVideoResults: (results) => set({ generatedVideoResults: results }),
  clearGeneratedVideoResults: () => set({ generatedVideoResults: [] }),

  // Clear project editor after successful API call
  clearProjectEditorAfterSave: () => {
    console.log('🏪 Store: Clearing project editor after successful save');
    set((state) => ({
      projectEditor: {
        ...state.projectEditor,
        preferenceAnswers: {},
        userPrompt: '',
        videoTypeSelection: null,
        conceptGenerated: false,
        isGeneratingConcept: false,
      }
    }));
  },

  fetchProjects: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const data = await projectApi.getProjects({ page, limit });
      get().setProjects(data);
      set({ loading: false });
    } catch (e) {
      set({ error: e.message || "Failed to fetch projects", loading: false });
    }
  },

  // Project management methods
  addProject: (project) => {
    const { projects } = get();
    const updatedProjects = [...projects, project];
    get().setProjects(updatedProjects);
  },

  updateProject: (projectId, updates) => {
    const { projects } = get();
    const updatedProjects = projects.map(project => 
      project.id === projectId ? { ...project, ...updates } : project
    );
    get().setProjects(updatedProjects);
  },

  removeProject: (projectId) => {
    const { projects, selectedProject } = get();
    const updatedProjects = projects.filter(project => project.id !== projectId);
    get().setProjects(updatedProjects);
    
    // Clear selected project if it was removed
    if (selectedProject && selectedProject.id === projectId) {
      get().clearSelectedProject();
    }
  },

  clearProjects: () => {
    get().setProjects([]);
  },

  getProjectById: (projectId) => {
    const { projects } = get();
    return projects.find(project => project.id === projectId);
  },
  fetchProjectEssentials: async (projectId) => {
    const { setSegmentations, setImages, setVideos } = get();
    try {
      const [segmentationsRes, imagesRes, videosRes] = await Promise.all([
        projectApi.getProjectSegmentations(projectId, { page: 1, limit: 50 }),
        projectApi.getProjectImages(projectId, { page: 1, limit: 100 }),
        projectApi.getProjectVideos(projectId, { page: 1, limit: 100 }),
      ]);
      setSegmentations(segmentationsRes.data || []);
      setImages(imagesRes.data || []);
      setVideos(videosRes.data || []);
    } catch (error) {
      console.error("Failed to fetch project essentials:", error);
      set({ error: error.message || "Failed to fetch project data" });
    }
  },
  fetchConversations: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, conversations: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectConversations(projectId, {
        page,
        limit,
      });
      set((state) => ({
        conversations: data.data || [],
        loadingData: { ...state.loadingData, conversations: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch conversations",
        loadingData: { ...state.loadingData, conversations: false },
      }));
      throw e;
    }
  },
  fetchConcepts: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, concepts: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectConcepts(projectId, {
        page,
        limit,
      });
      set((state) => ({
        concepts: data.data || [],
        loadingData: { ...state.loadingData, concepts: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch concepts",
        loadingData: { ...state.loadingData, concepts: false },
      }));
      throw e;
    }
  },
  fetchImages: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, images: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectImages(projectId, {
        page,
        limit,
      });
      set((state) => ({
        images: data.data || [],
        loadingData: { ...state.loadingData, images: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch images",
        loadingData: { ...state.loadingData, images: false },
      }));
      throw e;
    }
  },
  fetchVideos: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, videos: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectVideos(projectId, {
        page,
        limit,
      });
      set((state) => ({
        videos: data.data || [],
        loadingData: { ...state.loadingData, videos: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch videos",
        loadingData: { ...state.loadingData, videos: false },
      }));
      throw e;
    }
  },
  fetchVoiceovers: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, voiceovers: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectVoiceovers(projectId, {
        page,
        limit,
      });
      set((state) => ({
        voiceovers: data.data || [],
        loadingData: { ...state.loadingData, voiceovers: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch voiceovers",
        loadingData: { ...state.loadingData, voiceovers: false },
      }));
      throw e;
    }
  },
  fetchSegmentations: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, segmentations: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectSegmentations(projectId, {
        page,
        limit,
      });
      set((state) => ({
        segmentations: data.data || [],
        loadingData: { ...state.loadingData, segmentations: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch segmentations",
        loadingData: { ...state.loadingData, segmentations: false },
      }));
      throw e;
    }
  },
  fetchSummaries: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, summaries: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectSummaries(projectId, {
        page,
        limit,
      });
      set((state) => ({
        summaries: data.data || [],
        loadingData: { ...state.loadingData, summaries: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch summaries",
        loadingData: { ...state.loadingData, summaries: false },
      }));
      throw e;
    }
  },
  fetchResearch: async (projectId, page = 1, limit = 10) => {
    set((state) => ({
      loadingData: { ...state.loadingData, research: true },
      error: null,
    }));
    try {
      const data = await projectApi.getProjectResearch(projectId, {
        page,
        limit,
      });
      set((state) => ({
        research: data.data || [],
        loadingData: { ...state.loadingData, research: false },
      }));
      return data;
    } catch (e) {
      set((state) => ({
        error: e.message || "Failed to fetch research",
        loadingData: { ...state.loadingData, research: false },
      }));
      throw e;
    }
  },

  // Credit related functions
  fetchBalance: async (userId) => {
    set((state) => ({
      loadingData: { ...state.loadingData, balance: true },
      error: null,
    }));
    try {
      const data = await creditApi.getBalance(userId);
      set((state) => ({
        creditBalance: data.credits || 0,
        loadingData: { ...state.loadingData, balance: false },
      }));
      return data;
    } catch (error) {
      set((state) => ({
        error: error.message || "Failed to fetch credit balance",
        loadingData: { ...state.loadingData, balance: false },
      }));
      throw error;
    }
  },

  addCredits: async ({ userId, amount, type, description }) => {
    set({ loading: true, error: null });
    try {
      const data = await creditApi.addCredits({
        userId,
        amount,
        type,
        description,
      });
      set((state) => ({
        creditBalance: state.creditBalance + amount,
        loading: false,
      }));
      return data;
    } catch (error) {
      set({
        error: error.message || "Failed to add credits",
        loading: false,
      });
      throw error;
    }
  },

  refreshSelectedProjectData: async () => {
    const { selectedProject } = get();
    if (selectedProject?.id) {
      await get().fetchProjectEssentials(selectedProject.id);
    }
  },
  clearProjectData: () => {
    set({
      conversations: [],
      concepts: [],
      images: [],
      videos: [],
      voiceovers: [],
      segmentations: [],
      summaries: [],
      research: [],
      selectedProject: null,
    });
    
    // Clear the selected project and projects list
    get().clearSelectedProject();
    get().clearProjects();
  },
});

// Create the store instance
const createProjectStore = () => create(storeImpl);

// Use a single store instance globally to maintain consistency with other stores
export const useProjectStore = (() => {
  if (typeof window !== 'undefined') {
    if (!window.__MY_GLOBAL_PROJECT_STORE__) {
      window.__MY_GLOBAL_PROJECT_STORE__ = createProjectStore();
      console.log('✅ ProjectStore: Created global instance');
      
      // Initialize auth from localStorage
      window.__MY_GLOBAL_PROJECT_STORE__.getState().initAuthFromStorage();
      
      // Also expose for debugging
      window.debugProjectStore = window.__MY_GLOBAL_PROJECT_STORE__;
      console.log('🐛 Debug store available at: window.debugProjectStore');
    }
    return window.__MY_GLOBAL_PROJECT_STORE__;
  } else {
    // Server-side rendering fallback
    return createProjectStore();
  }
})();
