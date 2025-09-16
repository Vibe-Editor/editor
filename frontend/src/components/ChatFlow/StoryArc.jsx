import React, { useRef, useState } from "react";

const StoryArcEngine = ({ onGoHome }) => {
  const [wordCount, setWordCount] = useState(86);
  const [editingIndex, setEditingIndex] = useState(null);
  const [sections, setSections] = useState([
    {
      title: 'SET THE SCENE',
      content:
        'The world is thrown into chaos as twelve colossal alien spacecraft, dubbed "shells," mysteriously appear at random locations across Earth. Dr. Louise Banks, a renowned linguist haunted by the memory of her daughter\'s death, is recruited by the US military to decipher the aliens\' complex language. Working alongside theoretical physicist Ian Donnelly, Louise grapples with the immense pressure to understand the extraterrestrial visitors\' intentions before global panic escalates into widespread conflict. The initial interactions are fraught with fear and misunderstanding.',
    },
    {
      title: 'RUIN THINGS',
      content:
        'As Louise delves deeper into the heptapods\' non-linear language, she begins experiencing vivid flashes of memory - or perhaps premonitions - of her future daughter. These visions become increasingly intense and frequent, blurring the lines between past, present, and future. Meanwhile, global tensions rise as other nations, particularly China and Russia, grow suspicious and aggressive towards the aliens, threatening to launch an attack. Louise fears misinterpreting the heptapods\' message could have catastrophic global consequences.',
    },
    {
      title: 'THE BREAKING POINT',
      content:
        'Louise has a profound breakthrough, understanding that the heptapods\' language is intrinsically linked to their perception of time. They experience all of time simultaneously, and learning their language grants humans this same ability. This realization is triggered by a vision of her future daughter, Hannah, and her eventual death. In a critical moment, Louise uses her newfound understanding of future events to prevent a military strike against the shells by making a crucial, life-altering phone call to Chinese General Shang.',
    },
    {
      title: 'CLEAN UP THE MESS',
      content:
        'With the immediate threat of war averted, Louise works to fully integrate her understanding of the heptapods\' language and its temporal implications. She accepts the future she has foreseen, including the birth of her daughter Hannah, and the heartbreak of her eventual loss. The Shells depart, leaving behind a gift of their language, which promises to reshape human understanding of existence. Louise and Ian begin a relationship, knowing the path it will take.',
    },
    {
      title: 'WRAP IT UP',
      content:
        'Humanity begins to adopt the heptapod language, fostering a sort of unified global perspective and an altered perception of time. Louise chooses to embrace her future, conceiving Hannah with Ian, fully aware of the joy and sorrow that lie ahead. The story concludes with Louise reflecting on her choice, finding profound meaning in the entirety of life\'s experiences, both happy and tragic, demonstrating the transformative power of understanding and acceptance.',
    },
  ]);
  const draftRef = useRef(sections.map((s) => s.content));
  const minWordCount = 60;
  const maxWordCount = 140;

  const enterEdit = (index) => {
    draftRef.current[index] = sections[index].content;
    setEditingIndex(index);
  };

  const saveEdit = (index) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], content: draftRef.current[index] };
    setSections(updated);
    setEditingIndex(null);
  };

  const cancelEdit = (index) => {
    draftRef.current[index] = sections[index].content;
    setEditingIndex(null);
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

  return (
    <div className='min-h-screen flex flex-col bg-[#F8FFB8] p-8 font-mono'>
      {/* Header */}
      <div className='grid grid-cols-[1fr_auto_1fr] items-center mb-12'>
        {/* Left - Story Selection with Home Button */}
        <div className='flex items-center gap-4'>
          {onGoHome && (
            <button
              onClick={onGoHome}
              className='bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 rounded text-xs font-medium transition-colors'
            >
              ← Home
            </button>
          )}
        </div>

        {/* Center - Title */}
        <h1 className='text-3xl font-bold text-center tracking-wider justify-self-center'>
          Story Arc Engine
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
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              aria-label='Word count'
            />
          </div>
          <span className='text-sm font-bold w-10 text-right'>{wordCount}</span>
        </div>
      </div>

      {/* Main Story Arc - 5 Column Layout with Connecting Lines */}
      <div className='relative flex items-end justify-center gap-0 mb-12'>
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
                className='cursor-pointer hover:opacity-80'
                onClick={() => saveEdit(0)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                </svg>
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
            {sections[0].title}
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
            {editingIndex === 0 ? draftRef.current[0] : sections[0].content}
          </p>
        </div>

        {/* Column 2 - RUIN THINGS (Taller - building up) */}
        <div className='w-1/5 h-[400px] border-t-2 border-l-2 border-black bg-[#F8FFB8] p-3 text-xs relative z-10'>
          {editingIndex === 1 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section RUIN THINGS'
                className='cursor-pointer hover:opacity-80'
                onClick={() => saveEdit(1)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                </svg>
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
          <h2 className='font-bold mb-3 text-xs tracking-wider'>{sections[1].title}</h2>
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
            {editingIndex === 1 ? draftRef.current[1] : sections[1].content}
          </p>
        </div>

        {/* Column 3 - THE BREAKING POINT (Tallest - center peak) */}
        <div className='w-1/5 h-[500px] border-t-2 border-l-2 border-r-2 border-black bg-[#F8FFB8] p-3 text-xs relative z-10'>
          {editingIndex === 2 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section THE BREAKING POINT'
                className='cursor-pointer hover:opacity-80'
                onClick={() => saveEdit(2)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                </svg>
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
            {sections[2].title}
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
            {editingIndex === 2 ? draftRef.current[2] : sections[2].content}
          </p>
        </div>

        {/* Column 4 - CLEAN UP THE MESS (Taller - coming down) */}
        <div className='w-1/5 h-[400px] border-t-2 border-r-2 border-black bg-[#F8FFB8] p-3 text-xs relative z-10'>
          {editingIndex === 3 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section CLEAN UP THE MESS'
                className='cursor-pointer hover:opacity-80'
                onClick={() => saveEdit(3)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                </svg>
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
            {sections[3].title}
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
            {editingIndex === 3 ? draftRef.current[3] : sections[3].content}
          </p>
        </div>

        {/* Column 5 - WRAP IT UP (Medium height - right side) */}
        <div className='w-1/5 h-[300px] border-t-2 border-r-2 border-black bg-[#F8FFB8] p-3 text-xs relative z-10 flex flex-col'>
          {editingIndex === 4 ? (
            <div className='absolute top-2 right-2 flex items-center gap-2 text-black'>
              <div
                role='button'
                aria-label='Save section WRAP IT UP'
                className='cursor-pointer hover:opacity-80'
                onClick={() => saveEdit(4)}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
                  <path d='M9 16.172 5.414 12.586l-1.828 1.828L9 19.828l12-12-1.828-1.828z'/>
                </svg>
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
          <h2 className='font-bold mb-3 text-xs tracking-wider'>{sections[4].title}</h2>
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
            {editingIndex === 4 ? draftRef.current[4] : sections[4].content}
          </p>
        </div>
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
          >
            PROCEED
          </span>
        </div>
      </div>
    </div>
  );
};

export default StoryArcEngine;
