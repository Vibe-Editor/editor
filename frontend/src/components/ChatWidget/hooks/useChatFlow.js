import { useState, useEffect } from 'react';
import { INITIAL_STEP_STATUS } from '../constants/chatConstants';

export function useChatFlow(selectedProject, concepts, selectedConcept, scripts, selectedScript, generatedImages, generatedVideos) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(INITIAL_STEP_STATUS);

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
    
    // Step 4: Image Generation - check if images exist (from API or generation)
    const hasImages = Object.keys(generatedImages).length > 0 || 
                     (selectedScript?.segments?.some(seg => seg.s3Key || seg.image_s3_key || seg.imageS3Key));
    if (hasImages) {
      newStepStatus[4] = 'done';
    } else {
      newStepStatus[4] = 'pending';
    }
    
    // Step 5: Video Generation - check if videos exist (from API or generation)
    const hasVideos = Object.keys(generatedVideos).length > 0 || 
                     (selectedScript?.segments?.some(seg => seg.videoUrl || seg.video_url));
    if (hasVideos) {
      newStepStatus[5] = 'done';
    } else {
      newStepStatus[5] = 'pending';
    }
    
    // Debug logging for step status updates
    if (hasImages || hasVideos) {
      console.log('Step status update:', {
        concepts: concepts?.length || 0,
        selectedConcept: !!selectedConcept,
        selectedScript: !!selectedScript,
        selectedScriptSegments: selectedScript?.segments?.length || 0,
        images: Object.keys(generatedImages).length,
        videos: Object.keys(generatedVideos).length,
        hasImages,
        hasVideos,
        newStepStatus
      });
    }
    
    setStepStatus(newStepStatus);
  }, [selectedProject, concepts, selectedConcept, scripts, selectedScript, generatedImages, generatedVideos]);

  const resetFlow = () => {
    setCurrentStep(0);
    setStepStatus(INITIAL_STEP_STATUS);
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

  const isStepDisabled = (stepId, loading) => {
    if (loading) return true;
    if (stepId === 0) return false; // First step is always enabled
    if (stepId === 1) return !concepts;
    if (stepId === 2) return !selectedConcept;
    if (stepId === 3) return !selectedScript || !selectedScript.segments;
    if (stepId === 4) return !selectedScript || !selectedScript.segments;
    if (stepId === 5) return Object.keys(generatedImages).length === 0;
    return true;
  };

  return {
    currentStep,
    setCurrentStep,
    stepStatus,
    resetFlow,
    updateStepStatus,
    getStepIcon,
    isStepDisabled
  };
} 