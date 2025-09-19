/**
 * Video Editing Configuration
 * 
 * Centralized configuration for video editing functionality
 */


export const VIDEO_EDITING_CONFIG = {
  // Backend API configuration
  API_BASE_URL: 'https://backend.usuals.ai',
  
  // CloudFront CDN configuration
  CLOUDFRONT_DOMAIN: 'https://ds0fghatf06yb.cloudfront.net',
  
  // API endpoints
  ENDPOINTS: {
    VIDEO_EDIT_COMPLETE: '/video-editing/runway-aleph/complete',
    VIDEO_EDIT_STATUS: '/video-editing/status',
    VIDEO_EDIT_HISTORY: '/video-editing/history'
  },
  
  // Default video editing parameters (matching API requirements)
  DEFAULT_PARAMS: {
    model: 'gen4_aleph',
    ratio: '1280:720',
    seed: () => Math.floor(Math.random() * 1000000),
    references: [],
    contentModeration: {},
    publicFigureThreshold: 'auto'
  },
  
  // UI configuration
  UI: {
    DOUBLE_CLICK_TIMEOUT: 500, // milliseconds
    PROCESSING_TIMEOUT: 900000, // 15 minutes in milliseconds
    STATUS_POLL_INTERVAL: 10000 // 10 seconds
  }
};

// Helper functions
export const getVideoEditingApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const url = new URL(endpoint, VIDEO_EDITING_CONFIG.API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
};

export const convertS3ToCloudFront = (s3Key: string): string => {
  return `${VIDEO_EDITING_CONFIG.CLOUDFRONT_DOMAIN}/${s3Key}`;
};

export const generateProjectId = (): string => {
  // First try to get project ID from Zustand store (React component)
  try {
    // Access the global project store safely
    const globalStore = (window as any).__MY_GLOBAL_PROJECT_STORE__;
    if (globalStore) {
      const selectedProject = globalStore.getState().selectedProject;
      if (selectedProject?.id) {
        console.log('Using Zustand store project ID:', selectedProject.id);
        return selectedProject.id;
      }
    }
  } catch (error) {
    console.warn('Could not access Zustand project store:', error);
  }
  
  // Fallback to localStorage (for backward compatibility)
  const storedProjectId = localStorage.getItem('projectId') || 
                         localStorage.getItem('project_id') ||
                         localStorage.getItem('currentProjectId');
  
  if (storedProjectId) {
    console.log('Using localStorage project ID:', storedProjectId);
    return storedProjectId;
  }
  
  // Fallback to project file name
  const projectFile = document.querySelector("#projectFile")?.value || "";
  if (projectFile) {
    const fileName = projectFile.split('/').pop()?.replace('.ngt', '') || 'default';
    const projectId = `proj_${fileName}_${Date.now()}`;
    console.log('Generated project ID from file:', projectId);
    return projectId;
  }
  
  // Final fallback
  const fallbackId = `proj_default_${Date.now()}`;
  console.log('Using fallback project ID:', fallbackId);
  return fallbackId;
};
