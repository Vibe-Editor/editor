import { webInfoApi } from "../../services/web-info";
import { conceptWriterApi } from "../../services/concept-writer";
import { segmentationApi } from "../../services/segmentationapi";
import { chatApi } from "../../services/chat";
import { s3Api } from "../../services/s3";
import { getTextCreditCost, getImageCreditCost, getVideoCreditCost, formatCreditDeduction } from "../../lib/pricing";
import { useProjectStore } from "../../store/useProjectStore";
import { useAuth } from "../../hooks/useAuth";

export const useStepActions = ({
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
  updateStepStatus,
  setCurrentStep
}) => {
  const { user } = useAuth();
  const { fetchBalance } = useProjectStore();

  // Helper function to show credit deduction after successful API response
  const showCreditDeduction = (serviceName, model = null, count = 1) => {
    let credits = 0;
    let message = '';

    switch (serviceName) {
      case 'Web Info Processing':
        credits = getTextCreditCost('web-info');
        message = formatCreditDeduction('Web Info Processing', credits);
        break;
      case 'Concept Generation':
        credits = getTextCreditCost('concept generator');
        message = formatCreditDeduction('Concept Generation', credits);
        break;
      case 'Script Generation':
        credits = getTextCreditCost('script & segmentation') * count;
        message = formatCreditDeduction('Script Generation', credits);
        break;
      case 'Image Generation':
        if (model) {
          credits = getImageCreditCost(model) * count;
          message = formatCreditDeduction(`Image Generation (${model})`, credits);
        } else {
          credits = getImageCreditCost('imagen') * count; // default to imagen
          message = formatCreditDeduction('Image Generation', credits);
        }
        break;
      case 'Video Generation':
        if (model) {
          credits = getVideoCreditCost(model, 5) * count; // 8 seconds default
          message = formatCreditDeduction(`Video Generation (${model})`, credits);
        } else {
          credits = getVideoCreditCost('veo2', 5) * count; // default to veo2
          message = formatCreditDeduction('Video Generation', credits);
        }
        break;
      default:
        message = `Credit deducted for ${serviceName}`;
    }

    // Refresh balance if user is authenticated
    if (user?.id) {
      fetchBalance(user.id);
    }
  };

  // Helper function to show request failure message
  const showRequestFailed = (serviceName = null) => {
    const message = serviceName ? `${serviceName} request failed` : "Request failed";
    console.error(message);
  };

  const runConceptWriter = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(0, 'loading');

    try {
      console.log("Starting pipeline with web-info...");
      const webInfoResult = await webInfoApi.processWebInfo(prompt, selectedProject?.id);
      console.log("Web-info response:", webInfoResult);

      console.log("Calling concept-writer...");
      const webInfoContent = webInfoResult.choices[0].message.content;
      const conceptsResult = await conceptWriterApi.generateConcepts(
        prompt,
        webInfoContent,
        selectedProject?.id,
      );

      console.log("Concept-writer response:", conceptsResult);
      
      // Show combined credit deduction for both API calls (web-info + concept generation)
      const webInfoCredits = getTextCreditCost('web-info');
      const conceptCredits = getTextCreditCost('concept generator');
      const totalCredits = webInfoCredits + conceptCredits;
      
      showCreditDeduction('Concept Writer Process', null, 1);
      
      setConcepts(conceptsResult.concepts);
      updateStepStatus(0, 'done');
      setCurrentStep(1);
    } catch (error) {
      console.error("Error in concept writer:", error);
      showRequestFailed("Concept Generation");
      setError(error.message || "Failed to generate concepts. Please try again.");
      updateStepStatus(0, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runScriptGeneration = async () => {
    if (!selectedConcept) {
      setError("Please select a concept first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(2, 'loading');

    try {
      const [res1, res2] = await Promise.all([
        segmentationApi.getSegmentation({
          prompt,
          concept: selectedConcept.title,
          negative_prompt: "",
          project_id: selectedProject?.id,
        }),
        segmentationApi.getSegmentation({
          prompt,
          concept: selectedConcept.title,
          negative_prompt: "",
          project_id: selectedProject?.id,
        }),
      ]);
      
      // Show credit deduction after successful API responses
      showCreditDeduction("Script Generation", null, 2);
      setScripts({ response1: res1, response2: res2 });
      updateStepStatus(2, 'done');
      setCurrentStep(3);
    } catch (error) {
      console.error("Error in script generation:", error);
      showRequestFailed("Script Generation");
      setError(error.message || "Failed to generate scripts. Please try again.");
      updateStepStatus(2, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runImageGeneration = async () => {
    if (!selectedScript) {
      setError("Please select a script first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(4, 'loading');
    setGenerationProgress({});

    try {
      const segments = selectedScript.segments;
      const artStyle = selectedScript.artStyle || "";
      const imagesMap = {};
      
      // Create parallel promises for all segments
      const imagePromises = segments.map(async (segment, index) => {
        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "image",
            status: "generating",
            index: index + 1,
            total: segments.length,
          },
        }));

        try {
          const result = await chatApi.generateImage({
            visual_prompt: segment.visual,
            art_style: artStyle,
            uuid: segment.id,
            project_id: selectedProject?.id,
            model: selectedImageModel,
          });

          if (result.s3_key) {
            const imageUrl = await s3Api.downloadImage(result.s3_key);
            imagesMap[segment.id] = imageUrl;
            segment.s3Key = result.s3_key;

            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "image",
                status: "completed",
                index: index + 1,
                total: segments.length,
              },
            }));

            return { segmentId: segment.id, imageUrl, s3Key: result.s3_key };
          } else {
            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "image",
                status: "error",
                index: index + 1,
                total: segments.length,
                error: "No image key returned from API",
              },
            }));
            return null;
          }
        } catch (err) {
          console.error(`Error generating image for segment ${segment.id}:`, err);
          setGenerationProgress((prev) => ({
            ...prev,
            [segment.id]: {
              type: "image",
              status: "error",
              index: index + 1,
              total: segments.length,
              error: err.message,
            },
          }));
          return null;
        }
      });

      // Wait for all image generation requests to complete
      await Promise.allSettled(imagePromises);

      // Show credit deduction after successful generation for all segments
      const totalSegments = segments.length;
      showCreditDeduction("Image Generation", selectedImageModel, totalSegments);

      setGeneratedImages(imagesMap);
      updateStepStatus(4, 'done');
      setCurrentStep(5);
    } catch (error) {
      console.error("Error in image generation:", error);
      showRequestFailed("Image Generation");
      setError(error.message || "Failed to generate images. Please try again.");
      updateStepStatus(4, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runVideoGeneration = async () => {
    const segments = selectedScript?.segments || [];
    const validSegments = segments.filter(segment => {
      const segmentIdVariants = [segment.id, `seg-${segment.id}`, segment.segmentId, segment.uuid];
      return segmentIdVariants.some(id => segment.s3Key);
    });

    if (validSegments.length === 0) {
      setError("Please generate images first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(5, 'loading');
    setGenerationProgress({});

    try {
      const artStyle = selectedScript.artStyle || "";
      const videosMap = {};
      
      // Create parallel promises for all valid segments
      const videoPromises = validSegments.map(async (segment, index) => {
        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "video",
            status: "generating",
            index: index + 1,
            total: validSegments.length,
          },
        }));

        try {
          const result = await chatApi.generateVideo({
            animation_prompt: segment.animation || segment.visual,
            art_style: artStyle,
            image_s3_key: segment.s3Key,
            uuid: segment.id,
            project_id: selectedProject?.id,
            model: selectedVideoModel,
          });

          if (result.s3_key) {
            const videoUrl = await s3Api.downloadVideo(result.s3_key);
            videosMap[segment.id] = videoUrl;

            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "completed",
                index: index + 1,
                total: validSegments.length,
              },
            }));

            return { segmentId: segment.id, videoUrl };
          } else {
            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "error",
                index: index + 1,
                total: validSegments.length,
                error: "No video key returned from API",
              },
            }));
            return null;
          }
        } catch (err) {
          console.error(`Error generating video for segment ${segment.id}:`, err);
          setGenerationProgress((prev) => ({
            ...prev,
            [segment.id]: {
              type: "video",
              status: "error",
              index: index + 1,
              total: validSegments.length,
              error: err.message,
            },
          }));
          return null;
        }
      });

      // Wait for all video generation requests to complete
      await Promise.allSettled(videoPromises);

      // Show credit deduction after successful generation for valid segments
      if (validSegments.length > 0) {
        showCreditDeduction("Video Generation", selectedVideoModel, validSegments.length);
      }

      setGeneratedVideos(videosMap);
      updateStepStatus(5, 'done');
    } catch (error) {
      console.error("Error in video generation:", error);
      showRequestFailed("Video Generation");
      setError(error.message || "Failed to generate videos. Please try again.");
      updateStepStatus(5, 'pending');
    } finally {
      setLoading(false);
    }
  };

  return {
    runConceptWriter,
    runScriptGeneration,
    runImageGeneration,
    runVideoGeneration
  };    }