export const STEPS = [
  { id: 0, name: 'Concept Writer', description: 'Generate video concepts' },
  { id: 1, name: 'Choose Concept', description: 'Select your preferred concept' },
  { id: 2, name: 'Script Generation', description: 'Generate script segments' },
  { id: 3, name: 'Choose Script', description: 'Select your preferred script' },
  { id: 4, name: 'Image Generation', description: 'Generate images for segments' },
  { id: 5, name: 'Video Generation', description: 'Generate videos from images' },
];

export const INITIAL_STEP_STATUS = {
  0: 'pending', // concept writer
  1: 'pending', // user chooses concept
  2: 'pending', // script generation
  3: 'pending', // user chooses script
  4: 'pending', // image generation
  5: 'pending', // video generation
};

export const STEP_STATUSES = {
  PENDING: 'pending',
  LOADING: 'loading',
  DONE: 'done'
};

export const GENERATION_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video'
};

export const GENERATION_STATUSES = {
  GENERATING: 'generating',
  COMPLETED: 'completed',
  ERROR: 'error'
}; 