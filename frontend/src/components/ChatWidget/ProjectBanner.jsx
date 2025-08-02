import React from 'react';

function ProjectBanner({ selectedProject }) {
  if (!selectedProject) return null;
  
  return (
    <div className="px-4 py-2 bg-blue-900 text-blue-100 text-sm border-b border-blue-800">
      Working on: <span className="font-semibold">{selectedProject.name}</span>
    </div>
  );
}

export default ProjectBanner; 