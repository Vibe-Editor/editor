import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import Loading from './Loading';

const TemplateSelection = ({ storyArcData, onClose, onTemplateSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [currentStep, setCurrentStep] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle' | 'out' | 'in'
  const [view, setView] = useState('grid'); // 'grid' | 'loading'
  const [fullLoading, setFullLoading] = useState(false); // fullscreen loading overlay
  const [showReadyToGenerate, setShowReadyToGenerate] = useState(false);

  // Mock template data - replace with actual template data
  const templates = [
    {
      id: 'template_1',
      thumbnail: '/api/placeholder/300/200',
      description: 'Clean, corporate-style template perfect for business presentations',
    },
    {
      id: 'template_2', 
      thumbnail: '/api/placeholder/300/200',
      description: 'Dynamic template with creative transitions and effects',
    },
    {
      id: 'template_3',
      thumbnail: '/api/placeholder/300/200',
      description: 'Structured template ideal for tutorials and educational videos',
    },
    {
      id: 'template_4',
      thumbnail: '/api/placeholder/300/200',
      description: 'Optimized for social platforms with engaging visuals',
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }

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

  const handleLoadingDone = () => {
    // Here you can dispatch adding to timeline or navigate as needed
    // For prototype, just close loader and maybe alert
    setShowLoading(false);
    window.dispatchEvent(new CustomEvent('timeline:add', { detail: { template: selectedTemplate } }));
  };

  // Fullscreen Loading overlay when all selections are done
  if (fullLoading) {
    return (
      <div className="w-full h-screen bg-black overflow-hidden">
        <div
          className={`w-full h-full transform-gpu transition-transform duration-500 ease-in-out ${
            animationPhase === 'in' ? 'translate-x-full' : 'translate-x-0'
          }`}
          style={{ willChange: 'transform' }}
        >
          <Loading onDone={() => { setShowLoading(false); }} />
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (showReadyToGenerate) {
      setShowReadyToGenerate(false);
      return;
    }
    // Go back a section if possible
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
    } else if (onClose) {
      onClose();
    }
  };

  const handleReadyGenerate = () => {
    setFullLoading(true);
    setAnimationPhase('in');
    setTimeout(() => setAnimationPhase('idle'), 20);
  };

  return (
    <div className="w-full h-screen bg-black flex">
      {/* Left Panel - Story Arc Content */}
      <div className="w-1/3 bg-gray-900 flex flex-col border-r border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <img src={assets.SandBoxLogo} alt="Usuals.ai" className="w-6 h-6" />
            <h1 className="text-white text-lg font-semibold">Story Arc</h1>
          </div>
        </div>

        {/* Story Arc Content - Collapsible Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {storyArcData?.sections?.map((section, index) => {
            if (index > currentStep) return null;
            const isExpanded = expandedSections[index];
            return (
              <div key={index} className="border border-gray-700 rounded-lg">
                <div 
                  className="p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-yellow-400 font-bold text-xs tracking-wider">
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
                  <div className="px-3 pb-3 border-t border-gray-700">
                    <p className="text-gray-300 text-xs leading-relaxed pt-3">
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
      <div className="flex-1 flex flex-col relative">
        {/* Back Button in main content area */}
        <div
          className="absolute top-6 left-6 z-10 cursor-pointer"
          onClick={handleBack}
          role="button"
          aria-label="Go back"
          title="Back"
        >
          <div className="w-10 h-10 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center hover:bg-gray-700/80 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
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
                    <div className="grid grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedTemplate?.id === template.id
                            ? 'border-yellow-400 shadow-lg shadow-yellow-400/20'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <div className="relative aspect-video bg-gray-900">
                          {/* Template Thumbnail Placeholder */}
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-yellow-400/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <p className="text-gray-400 text-sm">Template Preview</p>
                            </div>
                          </div>
                          
                          {/* Selection Overlay */}
                          {selectedTemplate?.id === template.id && (
                            <div className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center">
                              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Description only */}
                        {template.description && (
                          <div className="p-4 bg-gray-900/80">
                            <p className="text-gray-400 text-sm">{template.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
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
                      className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-medium transition-colors"
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
      </div>
    </div>
  );
};

export default TemplateSelection;
