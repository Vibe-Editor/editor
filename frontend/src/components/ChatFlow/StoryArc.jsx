import React, { useRef, useState } from "react";
import TemplateSelection from "./TemplateSelection";
import { storyEngineApi } from "../../services/storyEngine";
import { templateService } from "../../services/template";

// Section titles are always the same
const sectionTitles = [
  'SET THE SCENE',
  'RUIN THINGS', 
  'THE BREAKING POINT',
  'CLEAN UP THE MESS',
  'WRAP IT UP'
];


const StoryArcEngine = ({ storyData, videoPreferences, isLoading = false }) => {
  const [wordCount, setWordCount] = useState(150);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);

  const [sections, setSections] = useState([]);
  const [segmentIds, setSegmentIds] = useState([]);
  const [savingIndex, setSavingIndex] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [templateResponses, setTemplateResponses] = useState([]); // Store template responses for each section
  const [selectedTemplates, setSelectedTemplates] = useState([]); // Store selected template for each section
  const draftRef = useRef([]);
  const minWordCount = 100;
  const maxWordCount = 350;
  const regenerateTimeoutRef = useRef(null);

  // Update sections when storyData changes
  React.useEffect(() => {
    if (!storyData?.storySegments) return;
    
    const mappedSections = [];
    const mappedSegmentIds = [];
    
    // Create sections in the correct order
    const orderedTypes = ['setTheScene', 'ruinThings', 'theBreakingPoint', 'cleanUpTheMess', 'wrapItUp'];
    
    orderedTypes.forEach((type, index) => {
      const segment = storyData.storySegments.find(s => s.type === type);
      mappedSections.push({
        title: sectionTitles[index],
        content: segment?.visual || ''
      });
      mappedSegmentIds.push(segment?.id || null);
    });
    
    setSections(mappedSections);
    setSegmentIds(mappedSegmentIds);
    draftRef.current = mappedSections.map((s) => s.content);
  }, [storyData]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (regenerateTimeoutRef.current) {
        clearTimeout(regenerateTimeoutRef.current);
      }
    };
  }, []);

  // Skeleton loading component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="h-3 bg-gray-300 rounded mb-2"></div>
      <div className="h-3 bg-gray-300 rounded mb-2"></div>
      <div className="h-3 bg-gray-300 rounded mb-2"></div>
      <div className="h-3 bg-gray-300 rounded mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
    </div>
  );

  const enterEdit = (index) => {
    draftRef.current[index] = sections[index].content;
    setEditingIndex(index);
  };

  const saveEdit = async (index) => {
    try {
      setSavingIndex(index);
      const newContent = draftRef.current[index];
      const segmentId = segmentIds[index];
      
      // Update local state first
      const updated = [...sections];
      updated[index] = { ...updated[index], content: newContent };
      setSections(updated);
      setEditingIndex(null);
      
      // Call API to update in database
      if (segmentId) {
        await storyEngineApi.updateStorySegment(segmentId, newContent);
        console.log(`Updated segment ${segmentId} successfully`);
      }
    } catch (error) {
      console.error('Failed to save story segment:', error);
      // Revert local changes if API call fails
      const reverted = [...sections];
      reverted[index] = { ...reverted[index], content: sections[index].content };
      setSections(reverted);
      // Keep editing mode open so user can try again
    } finally {
      setSavingIndex(null);
    }
  };

  const cancelEdit = (index) => {
    draftRef.current[index] = sections[index].content;
    setEditingIndex(null);
  };

  const handleWordCountChange = (newWordCount) => {
    // Clear existing timeout
    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current);
    }

    // Set new timeout for 2 seconds
    regenerateTimeoutRef.current = setTimeout(async () => {
      if (segmentIds.length > 0 && segmentIds.every(id => id !== null)) {
        try {
          setIsRegenerating(true);
          const result = await storyEngineApi.regenerateSegments(segmentIds, newWordCount);
          console.log('Segments regenerated successfully:', result);
          
          // Update sections with new data
          console.log('Regenerate response:', result);
          
          // Check if result is an array directly or nested under data
          const segments = Array.isArray(result) ? result : result.data || result;
          
          if (segments && segments.length > 0) {
            const mappedSections = [];
            const mappedSegmentIds = [];
            
            const orderedTypes = ['setTheScene', 'ruinThings', 'theBreakingPoint', 'cleanUpTheMess', 'wrapItUp'];
            
            orderedTypes.forEach((type, index) => {
              const segment = segments.find(s => s.type === type);
              mappedSections.push({
                title: sectionTitles[index],
                content: segment?.description || ''
              });
              mappedSegmentIds.push(segment?.id || null);
            });
            
            setSections(mappedSections);
            setSegmentIds(mappedSegmentIds);
            draftRef.current = mappedSections.map((s) => s.content);
          }
        } catch (error) {
          console.error('Failed to regenerate segments:', error);
        } finally {
          setIsRegenerating(false);
        }
      }
    }, 1000);
  };

  const handleEditableKeyDown = (e, index) => {
    if (editingIndex !== index) return;
    const isMeta = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();
    if (isMeta && key === 'a') {
      e.preventDefault();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(e.currentTarget);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    // Let native copy/cut/paste (C/X/V) work by default
  };

  const handleProceed = async () => {
    console.log('Starting template search for all 5 story segments...');
    
    try {
      // Make 5 parallel requests to find similar templates for each section
      const templatePromises = sections.map(async (section, index) => {
        console.log(`Making API request ${index + 1}/5 for section: ${section.title}`);
        console.log(`Description: ${section.content}`);
        
        try {
          const result = await templateService.findSimilarTemplates(section.content);
          console.log(`✅ API request ${index + 1}/5 completed successfully:`, {
            section: section.title,
            templatesFound: result.templates?.length || 0,
            totalCount: result.totalCount,
            response: result
          });
          return {
            sectionIndex: index,
            sectionTitle: section.title,
            result: result
          };
        } catch (error) {
          console.error(`❌ API request ${index + 1}/5 failed for section ${section.title}:`, error);
          return {
            sectionIndex: index,
            sectionTitle: section.title,
            error: error.message,
            result: { templates: [], totalCount: 0 }
          };
        }
      });

      // Wait for all requests to complete
      const results = await Promise.all(templatePromises);
      
      console.log('All 5 template search requests completed:', results);
      
      // Store template responses for each section
      const templateResponsesArray = new Array(5).fill(null);
      results.forEach((result) => {
        if (result.result && result.result.templates) {
          templateResponsesArray[result.sectionIndex] = result.result.templates;
        }
      });
      
      setTemplateResponses(templateResponsesArray);
      setSelectedTemplates(new Array(5).fill(null)); // Initialize with no selections
      
      // Show template selection after all requests are done
      setShowTemplateSelection(true);
      
    } catch (error) {
      console.error('Error during template search process:', error);
      // Still show template selection even if there are errors
      setShowTemplateSelection(true);
    }
  };

  const handleCloseTemplateSelection = () => {
    setShowTemplateSelection(false);
  };

  const handleTemplateSelect = (template, sectionIndex) => {
    console.log(`Selected template for section ${sectionIndex}:`, template);
    
    // Update selected templates array
    setSelectedTemplates(prev => {
      const updated = [...prev];
      updated[sectionIndex] = {
        id: template.id,
        description: template.description,
        jsonPrompt: template.jsonPrompt,
        s3Key: template.s3Key,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };
      return updated;
    });
  };

  // Show TemplateSelection when proceed is clicked
  if (showTemplateSelection) {
    return (
      <TemplateSelection
        storyArcData={{
          sections,
          wordCount
        }}
        templateResponses={templateResponses}
        selectedTemplates={selectedTemplates}
        segmentIds={segmentIds}
        videoPreferences={videoPreferences}
        onClose={handleCloseTemplateSelection}
        onTemplateSelect={handleTemplateSelect}
      />
    );
  }

  return (
    <div className='min-h-screen flex flex-col bg-[#F8FFB8] p-8 font-mono'>
      {/* Header */}
      <div className='grid grid-cols-[1fr_auto_1fr] items-center mb-12'>
        {/* Left - Story Selection */}
        <div className='flex items-center gap-4'>
        </div>

        {/* Center - Title */}
        <h1 className='text-3xl font-bold text-center tracking-wider justify-self-center'>
          Story Engine
        </h1>

        {/* Right - Word Count */}
        <div className='flex items-center gap-3 justify-self-end'>
          <span className='text-sm'>Word Count</span>
          <div className='relative w-40 h-4 flex items-center'>
            <div className='w-full h-0.5 bg-black rounded-full'></div>
            <div
              className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full pointer-events-none'
              style={{ left: `${((wordCount - minWordCount) / (maxWordCount - minWordCount)) * 100}%` }}
            ></div>
            <input
              type='range'
              min={minWordCount}
              max={maxWordCount}
              step={10}
              value={wordCount}
              onChange={(e) => {
                const newValue = Math.round(Number(e.target.value) / 10) * 10;
                setWordCount(newValue);
                handleWordCountChange(newValue);
              }}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              aria-label='Word count'
            />
          </div>
          <span className='text-sm font-bold w-10 text-right'>{wordCount}</span>
        </div>
      </div>

      {/* Main Story Arc - 5 Column Layout with Connecting Lines */}
      <div className='relative flex items-end justify-center gap-0 mb-12'>
        {(sections.length === 0 && isLoading) || isRegenerating ? (
          // Show skeleton loading for all 5 sections
          <>
            {[0, 1, 2, 3, 4].map((index) => {
              const heights = [300, 400, 500, 400, 300]; // Different heights for each section
              const borders = [
                'border-t-2 border-l-2',
                'border-t-2 border-l-2', 
                'border-t-2 border-l-2 border-r-2',
                'border-t-2 border-r-2',
                'border-t-2 border-r-2'
              ];
              return (
                <div key={index} className={`w-1/5 h-[${heights[index]}px] border-black ${borders[index]} bg-[#F8FFB8] p-3 text-xs relative z-10`}>
                  <h2 className='font-bold mb-3 text-xs tracking-wider'>
                    {sectionTitles[index]}
                  </h2>
                  <SkeletonLoader />
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* Connecting Lines */}
            <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
          {/* Horizontal line connecting all boxes */}
          <div className='absolute top-[200px] left-0 w-full h-0.5 bg-black'></div>
          {/* Vertical connecting lines */}
          <div className='absolute top-[200px] left-[20%] w-0.5 h-[430px] bg-black'></div>
          <div className='absolute top-[200px] left-[40%] w-0.5 h-[430px] bg-black'></div>
          <div className='absolute top-[200px] left-[59.85%] w-0.5 h-[430px] bg-black'></div>
          <div className='absolute top-[200px] left-[79.85%] w-0.5 h-[430px] bg-black'></div>
        </div>

        {/* Column 1 - SET THE SCENE (Medium height - left side) */}
        <div className='w-1/5 h-[300px]  border-black border-t-2 border-l-2  bg-[#F8FFB8] p-3 text-xs relative z-10'>
          {editingIndex === 0 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section SET THE SCENE'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 0 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(0)}
              >
                {savingIndex === 0 ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                    <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                  </svg>
                )}
              </div>
              <div
                role='button'
                aria-label='Discard changes section SET THE SCENE'
                className='cursor-pointer hover:opacity-80'
                onClick={() => cancelEdit(0)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12 10.59 13.42 4.29 19.71 5.7 21.12 12 14.83 18.3 21.12 19.71 19.71 13.41 13.42 19.71 7.12z'/>
                </svg>
              </div>
            </div>
          ) : (
            <div
              role='button'
              aria-label='Edit section SET THE SCENE'
              className='absolute top-2 right-2 text-black hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(0)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider'>
            {sectionTitles[0]}
          </h2>
          <p
            key={`content-0-${editingIndex === 0 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] ${editingIndex === 0 ? 'border-1 border-black p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
            contentEditable={editingIndex === 0}
            suppressContentEditableWarning={true}
            tabIndex={editingIndex === 0 ? 0 : -1}
            onKeyDown={(e) => handleEditableKeyDown(e, 0)}
            onInput={(e) => {
              if (editingIndex === 0) {
                draftRef.current[0] = e.currentTarget.innerText;
              }
            }}
          >
            {editingIndex === 0 ? draftRef.current[0] : sections[0]?.content || ''}
          </p>
        </div>

        {/* Column 2 - RUIN THINGS (Taller - building up) */}
        <div className='w-1/5 h-[400px] border-t-2 border-l-2 border-black bg-[#F8FFB8] p-3 text-xs relative z-10'>
          {editingIndex === 1 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section RUIN THINGS'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 1 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(1)}
              >
                {savingIndex === 1 ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                    <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                  </svg>
                )}
              </div>
              <div
                role='button'
                aria-label='Discard changes section RUIN THINGS'
                className='cursor-pointer hover:opacity-80'
                onClick={() => cancelEdit(1)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12 10.59 13.42 4.29 19.71 5.7 21.12 12 14.83 18.3 21.12 19.71 19.71 13.41 13.42 19.71 7.12z'/>
                </svg>
              </div>
            </div>
          ) : (
            <div
              role='button'
              aria-label='Edit section RUIN THINGS'
              className='absolute top-2 right-2 text-black hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(1)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider'>{sectionTitles[1]}</h2>
          <p
            key={`content-1-${editingIndex === 1 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] ${editingIndex === 1 ? 'border-1 border-black p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
            contentEditable={editingIndex === 1}
            suppressContentEditableWarning={true}
            tabIndex={editingIndex === 1 ? 0 : -1}
            onKeyDown={(e) => handleEditableKeyDown(e, 1)}
            onInput={(e) => {
              if (editingIndex === 1) {
                draftRef.current[1] = e.currentTarget.innerText;
              }
            }}
          >
            {editingIndex === 1 ? draftRef.current[1] : sections[1]?.content || ''}
          </p>
        </div>

        {/* Column 3 - THE BREAKING POINT (Tallest - center peak) */}
        <div className='w-1/5 h-[500px] border-t-2 border-l-2 border-r-2 border-black bg-[#F8FFB8] p-3 text-xs relative z-10'>
          {editingIndex === 2 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section THE BREAKING POINT'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 2 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(2)}
              >
                {savingIndex === 2 ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                    <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                  </svg>
                )}
              </div>
              <div
                role='button'
                aria-label='Discard changes section THE BREAKING POINT'
                className='cursor-pointer hover:opacity-80'
                onClick={() => cancelEdit(2)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12 10.59 13.42 4.29 19.71 5.7 21.12 12 14.83 18.3 21.12 19.71 19.71 13.41 13.42 19.71 7.12z'/>
                </svg>
              </div>
            </div>
          ) : (
            <div
              role='button'
              aria-label='Edit section THE BREAKING POINT'
              className='absolute top-2 right-2 text-black hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(2)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider'>
            {sectionTitles[2]}
          </h2>
          <p
            key={`content-2-${editingIndex === 2 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] ${editingIndex === 2 ? 'border-1 border-black p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
            contentEditable={editingIndex === 2}
            suppressContentEditableWarning={true}
            tabIndex={editingIndex === 2 ? 0 : -1}
            onKeyDown={(e) => handleEditableKeyDown(e, 2)}
            onInput={(e) => {
              if (editingIndex === 2) {
                draftRef.current[2] = e.currentTarget.innerText;
              }
            }}
          >
            {editingIndex === 2 ? draftRef.current[2] : sections[2]?.content || ''}
          </p>
        </div>

        {/* Column 4 - CLEAN UP THE MESS (Taller - coming down) */}
        <div className='w-1/5 h-[400px] border-t-2 border-r-2 border-black bg-[#F8FFB8] p-3 text-xs relative z-10'>
          {editingIndex === 3 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section CLEAN UP THE MESS'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 3 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(3)}
              >
                {savingIndex === 3 ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                    <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                  </svg>
                )}
              </div>
              <div
                role='button'
                aria-label='Discard changes section CLEAN UP THE MESS'
                className='cursor-pointer hover:opacity-80'
                onClick={() => cancelEdit(3)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12 10.59 13.42 4.29 19.71 5.7 21.12 12 14.83 18.3 21.12 19.71 19.71 13.41 13.42 19.71 7.12z'/>
                </svg>
              </div>
            </div>
          ) : (
            <div
              role='button'
              aria-label='Edit section CLEAN UP THE MESS'
              className='absolute top-2 right-2 text-black hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(3)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider'>
            {sectionTitles[3]}
          </h2>
          <p
            key={`content-3-${editingIndex === 3 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] ${editingIndex === 3 ? 'border-1 border-black p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
            contentEditable={editingIndex === 3}
            suppressContentEditableWarning={true}
            tabIndex={editingIndex === 3 ? 0 : -1}
            onKeyDown={(e) => handleEditableKeyDown(e, 3)}
            onInput={(e) => {
              if (editingIndex === 3) {
                draftRef.current[3] = e.currentTarget.innerText;
              }
            }}
          >
            {editingIndex === 3 ? draftRef.current[3] : sections[3]?.content || ''}
          </p>
        </div>

        {/* Column 5 - WRAP IT UP (Medium height - right side) */}
        <div className='w-1/5 h-[300px] border-t-2 border-r-2 border-black bg-[#F8FFB8] p-3 text-xs relative z-10 flex flex-col'>
          {editingIndex === 4 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section WRAP IT UP'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 4 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(4)}
              >
                {savingIndex === 4 ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                    <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                  </svg>
                )}
              </div>
              <div
                role='button'
                aria-label='Discard changes section WRAP IT UP'
                className='cursor-pointer hover:opacity-80'
                onClick={() => cancelEdit(4)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12 10.59 13.42 4.29 19.71 5.7 21.12 12 14.83 18.3 21.12 19.71 19.71 13.41 13.42 19.71 7.12z'/>
                </svg>
              </div>
            </div>
          ) : (
            <div
              role='button'
              aria-label='Edit section WRAP IT UP'
              className='absolute top-2 right-2 text-black hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(4)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider'>{sectionTitles[4]}</h2>
          <p
            key={`content-4-${editingIndex === 4 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] flex-1 ${editingIndex === 4 ? 'border-1 border-black p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
            contentEditable={editingIndex === 4}
            suppressContentEditableWarning={true}
            tabIndex={editingIndex === 4 ? 0 : -1}
            onKeyDown={(e) => handleEditableKeyDown(e, 4)}
            onInput={(e) => {
              if (editingIndex === 4) {
                draftRef.current[4] = e.currentTarget.innerText;
              }
            }}
          >
            {editingIndex === 4 ? draftRef.current[4] : sections[4]?.content || ''}
          </p>
        </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className='mt-auto'>
        <div className='w-full flex items-center justify-center gap-2 text-sm'>
          <span className='text-gray-900 whitespace-nowrap'>
            Ready to select a template? Click Proceed to continue.
          </span>
          <span
            className='whitespace-nowrap font-bold underline underline-offset-2 text-black cursor-pointer hover:opacity-80'
            aria-label='Proceed to template selection'
            onClick={handleProceed}
          >
            PROCEED
          </span>
        </div>
      </div>
    </div>
  );
};

export default StoryArcEngine;
