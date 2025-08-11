import { useState, useEffect } from "react";
import { chatApi } from "../services/chat";

export const useStepFlow = () => {
  // New 6-step flow states
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({
    0: "pending", // concept writer
    1: "pending", // user chooses concept
    2: "pending", // script generation
    3: "pending", // user chooses script
    4: "pending", // image generation
    5: "pending", // video generation
  });

  const [concepts, setConcepts] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [scripts, setScripts] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [generatedVideos, setGeneratedVideos] = useState({});

  // model selection states
  const [selectedImageModel, setSelectedImageModel] = useState(
    chatApi.getDefaultModel("IMAGE"),
  );
  const [selectedVideoModel, setSelectedVideoModel] = useState(
    chatApi.getDefaultModel("VIDEO"),
  );

  // redo modal states
  const [showRedoModal, setShowRedoModal] = useState(false);
  const [redoStepId, setRedoStepId] = useState(null);
  const [redoImageModel, setRedoImageModel] = useState(
    chatApi.getDefaultModel("IMAGE"),
  );
  const [redoVideoModel, setRedoVideoModel] = useState(
    chatApi.getDefaultModel("VIDEO"),
  );

  const steps = [
    { id: 0, name: "Concept Writer", description: "Generate video concepts" },
    {
      id: 1,
      name: "Choose Concept",
      description: "Select your preferred concept",
    },
    {
      id: 2,
      name: "Script Generation",
      description: "Generate script segments",
    },
    {
      id: 3,
      name: "Choose Script",
      description: "Select your preferred script",
    },
    {
      id: 4,
      name: "Image Generation",
      description: "Generate images for segments",
    },
    {
      id: 5,
      name: "Video Generation",
      description: "Generate videos from images",
    },
  ];

  // Update step status based on current data
  const updateStepStatusBasedOnData = (selectedProject) => {
    if (!selectedProject) return;

    const newStepStatus = { ...stepStatus };

    // Step 0: Concept Writer - check if concepts exist
    if (concepts && concepts.length > 0) {
      newStepStatus[0] = "done";
    } else {
      newStepStatus[0] = "pending";
    }

    // Step 1: Choose Concept - check if concept is selected
    if (selectedConcept) {
      newStepStatus[1] = "done";
    } else {
      newStepStatus[1] = "pending";
    }

    // Step 2: Script Generation - check if scripts exist
    if (
      selectedScript &&
      selectedScript.segments &&
      selectedScript.segments.length > 0
    ) {
      newStepStatus[2] = "done";
    } else {
      newStepStatus[2] = "pending";
    }

    // Step 3: Choose Script - check if script is selected
    if (
      selectedScript &&
      selectedScript.segments &&
      selectedScript.segments.length > 0
    ) {
      newStepStatus[3] = "done";
    } else {
      newStepStatus[3] = "pending";
    }

    // Step 4: Image Generation - check if images exist (from API or generation)
    const hasImages =
      Object.keys(generatedImages).length > 0 ||
      selectedScript?.segments?.some(
        (seg) => seg.s3Key || seg.image_s3_key || seg.imageS3Key,
      );
    if (hasImages) {
      newStepStatus[4] = "done";
    } else {
      newStepStatus[4] = "pending";
    }

    // Step 5: Video Generation - check if videos exist (from API or generation)
    const hasVideos =
      Object.keys(generatedVideos).length > 0 ||
      selectedScript?.segments?.some((seg) => seg.videoUrl || seg.video_url);
    if (hasVideos) {
      newStepStatus[5] = "done";
    } else {
      newStepStatus[5] = "pending";
    }

    // Debug logging for step status updates
    if (hasImages || hasVideos) {
      console.log("Step status update:", {
        concepts: concepts?.length || 0,
        selectedConcept: !!selectedConcept,
        selectedScript: !!selectedScript,
        selectedScriptSegments: selectedScript?.segments?.length || 0,
        images: Object.keys(generatedImages).length,
        videos: Object.keys(generatedVideos).length,
        hasImages,
        hasVideos,
        newStepStatus,
      });
    }

    setStepStatus(newStepStatus);
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setStepStatus({
      0: "pending",
      1: "pending",
      2: "pending",
      3: "pending",
      4: "pending",
      5: "pending",
    });
    setConcepts(null);
    setSelectedConcept(null);
    setScripts(null);
    setSelectedScript(null);
    setGeneratedImages({});
    setGeneratedVideos({});
    // Reset model selections to defaults
    setSelectedImageModel(chatApi.getDefaultModel("IMAGE"));
    setSelectedVideoModel(chatApi.getDefaultModel("VIDEO"));
  };

  const updateStepStatus = (stepId, status) => {
    setStepStatus((prev) => ({
      ...prev,
      [stepId]: status,
    }));
  };

  const getStepIcon = (stepId) => {
    const status = stepStatus[stepId];
    let icon;

    if (status === "loading") {
      icon = "⏳";
    } else if (status === "done") {
      icon = "✅";
    } else if (status === "pending" && stepId === currentStep) {
      icon = "▶️";
    } else {
      icon = "⏸️";
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

  const handleStepClick = async (stepId, loading, stepActions) => {
    if (isStepDisabled(stepId, loading) || loading) return;

    setCurrentStep(stepId);

    // Only run the step if it's not already done
    if (stepStatus[stepId] !== "done") {
      switch (stepId) {
        case 0:
          await stepActions.runConceptWriter();
          break;
        case 2:
          await stepActions.runScriptGeneration();
          break;
        case 4:
          await stepActions.runImageGeneration();
          break;
        case 5:
          await stepActions.runVideoGeneration();
          break;
      }
    }
  };

  const handleRedoStep = async (stepId, loading, stepActions) => {
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
        await stepActions.runConceptWriter();
        break;
      case 2:
        await stepActions.runScriptGeneration();
        break;
    }
  };

  const handleRedoWithModel = async (loading, stepActions) => {
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
        await stepActions.runImageGeneration();
        break;
      case 5:
        await stepActions.runVideoGeneration();
        break;
    }

    setRedoStepId(null);
  };

  const handleConceptSelect = (concept) => {
    setSelectedConcept(concept);
    updateStepStatus(1, "done");
    setCurrentStep(2);
  };

  const handleScriptSelect = (script) => {
    setSelectedScript(script);
    updateStepStatus(3, "done");
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
    selectedImageModel,
    setSelectedImageModel,
    selectedVideoModel,
    setSelectedVideoModel,
    showRedoModal,
    setShowRedoModal,
    redoStepId,
    setRedoStepId,
    redoImageModel,
    setRedoImageModel,
    redoVideoModel,
    setRedoVideoModel,
    steps,
    updateStepStatusBasedOnData,
    resetFlow,
    updateStepStatus,
    getStepIcon,
    isStepDisabled,
    handleStepClick,
    handleRedoStep,
    handleRedoWithModel,
    handleConceptSelect,
    handleScriptSelect,
  };
};
