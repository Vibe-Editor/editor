import { useState, useEffect } from "react";
import { chatApi } from "../../services/chat";
import { useStepActions } from "./useStepAction";

export const useStepFlow = ({
  selectedProject,
  prompt,
  setError,
  redoStepId,
  setRedoStepId,
  setShowRedoModal,
  redoImageModel,
  setRedoImageModel,
  redoVideoModel,
  setRedoVideoModel,
  selectedImageModel,
  selectedVideoModel,
  setSelectedImageModel,
  setSelectedVideoModel
}) => {
  // 6-step flow states
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({
    0: 'pending', // concept writer
    1: 'pending', // user chooses concept
    2: 'pending', // script generation
    3: 'pending', // user chooses script
    4: 'pending', // image generation
    5: 'pending', // video generation
  });
  
  const [concepts, setConcepts] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [scripts, setScripts] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [generatedVideos, setGeneratedVideos] = useState({});
  const [generationProgress, setGenerationProgress] = useState({});
  const [loading, setLoading] = useState(false);

  // Model selection states - these are passed as parameters, so we don't need to declare them here

  const steps = [
    { id: 0, name: 'Concept Writer', description: 'Generate video concepts' },
    { id: 1, name: 'Choose Concept', description: 'Select your preferred concept' },
    { id: 2, name: 'Script Generation', description: 'Generate script segments' },
    { id: 3, name: 'Choose Script', description: 'Select your preferred script' },
    { id: 4, name: 'Image Generation', description: 'Generate images for segments' },
    { id: 5, name: 'Video Generation', description: 'Generate videos from images' },
  ];

  // Step Actions Hook
  const {
    runConceptWriter,
    runScriptGeneration,
    runImageGeneration,
    runVideoGeneration
  } = useStepActions({
    selectedProject,
    prompt,
    selectedConcept,
    selectedScript,
    selectedImageModel,
    selectedVideoModel,
    setLoading,
    setError,
    setConcepts,
    setScripts,
    setGeneratedImages,
    setGeneratedVideos,
    setGenerationProgress,
    updateStepStatus: (stepId, status) => setStepStatus(prev => ({ ...prev, [stepId]: status })),
    setCurrentStep
  });

  // Update step status based on current data
  useEffect(() => {
    if (!selectedProject) return;
    
    const newStepStatus = { ...stepStatus };
    
    // Step 0: Concept Writer - check if concepts exist
    if (concepts && concepts.length > 0) {
      newStepStatus[0] = 'done';
    } else {
      newStepStatus[0] = 'pending';
    }
    
    // Step 1: Choose Concept - check if concept is selected
    if (selectedConcept) {
      newStepStatus[1] = 'done';
    } else {
      newStepStatus[1] = 'pending';
    }
    
    // Step 2: Script Generation - check if scripts exist
    if (selectedScript && selectedScript.segments && selectedScript.segments.length > 0) {
      newStepStatus[2] = 'done';
    } else {
      newStepStatus[2] = 'pending';
    }
    
    // Step 3: Choose Script - check if script is selected
    if (selectedScript && selectedScript.segments && selectedScript.segments.length > 0) {
      newStepStatus[3] = 'done';
    } else {
      newStepStatus[3] = 'pending';
    }
    
    // Step 4: Image Generation - check if images exist
    const hasImages = Object.keys(generatedImages).length > 0 || 
                     (selectedScript?.segments?.some(seg => seg.s3Key || seg.image_s3_key || seg.imageS3Key));
    if (hasImages) {
      newStepStatus[4] = 'done';
    } else {
      newStepStatus[4] = 'pending';
    }
    
    // Step 5: Video Generation - check if videos exist
    const hasVideos = Object.keys(generatedVideos).length > 0 || 
                     (selectedScript?.segments?.some(seg => seg.videoUrl || seg.video_url));
    if (hasVideos) {
      newStepStatus[5] = 'done';
    } else {
      newStepStatus[5] = 'pending';
    }
    
    setStepStatus(newStepStatus);
  }, [selectedProject, concepts, selectedConcept, scripts, selectedScript, generatedImages, generatedVideos]);

  const resetFlow = () => {
    setCurrentStep(0);
    setStepStatus({
      0: 'pending',
      1: 'pending',
      2: 'pending',
      3: 'pending',
      4: 'pending',
      5: 'pending',
    });
    setConcepts(null);
    setSelectedConcept(null);
    setScripts(null);
    setSelectedScript(null);
    setGeneratedImages({});
    setGeneratedVideos({});
    setGenerationProgress({});
    // Reset model selections to defaults
    setSelectedImageModel(chatApi.getDefaultModel('IMAGE'));
    setSelectedVideoModel(chatApi.getDefaultModel('VIDEO'));
  };

  const updateStepStatus = (stepId, status) => {
    setStepStatus(prev => ({
      ...prev,
      [stepId]: status
    }));
  };

  const getStepIcon = (stepId) => {
    const status = stepStatus[stepId];
    let icon;
    
    if (status === 'loading') {
      icon = '⏳';
    } else if (status === 'done') {
      icon = '✅';
    } else if (status === 'pending' && stepId === currentStep) {
      icon = '▶️';
    } else {
      icon = '⏸️';
    }
    
    return icon;
  };

  const isStepDisabled = (stepId) => {
    if (loading) return true;
    if (stepId === 0) return false; // First step is always enabled
    if (stepId === 1) return !concepts;
    if (stepId === 2) return !selectedConcept;
    if (stepId === 3) return !selectedScript || !selectedScript.segments;
    if (stepId === 4) return !selectedScript || !selectedScript.segments;
    if (stepId === 5) return Object.keys(generatedImages).length === 0;
    return true;
  };

  const handleStepClick = async (stepId) => {
    if (isStepDisabled(stepId) || loading) return;
    
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

  return {
    currentStep,
    setCurrentStep,
    stepStatus,
    setStepStatus,
    concepts,
    setConcepts,
    selectedConcept,
    setSelectedConcept,
    scripts,
    setScripts,
    selectedScript,
    setSelectedScript,
    generatedImages,
    setGeneratedImages,
    generatedVideos,
    setGeneratedVideos,
    generationProgress,
    setGenerationProgress,
    redoImageModel,
    setRedoImageModel,
    redoVideoModel,
    setRedoVideoModel,
    loading,
    setLoading,
    steps,
    resetFlow,
    updateStepStatus,
    getStepIcon,
    isStepDisabled,
    handleStepClick,
    handleRedoStep,
    handleConceptSelect,
    handleScriptSelect,
    handleRedoWithModel
  };
};