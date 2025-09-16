import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import Loading from './Loading';

const TemplateSelection = ({ storyArcData, onClose, onTemplateSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showLoading, setShowLoading] = useState(false);

  // Mock template data - replace with actual template data
  const templates = [
    {
      id: 'template_1',
      name: 'Professional Presentation',
      description: 'Clean, corporate-style template perfect for business presentations',
      thumbnail: '/api/placeholder/300/200',
      category: 'Business'
    },
    {
      id: 'template_2', 
      name: 'Creative Storytelling',
      description: 'Dynamic template with creative transitions and effects',
      thumbnail: '/api/placeholder/300/200',
      category: 'Creative'
    },
    {
      id: 'template_3',
      name: 'Educational Content',
      description: 'Structured template ideal for tutorials and educational videos',
      thumbnail: '/api/placeholder/300/200',
      category: 'Education'
    },
    {
      id: 'template_4',
      name: 'Social Media',
      description: 'Optimized for social platforms with engaging visuals',
      thumbnail: '/api/placeholder/300/200',
      category: 'Social'
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleContinue = () => {
    if (!selectedTemplate) return;
    setShowLoading(true);
  };

  const handleLoadingDone = () => {
    // Here you can dispatch adding to timeline or navigate as needed
    // For prototype, just close loader and maybe alert
    setShowLoading(false);
    window.dispatchEvent(new CustomEvent('timeline:add', { detail: { template: selectedTemplate } }));
  };

  if (showLoading) {
    return <Loading onDone={handleLoadingDone} />;
  }

  return (
    <div className="w-full h-screen bg-black flex">
      {/* Left Panel - Story Arc Content */}
      <div className="w-1/3 bg-gray-900 flex flex-col border-r border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={assets.SandBoxLogo} alt="Usuals.ai" className="w-6 h-6" />
            <h1 className="text-white text-lg font-semibold">Story Arc</h1>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Story Arc Content - Collapsible Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {storyArcData?.sections?.map((section, index) => {
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

        {/* Footer Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            <p className="mb-2">Word Count: {storyArcData?.wordCount || 0}</p>
            <p>Select a template to continue with your video creation.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Template Selection */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-white text-3xl font-semibold mb-8 text-center">
              Choose Your Template
            </h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Select a template that best fits your story arc and video style. Each template is optimized for different types of content.
            </p>
            
            {/* Template Grid */}
            <div className="grid grid-cols-2 gap-8">
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
                  
                  {/* Template Info */}
                  <div className="p-6 bg-gray-900/80">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium text-lg">{template.name}</h3>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-12">
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Back to Story Arc
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedTemplate}
                className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-600 text-black rounded-lg font-medium transition-colors"
              >
                Continue with Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelection;
