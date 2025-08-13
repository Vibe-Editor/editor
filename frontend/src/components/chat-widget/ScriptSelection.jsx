import React, { useState } from "react";

const ScriptSelection = ({
  scripts,
  currentStep,
  onScriptSelect,
  selectedScript,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalScript, setModalScript] = useState(null);

  if (!scripts || (currentStep !== 2 && currentStep !== 3)) return null;

  const scriptOptions = [
    { 
      key: 'response1', 
      script: scripts.response1, 
      title: scripts.response1.title || 'Script 1',
      number: 1 
    },
    { 
      key: 'response2', 
      script: scripts.response2, 
      title: scripts.response2.title || 'Script 2',
      number: 2 
    }
  ];

  const handleScriptClick = (scriptData) => {
    setModalScript(scriptData.script);
    setShowModal(true);
  };

  const handleSelectScript = (scriptData) => {
    onScriptSelect(scriptData.script);
    setShowModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalScript(null);
  };

  return (
    <>
      <div className='mb-6'>
        <div className='text-center mb-4'>
          <p className='text-white text-sm'>
            The Script writer wrote two scripts for your concept, could you help me pick one that fits your idea best?
          </p>
        </div>

        {/* Horizontal scrolling script cards */}
        <div className='flex gap-4 overflow-x-auto pb-2'>
          {scriptOptions.map((scriptData) => {
            const isSelected = selectedScript && selectedScript === scriptData.script;
            const previewText = scriptData.script.segments?.[0]?.visual || 
                               scriptData.script.segments?.[0]?.description || 
                               'Script content preview...';

            return (
              <div
                key={scriptData.key}
                className={`relative min-w-[280px] max-w-[280px] bg-gray-800/60 hover:bg-gray-700/60 rounded-lg p-4 cursor-pointer transition-all duration-200 border ${
                  isSelected 
                    ? "border-green-500 bg-green-900/20" 
                    : "border-gray-700/50"
                }`}
                onClick={() => handleScriptClick(scriptData)}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Script number and title */}
                <div className="mb-3">
                  <h3 className="text-white font-semibold text-base mb-1">
                    Script {scriptData.number}
                  </h3>
                  <h4 className="text-gray-300 text-sm font-medium">
                    Title: "{scriptData.title}"
                  </h4>
                </div>

                {/* Preview content */}
                <div className="text-gray-400 text-xs leading-relaxed">
                  <p className="line-clamp-4">
                    [Opening shot: {previewText.substring(0, 100)}...]
                  </p>
                </div>

                {/* Segments count */}
                <div className="mt-3 text-xs text-gray-500">
                  {scriptData.script.segments?.length || 0} segments
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom action buttons */}
        <div className="flex gap-2 mt-4">
          <button 
            className="p-2 text-gray-400 hover:text-white transition-colors rounded"
            title="Regenerate scripts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-white transition-colors rounded"
            title="More options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Full Script Modal */}
      {showModal && modalScript && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10004] p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold text-lg">
                {modalScript.title || 'Script Details'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Script Info */}
              <div className="mb-4">
                <p className="text-gray-300 text-sm mb-2">
                  <span className="font-medium">Art Style:</span> {modalScript.artStyle || 'Default'}
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="font-medium">Segments:</span> {modalScript.segments?.length || 0}
                </p>
              </div>

              {/* Segments */}
              <div className="space-y-4">
                {modalScript.segments?.map((segment, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 font-medium text-sm">
                        Segment {segment.id || index + 1}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {segment.duration || '3s'}
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm leading-relaxed">
                      <p className="mb-2">
                        <span className="font-medium text-white">Visual:</span> {segment.visual || segment.description}
                      </p>
                      {segment.voiceover && (
                        <p>
                          <span className="font-medium text-white">Voiceover:</span> "{segment.voiceover}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSelectScript({ script: modalScript })}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                Select This Script
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScriptSelection;
