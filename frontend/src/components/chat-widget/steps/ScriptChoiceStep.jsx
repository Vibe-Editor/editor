import React from "react";

function ScriptChoiceStep({ scripts, onSelect }) {
  if (!scripts || scripts.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-white mb-2">Choose a Script:</h4>
      <div className="space-y-2">
        {scripts.map((script, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(script)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="text-white font-medium text-sm mb-1">{script.title}</div>
            <div className="text-gray-300 text-xs mb-2">{script.preview}</div>
            <div className="text-gray-400 text-xs">Segments: {script.segments?.length}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ScriptChoiceStep;
