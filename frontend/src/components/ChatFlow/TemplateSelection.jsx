import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import Loading from './Loading';
import { useProjectStore } from '../../store/useProjectStore';
import { promptOptimizerService } from '../../services/promptOptimizer';

const TemplateSelection = ({ storyArcData, templateResponses, segmentIds, videoPreferences, onClose, onTemplateSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [currentStep, setCurrentStep] = useState(0);
  // Removed old inline loading usage in favor of <Loading /> component
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle' | 'out' | 'in'
  const [view] = useState('grid'); // 'grid' | 'loading'
  const [showReadyToGenerate, setShowReadyToGenerate] = useState(false);
  const [generationResults, setGenerationResults] = useState([]);
  // New: drive full-screen Loading component
  const [showFullLoading, setShowFullLoading] = useState(false);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Determine if initial template loading is in progress (any section still null)
  const isInitialTemplateLoading = Array.isArray(templateResponses)
    ? templateResponses.some((t) => t === null)
    : false;

  // Get templates for current step (limit to 4 fresh choices)
  const currentTemplates = (templateResponses[currentStep] || []).slice(0, 4);

  // Read/write selection to global store (per section)
  const setTemplateSelection = useProjectStore((s) => s.setTemplateSelection);
  const getTemplateSelection = useProjectStore((s) => s.getTemplateSelection);
  const selectedProject = useProjectStore((s) => s.selectedProject);

  // On step change, restore previously selected template (if any) for that step
  React.useEffect(() => {
    const previouslySelected = getTemplateSelection(currentStep);
    setSelectedTemplate(previouslySelected || null);
  }, [currentStep, getTemplateSelection]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template, currentStep);
    }

    // Persist selection per section in global store
    setTemplateSelection(currentStep, {
      id: template.id,
      description: template.description,
      jsonPrompt: template.jsonPrompt,
      s3Key: template.s3Key,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });

    const totalSections = storyArcData?.sections?.length || 1;
    const isLast = currentStep >= totalSections - 1;

    // Animate grid out to the left
    setAnimationPhase('out');
    setTimeout(() => {
      if (isLast) {
        // Final selection → show Ready to generate button in main area
        setShowReadyToGenerate(true);
        setAnimationPhase('in');
        setTimeout(() => setAnimationPhase('idle'), 20);
      } else {
        // Advance to next section and keep selecting
        setExpandedSections((prev) => ({
          ...prev,
          [currentStep]: false,
          [currentStep + 1]: true,
        }));
        setCurrentStep((prev) => prev + 1);
        // Prepare next grid to come from right then settle
        setAnimationPhase('in');
        setTimeout(() => setAnimationPhase('idle'), 20);
      }
    }, 300);
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Removed back/next buttons flow in favor of click-to-advance

  // Replace old overlay with Loading component (full screen)
  if (showFullLoading) {
    return (
      <Loading
        isCompleteExternal={isGenerationComplete}
        loadingProgress={generationProgress}
        onDone={() => {
          window.dispatchEvent(new CustomEvent('timeline:add', { detail: { results: generationResults } }));
          if (onClose) onClose();
        }}
      />
    );
  }

  const handleBack = () => {
    if (showReadyToGenerate) {
      setShowReadyToGenerate(false);
      return;
    }
    // Go back a section if possible (only if not on step 0)
    if (currentStep > 0) {
      setAnimationPhase('in');
      setTimeout(() => {
        setExpandedSections((prev) => ({
          ...prev,
          [currentStep]: false,
          [currentStep - 1]: true,
        }));
        setCurrentStep((prev) => prev - 1);
        setTimeout(() => setAnimationPhase('idle'), 20);
      }, 10);
    }
    // No back button functionality on step 0 - user must proceed through template selection
  };

  const handleReadyGenerate = async () => {
    console.log('Starting video generation for all 5 segments...');
    setShowFullLoading(true);
    setAnimationPhase('in');
    setTimeout(() => setAnimationPhase('idle'), 20);

    try {
      // Debug the video preferences structure
      console.log('🔍 Raw video preferences prop:', videoPreferences);
      console.log('🔍 Video preferences type:', typeof videoPreferences);
      console.log('🔍 Video preferences keys:', videoPreferences ? Object.keys(videoPreferences) : 'null/undefined');
      
      // Check if it's nested under 'data'
      const actualPreferences = videoPreferences?.data || videoPreferences;
      console.log('🔍 Actual preferences:', actualPreferences);
      console.log('🔍 Final config exists?:', !!actualPreferences?.finalConfig);
      console.log('🔍 Final config value:', actualPreferences?.finalConfig);

      // Use finalConfig from video preferences as user preferences
      const finalConfigString = actualPreferences?.finalConfig 
        ? JSON.stringify(actualPreferences.finalConfig)
        : 'no_preferences_set';

      console.log('✅ Final config string:', finalConfigString);
      console.log('✅ Project ID:', selectedProject?.id);
      console.log('✅ Story sections:', storyArcData?.sections);

      // Create 5 parallel requests for video generation
      let completed = 0;
      const total = 5;
      const generationPromises = Array.from({ length: total }, async (_, index) => {
        const selectedTemplate = getTemplateSelection(index);
        const segmentId = segmentIds[index];

        if (!selectedTemplate || !segmentId) {
          console.error(`Missing data for segment ${index}:`, { selectedTemplate, segmentId });
          return {
            sectionIndex: index,
            error: 'Missing template or segment ID'
          };
        }

        // Get the story segment content for this section
        const storySegmentContent = storyArcData?.sections?.[index]?.content || '';
        
        console.log(`Making video generation request ${index + 1}/5 for segment: ${segmentId}`);
        console.log(`Story segment content: ${storySegmentContent}`);
        
        const requestPayload = {
          jsonPrompt: selectedTemplate.jsonPrompt,
          description: storySegmentContent, // Use story segment content instead of template description
          userPreferences: finalConfigString, // This should now contain the finalConfig JSON
          segmentId: segmentId,
          projectId: selectedProject?.id
        };
        
        console.log(`🚀 API Request payload for segment ${index + 1}:`, requestPayload);

        try {
          const result = await promptOptimizerService.optimizeAndGenerate(requestPayload);

          console.log(`✅ Video generation request ${index + 1}/5 completed successfully:`, {
            sectionIndex: index,
            segmentId: segmentId,
            result: result
          });

          completed += 1;
          setGenerationProgress(completed / total);
          return {
            sectionIndex: index,
            segmentId: segmentId,
            result: result
          };
        } catch (error) {
          console.error(`❌ Video generation request ${index + 1}/5 failed for segment ${segmentId}:`, error);
          completed += 1;
          setGenerationProgress(completed / total);
          return {
            sectionIndex: index,
            segmentId: segmentId,
            error: error.message
          };
        }
      });

      // Wait for all requests to complete
      const results = await Promise.all(generationPromises);
      
      console.log('All 5 video generation requests completed:', results);
      setGenerationResults(results);
      
      // Signal Loading component to show completion UI
      setIsGenerationComplete(true);
      
    } catch (error) {
      console.error('Error during video generation process:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#373738] to-[#1D1D1D] flex relative">
      {/* Left Panel - Story Arc Content */}
      <div className="w-1/3 bg-white/5 backdrop-blur-sm flex flex-col border-r border-white/10">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <img src={assets.SandBoxLogo} alt="Usuals.ai" className="w-6 h-6" />
            <h1 className="text-white text-lg font-semibold">Template Selection</h1>
          </div>
        </div>

        {/* Story Arc Content - Collapsible Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {storyArcData?.sections?.map((section, index) => {
            if (index > currentStep) return null;
            const isExpanded = expandedSections[index];
            return (
              <div key={index} className="border border-white/10 rounded-lg bg-white/5 backdrop-blur-[2px]">
                <div 
                  className="p-3 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[#F9D312] font-bold text-xs tracking-wider">
                      {section.title}
                    </h3>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-white/10">
                    <p className="text-white/80 text-xs leading-relaxed pt-3">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            );
          }) || (
            <div className="text-gray-400 text-center py-8">
              No story arc data available
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Template Selection */}
      <div className={`flex-1 flex flex-col relative`}>
        {/* Back Button in main content area - only show if not on step 0 */}
        {currentStep > 0 && (
          <div
            className="absolute top-6 left-6 z-10 cursor-pointer"
            onClick={handleBack}
            role="button"
            aria-label="Go back"
            title="Back"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        )}
        <div className="flex-1 p-8 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-white text-3xl font-semibold mb-6 text-center">
              Choose Your Template
            </h2>
            <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
              Select a template that best fits your story arc and video style. Each template is optimized for different types of content.
            </p>
            
            {/* Animated content wrapper to avoid scrollbars */}
            <div className="overflow-hidden">
              {view === 'grid' && !showReadyToGenerate && (
                <div
                  key={`grid-${currentStep}`}
                  className={`transform-gpu transition-transform duration-500 ease-in-out ${
                    animationPhase === 'out'
                      ? '-translate-x-full'
                      : animationPhase === 'in'
                      ? 'translate-x-full'
                      : 'translate-x-0'
                  }`}
                  style={{ willChange: 'transform' }}
                >
                  {/* Template Grid (match VideoGrid sizing) */}
                  <div className="max-w-4xl mx-auto">
                    {currentTemplates.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                      {currentTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedTemplate?.id === template.id
                            ? 'border-[#F9D312] shadow-lg shadow-yellow-400/20'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="relative aspect-video bg-gradient-to-br from-amber-50/20 to-orange-100/20">
                          {/* Video Preview */}
                          <video
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                            onMouseEnter={(e) => e.target.play()}
                            onMouseLeave={(e) => e.target.pause()}
                          >
                            <source src={template.s3Key} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          
                          {/* Selection Overlay */}
                          {selectedTemplate?.id === template.id && (
                            <div className="absolute inset-0 bg-[#F9D312]/10 flex items-center justify-center">
                              <div className="w-12 h-12 bg-[#F9D312] rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Description */}
                        {template.description && (
                          <div className="p-4 bg-white/5 backdrop-blur-sm border-t border-white/10">
                            <p className="text-white/80 text-sm">{template.description}</p>
                          </div>
                        )}
                      </div>
                      ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mb-4 mx-auto border border-white/20">
                            <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-white/70 text-sm">No templates available for this section</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'grid' && showReadyToGenerate && (
                <div
                  key={`ready-${currentStep}`}
                  className={`transform-gpu transition-transform duration-500 ease-in-out ${
                    animationPhase === 'in' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                  style={{ willChange: 'transform' }}
                >
                  <div className="w-full h-64 flex flex-col items-center justify-center text-center space-y-4">
                    <h3 className="text-white text-2xl font-semibold">Ready to generate videos</h3>
                    <p className="text-gray-400">All selections are complete. Proceed when you are ready.</p>
                    <button
                      onClick={handleReadyGenerate}
                      className="px-6 py-3 bg-[#F9D312] hover:bg-[#F9D312] text-black rounded-lg font-medium transition-colors"
                    >
                      Ready to generate videos
                    </button>
                  </div>
                </div>
              )}

              {/* Loading will show as fullscreen overlay after clicking ready */}
            </div>
          </div>
        </div>
      {/* Fullscreen blur + centered loader while fetching templates on enter */}
      {isInitialTemplateLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          {/* Backdrop blur overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          {/* Center loader */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#F9D312] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white/80 text-sm" aria-live="polite">Loading templates...</p>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default TemplateSelection;
