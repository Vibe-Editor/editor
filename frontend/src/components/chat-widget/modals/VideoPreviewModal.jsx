import React from "react";
import { createPortal } from "react-dom";

function VideoPreviewModal({ isOpen, videoUrl, onClose }) {
  if (!isOpen || !videoUrl) return null;

  const handleWrapperClick = () => onClose();
  const stopPropagation = (e) => e.stopPropagation();

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10003]"
      onClick={handleWrapperClick}
    >
      <video
        src={videoUrl}
        controls
        autoPlay
        className="max-w-full max-h-full rounded shadow-lg"
        onClick={stopPropagation}
      />
      <button
        className="absolute top-4 right-4 text-white text-2xl"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ✕
      </button>
    </div>,
    document.body,
  );
}

export default VideoPreviewModal;
