import React, { useRef, useState } from "react";
import TemplateSelection from "./TemplateSelection";
import { storyEngineApi } from "../../services/storyEngine";
import { templateService } from "../../services/template";
import { assets } from '../../assets/assets';
import { useProjectStore } from '../../store/useProjectStore';

// Section titles are always the same
const sectionTitles = [
  'SET THE SCENE',
  'RUN THINGS', 
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
  const isUiBusy = isRegenerating || (sections.length === 0 && isLoading);

  // Credits data (reference from ProjectEditor)
  const creditBalance = useProjectStore((state) => state.creditBalance);
  const loadingData = useProjectStore((state) => state.loadingData);

  // Update sections when storyData changes
  React.useEffect(() => {
    // Handle both old format (storySegments) and new format (segments)
    const segments = storyData?.storySegments || storyData?.segments;
    if (!segments) return;
    
    console.log('🎬 StoryArc received data:', storyData);
    console.log('🎬 Segments:', segments);
    
    const mappedSections = [];
    const mappedSegmentIds = [];
    
    // Create sections in the correct order
    const orderedTypes = ['setTheScene', 'ruinThings', 'theBreakingPoint', 'cleanUpTheMess', 'wrapItUp'];
    
    orderedTypes.forEach((type, index) => {
      const segment = segments.find(s => s.type === type);
      mappedSections.push({
        title: sectionTitles[index],
        content: segment?.visual || segment?.description || ''
      });
      mappedSegmentIds.push(segment?.id || null);
    });
    
    console.log('🎬 Mapped sections:', mappedSections);
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

    // Navigate immediately and show skeletons while loading
    setShowTemplateSelection(true);
    setSelectedTemplates(new Array(5).fill(null));
    setTemplateResponses(new Array(5).fill(null));

    try {
      // Make 5 parallel requests and stream results into state as they resolve
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

          // Update only this section's templates immediately
          setTemplateResponses((prev) => {
            const updated = Array.isArray(prev) ? [...prev] : new Array(5).fill(null);
            updated[index] = result.templates || [];
            return updated;
          });
        } catch (error) {
          console.error(`❌ API request ${index + 1}/5 failed for section ${section.title}:`, error);
          setTemplateResponses((prev) => {
            const updated = Array.isArray(prev) ? [...prev] : new Array(5).fill(null);
            updated[index] = [];
            return updated;
          });
        }
      });

      // Await all to finish (UI already showing and updating progressively)
      await Promise.all(templatePromises);
      console.log('All 5 template search requests completed');
    } catch (error) {
      console.error('Error during template search process:', error);
      // Keep TemplateSelection open even if there are errors
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
    <div className='min-h-screen flex flex-col bg-[#000000] p-8 font-mono relative'>
      {/* Top yellow gradient overlay */}
      <div className='pointer-events-none absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#F9D31233] via-[#F9D3121a] to-transparent'></div>
      {/* Header */}
      <div className='grid grid-cols-[1fr_auto_1fr] items-center mb-12'>
        {/* Left - Story Selection */}
        <div className='flex items-center gap-4'>
          <img src={assets.SandBoxLogo} alt="Usuals.ai" className="w-10 h-10" />
          <div className="flex flex-col">
            <h1 className="text-2xl text-white font-bold">Usuals</h1>
          </div>
          <div className='w-px h-6 bg-white/30 mx-2'></div>
          {/* Credits moved to left */}
          <div
            className="ml-2 text-white/70 bg-white/10 transition-colors border-1 border-white/20 px-3 py-1.5 rounded-lg cursor-default"
            aria-label="Credits"
            title="Credits"
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M5.86848 5.46472C6.2645 5.0687 6.4625 4.87069 6.69083 4.7965C6.89168 4.73124 7.10802 4.73124 7.30887 4.7965C7.53719 4.87069 7.7352 5.0687 8.13122 5.46472L8.53515 5.86864C8.93116 6.26466 9.12917 6.46267 9.20336 6.69099C9.26862 6.89184 9.26862 7.10819 9.20336 7.30903C9.12917 7.53736 8.93116 7.73537 8.53515 8.13138L8.13122 8.53531C7.7352 8.93132 7.53719 9.12933 7.30887 9.20352C7.10802 9.26878 6.89168 9.26878 6.69083 9.20352C6.4625 9.12933 6.2645 8.93132 5.86848 8.53531L5.46455 8.13138C5.06854 7.73537 4.87053 7.53736 4.79634 7.30903C4.73108 7.10819 4.73108 6.89184 4.79634 6.69099C4.87053 6.46267 5.06854 6.26466 5.46455 5.86864L5.86848 5.46472Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span className="text-base text-white/70">
                {loadingData?.balance ? "..." : Math.round(creditBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Center - Title */}
        <h1 className='text-3xl font-bold text-center tracking-wider justify-self-center'>
          <span className='text-[#F9D312]'>Story</span> <span className='text-white'>Engine</span>
        </h1>

        {/* Right - Word Count */}
        <div className='flex items-center gap-4 justify-self-end'>
          {/* Word Count */}
          <div className='flex items-center gap-3'>
            <span className='text-sm text-white'>Word Count</span>
            <div className='relative w-40 h-4 flex items-center'>
              <div className='w-full h-0.5 bg-[#F9D312] rounded-full'></div>
              <div
                className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-[#F9D312] rounded-full pointer-events-none'
                style={{ left: `${((wordCount - minWordCount) / (maxWordCount - minWordCount)) * 100}%` }}
              ></div>
              <input
                type='range'
                min={minWordCount}
                max={maxWordCount}
                step={10}
                value={wordCount}
                onChange={(e) => {
                  if (isUiBusy) return;
                  const newValue = Math.round(Number(e.target.value) / 10) * 10;
                  setWordCount(newValue);
                  handleWordCountChange(newValue);
                }}
                disabled={isUiBusy}
                className={`absolute inset-0 w-full h-full opacity-0 ${isUiBusy ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label='Word count'
              />
            </div>
            <span className='text-sm font-bold w-10 text-right text-white'>{wordCount}</span>
          </div>

        </div>
      </div>

      {/* Main Story Arc - 5 Column Layout with Connecting Lines */}
      <div className='relative flex items-end justify-center gap-0 mb-12 pb-28'>
        {(sections.length === 0 && isLoading) || isRegenerating ? (
          // Show skeleton loading for all 5 sections
          <>
            {/* Connecting Lines during loading */}
            <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
              <div className='absolute top-[200px] left-0 w-full h-0.5 bg-[#F9D312]'></div>
              <div className='absolute top-[200px] left-[20%] w-0.5 h-[430px] bg-[#F9D312]'></div>
              <div className='absolute top-[200px] left-[40%] w-0.5 h-[430px] bg-[#F9D312]'></div>
              <div className='absolute top-[200px] left-[59.85%] w-0.5 h-[430px] bg-[#F9D312]'></div>
              <div className='absolute top-[200px] left-[79.87%] w-0.5 h-[430px] bg-[#F9D312]'></div>
            </div>
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
                <div key={index} className={`w-1/5 h-[${heights[index]}px] border-[#F9D312] ${borders[index]} bg-[#000000] p-3 text-xs relative z-10`}>
                  <h2 className='font-bold text-[#F9D312] mb-3 text-xs tracking-wider'>
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
          <div className='absolute top-[200px] left-0 w-full h-0.5 bg-[#F9D312]'></div>
          {/* Vertical connecting lines */}
          <div className='absolute top-[200px] left-[20%] w-0.5 h-[430px] bg-[#F9D312]'></div>
          <div className='absolute top-[200px] left-[40%] w-0.5 h-[430px] bg-[#F9D312]'></div>
          <div className='absolute top-[200px] left-[59.85%] w-0.5 h-[430px] bg-[#F9D312]'></div>
          <div className='absolute top-[200px] left-[79.87%] w-0.5 h-[430px] bg-[#F9D312]'></div>
        </div>

        {/* Column 1 - SET THE SCENE (Medium height - left side) */}
        <div className='w-1/5 h-[300px]  border-[#F9D312] border-t-2 border-l-2  bg-black p-3 text-xs relative z-10'>
          {editingIndex === 0 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-[#F9D312]'>
              <div
                role='button'
                aria-label='Save section SET THE SCENE'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 0 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(0)}
              >
                {savingIndex === 0 ? (
                  <div className="w-4 h-4 border-2 border-[#F9D312] border-t-transparent rounded-full animate-spin"></div>
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
              className='absolute top-2 right-2 text-[#F9D312] hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(0)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider text-[#F9D312]'>
            {sectionTitles[0]}
          </h2>
          <p
            key={`content-0-${editingIndex === 0 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] text-white overflow-y-auto max-h-[350px] ${editingIndex === 0 ? 'border-1 border-[#F9D312] p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
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
        <div className='w-1/5 h-[400px] border-t-2 border-l-2 border-[#F9D312] bg-black p-3 text-xs relative z-10'>
          {editingIndex === 1 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-[#F9D312]'>
              <div
                role='button'
                aria-label='Save section RUIN THINGS'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 1 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(1)}
              >
                {savingIndex === 1 ? (
                  <div className="w-4 h-4 border-2 border-[#F9D312] border-t-transparent rounded-full animate-spin"></div>
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
              className='absolute top-2 right-2 text-[#F9D312] hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(1)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider text-[#F9D312]'>{sectionTitles[1]}</h2>
          <p
            key={`content-1-${editingIndex === 1 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] text-white overflow-y-auto max-h-[450px] ${editingIndex === 1 ? 'border-1 border-[#F9D312] p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
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
        <div className='w-1/5 h-[500px] border-t-2 border-l-2 border-r-2 border-[#F9D312] bg-black p-3 text-xs relative z-10'>
          {editingIndex === 2 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-[#F9D312]'>
              <div
                role='button'
                aria-label='Save section THE BREAKING POINT'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 2 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(2)}
              >
                {savingIndex === 2 ? (
                  <div className="w-4 h-4 border-2 border-[#F9D312] border-t-transparent rounded-full animate-spin"></div>
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
              className='absolute top-2 right-2 text-[#F9D312] hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(2)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider text-[#F9D312]'>
            {sectionTitles[2]}
          </h2>
          <p
            key={`content-2-${editingIndex === 2 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] text-white overflow-y-auto max-h-[550px] ${editingIndex === 2 ? 'border-1 border-[#F9D312] p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
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
        <div className='w-1/5 h-[400px] border-t-2 border-r-2 border-[#F9D312] bg-black p-3 text-xs relative z-10'>
          {editingIndex === 3 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-[#F9D312]'>
              <div
                role='button'
                aria-label='Save section CLEAN UP THE MESS'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 3 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(3)}
              >
                {savingIndex === 3 ? (
                  <div className="w-4 h-4 border-2 border-[#F9D312] border-t-transparent rounded-full animate-spin"></div>
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
              className='absolute top-2 right-2 text-[#F9D312] hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(3)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider text-[#F9D312]'>
            {sectionTitles[3]}
          </h2>
          <p
            key={`content-3-${editingIndex === 3 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] text-white overflow-y-auto max-h-[450px] ${editingIndex === 3 ? 'border-1 border-[#F9D312] p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
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
        <div className='w-1/5 h-[350px] border-t-2 border-r-2 border-[#F9D312] bg-black p-3 text-xs relative z-10'>
          {editingIndex === 4 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-[#F9D312]'>
              <div
                role='button'
                aria-label='Save section WRAP IT UP'
                className={`cursor-pointer hover:opacity-80 ${savingIndex === 4 ? 'opacity-50' : ''}`}
                onClick={() => saveEdit(4)}
              >
                {savingIndex === 4 ? (
                  <div className="w-4 h-4 border-2 border-[#F9D312] border-t-transparent rounded-full animate-spin"></div>
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
              className='absolute top-2 right-2 text-[#F9D312] hover:opacity-80 cursor-pointer'
              onClick={() => enterEdit(4)}
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                <path d='M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712z'/>
                <path d='M3 17.25V21h3.75l10.97-10.97-3.712-3.712L3 17.25zM4.5 18.75l8.909-8.909 1.659 1.659L6.159 20.409H4.5v-1.659z'/>
              </svg>
            </div>
          )}
          <h2 className='font-bold mb-3 text-xs tracking-wider text-[#F9D312]'>{sectionTitles[4]}</h2>
          <p
            key={`content-4-${editingIndex === 4 ? 'edit' : 'view'}`}
            className={`leading-relaxed text-[10px] text-white overflow-y-auto max-h-[350px] ${editingIndex === 4 ? 'border-1 border-[#F9D312] p-2 outline-none focus:outline-none focus:ring-0' : ''}`}
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

      {/* Footer - sticky with translucent bg and top border */}
      <div className='fixed bottom-0 left-0 right-0 z-20'>
        <div className='w-full flex items-center justify-center gap-2 text-sm py-3 bg-black/60 backdrop-blur-sm border-t border-white/20'>
          <span className='text-white whitespace-nowrap'>
            Ready to select a template? Click Proceed to continue.
          </span>
          <span
            className={`whitespace-nowrap font-bold underline underline-offset-2 text-[#F9D312] ${isUiBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'}`}
            aria-label='Proceed to template selection'
            aria-disabled={isUiBusy}
            onClick={() => { if (isUiBusy) return; handleProceed(); }}
          >
            PROCEED
          </span>
        </div>
      </div>
    </div>
  );
};

export default StoryArcEngine;
