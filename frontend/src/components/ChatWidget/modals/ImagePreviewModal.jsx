import React from 'react';
import { createPortal } from "react-dom";

function ImagePreviewModal({ showImageModal, modalImageUrl, onClose }) {
  if (!showImageModal || !modalImageUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10003]"
      onClick={onClose}
    >
      <img
        src={modalImageUrl}
        alt="Preview"
        className="max-w-full max-h-full rounded shadow-lg"
        onClick={(e) => e.stopPropagation()}
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
    document.body
  );
}

export default ImagePreviewModal; 