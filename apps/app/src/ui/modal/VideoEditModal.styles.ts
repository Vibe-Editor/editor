import { css } from "lit";

export const videoEditModalStyles = css`
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .modal-content {
    background: #181a1c;
    border-radius: 16px;
    padding: 32px;
    width: 90%;
    max-width: 520px;
    border: 1px solid #3a3f44;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    position: relative;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #3a3f44;
  }

  .modal-title {
    color: #ffffff;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #888;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .form-group {
    margin-bottom: 24px;
    width: 100%;
    box-sizing: border-box;
  }

  .form-label {
    display: block;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
    letter-spacing: -0.01em;
  }

  .form-input {
    width: 100%;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #ffffff;
    font-size: 14px;
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    box-sizing: border-box;
  }

  .form-input:focus {
    outline: none;
    border-color: #94e7ed;
    box-shadow: 0 0 0 3px rgba(148, 231, 237, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }

  .form-input::placeholder {
    color: #888;
  }

  .video-info {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    backdrop-filter: blur(10px);
  }

  .video-info-title {
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .video-info-path {
    color: #888;
    font-size: 12px;
    word-break: break-all;
    font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
      "Courier New", monospace;
  }

  .button-group {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .btn-primary {
    background: linear-gradient(135deg, #94e7ed 0%, #017882 100%);
    color: #000000;
    font-weight: 600;
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #a8f0f5 0%, #028a94 100%);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(148, 231, 237, 0.3);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .processing-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #94e7ed;
    font-size: 14px;
    font-weight: 500;
  }

  .result-info {
    padding: 0;
  }

  .success-message {
    font-size: 20px;
    font-weight: 600;
    color: #94e7ed;
    margin-bottom: 16px;
    text-align: center;
    letter-spacing: -0.01em;
  }

  .credits-info {
    font-size: 12px;
    color: #888;
    margin-top: 8px;
    background: rgba(255, 255, 255, 0.03);
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: inline-block;
  }

  .preview-section {
    margin: 0 0 16px 0;
  }

  .preview-label {
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    margin-bottom: 12px;
  }

  .video-preview {
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.3);
  }

  .result-actions {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 24px;
    margin-top: 24px;
  }

  .action-description {
    margin-bottom: 24px;
  }

  .action-description strong {
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    display: block;
    margin-bottom: 8px;
  }

  .action-description p {
    color: #888;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }

  .btn-add {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
    color: #000000 !important;
    font-weight: 600 !important;
  }

  .btn-add:hover {
    background: linear-gradient(135deg, #34ce57 0%, #26d9a3 100%) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 20px rgba(40, 167, 69, 0.3) !important;
  }

  .status-message {
    text-align: center;
    padding: 16px;
    background: rgba(148, 231, 237, 0.1);
    border: 1px solid rgba(148, 231, 237, 0.2);
    border-radius: 10px;
    margin-top: 20px;
    font-size: 14px;
    color: #94e7ed;
    font-weight: 500;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid #94e7ed;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .hidden {
    display: none;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .modal-content {
      padding: 24px;
      margin: 16px;
      width: calc(100% - 32px);
      max-width: none;
    }

    .button-group {
      flex-direction: column;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }
  }
`;
