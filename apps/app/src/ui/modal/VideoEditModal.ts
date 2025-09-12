
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { VideoElement, EditedVideoResult, CONSTANTS } from './VideoEditModal.types';
import { VideoEditingService } from './VideoEditingService';
import { TimelineIntegrationService } from './TimelineIntegrationService';
import { VideoEditModalUtils } from './VideoEditModal.utils';

@customElement("video-edit-modal")
export class VideoEditModal extends LitElement {
  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @state()
  private isProcessing = false;

  @state()
  private promptText = "";

  @state()
  private selectedVideoId = "";

  @state()
  private selectedVideoElement: VideoElement | null = null;

  @state()
  private processingProgress = "";

  @state()
  private editedVideoResult: EditedVideoResult | null = null;

  @state()
  private showResult = false;

  static styles = css`
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

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timelineState = state;
    });
    return super.createRenderRoot();
  }

  show(videoId: string) {
    this.selectedVideoId = videoId;
    this.selectedVideoElement = this.timelineState.timeline[videoId] as VideoElement;
    this.promptText = "";
    this.isProcessing = false;
    this.processingProgress = "";

    if (
      !this.selectedVideoElement ||
      this.selectedVideoElement.filetype !== "video"
    ) {
      return;
    }

    this.requestUpdate();
  }

  hide() {
    this.selectedVideoId = "";
    this.selectedVideoElement = null;
    this.promptText = "";
    this.isProcessing = false;
    this.processingProgress = "";
    this.editedVideoResult = null;
    this.showResult = false;
    this.requestUpdate();
  }

  private handlePromptChange(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.promptText = target.value;
  }

  private handleKeyDown = VideoEditModalUtils.handleKeyDown;
  private handleKeyUp = VideoEditModalUtils.handleKeyUp;

  private async handleAddToTimeline() {
    if (!this.editedVideoResult || !this.editedVideoResult.s3Key) {
      return;
    }

    try {
      this.processingProgress = CONSTANTS.STATUS_MESSAGES.ADDING;
      this.requestUpdate();

      await TimelineIntegrationService.addVideoToTimeline(
        this.editedVideoResult,
        this.timelineState
      );

      this.processingProgress = CONSTANTS.STATUS_MESSAGES.SUCCESS;
      this.requestUpdate();

      setTimeout(() => {
        this.hide();
      }, 2000);
    } catch (error) {
      this.processingProgress = `Error: ${
        error instanceof Error ? error.message : "Failed to add video to timeline"
      }`;
      this.requestUpdate();

      setTimeout(() => {
        this.processingProgress = "";
        this.requestUpdate();
      }, 3000);
    }
  }

  private handleDiscardResult() {
    this.editedVideoResult = null;
    this.showResult = false;
    this.processingProgress = "";
    this.requestUpdate();
  }

  private handleTryAgain() {
    this.editedVideoResult = null;
    this.showResult = false;
    this.processingProgress = "";
    this.promptText = "";
    this.requestUpdate();
  }

  private async handleStartEditing() {
    if (!this.promptText.trim() || !this.selectedVideoElement) {
      return;
    }

    this.isProcessing = true;
    this.processingProgress = CONSTANTS.STATUS_MESSAGES.PREPARING;
    this.requestUpdate();

    try {
      const videoUri = await VideoEditingService.getVideoUri(this.selectedVideoElement);
      
      this.processingProgress = CONSTANTS.STATUS_MESSAGES.PROCESSING;
      this.requestUpdate();

      const result = await VideoEditingService.processVideo(videoUri, this.promptText);

      this.editedVideoResult = result;
      this.showResult = true;
      this.isProcessing = false;
      this.processingProgress = `Video editing complete! Used ${
        result.creditsUsed || "unknown"
      } credits`;
      this.requestUpdate();
    } catch (error) {
      console.error("Video editing failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.processingProgress = `Error: ${errorMessage}`;
      this.isProcessing = false;
      setTimeout(() => {
        this.processingProgress = "";
        this.requestUpdate();
      }, 3000);
    }
  }


  render() {
    if (!this.selectedVideoId || !this.selectedVideoElement) {
      return html`<div class="hidden"></div>`;
    }

    // Show result UI if we have an edited video result
    if (this.showResult && this.editedVideoResult) {
      return html`
        <div class="modal-overlay" @click=${this.handleOverlayClick}>
          <div class="modal-content" @click=${this.handleContentClick}>
            <div class="modal-header">
              <h3 class="modal-title">Video Editing Complete!</h3>
              <button class="close-btn" @click=${this.hide}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="result-info">
              ${this.editedVideoResult.videoUrl
                ? html`
                    <div class="preview-section">
                      <div class="preview-label">Preview:</div>
                      <video
                        class="video-preview"
                        src="${this.editedVideoResult.videoUrl}"
                        controls
                        muted
                        style="width: 100%; max-height: 300px; border-radius: 12px;"
                      ></video>
                    </div>
                  `
                : ""}
            </div>

            <div class="result-actions">
              <div class="action-description">
                <strong>What would you like to do?</strong>
                <p>
                  Click "Add to Timeline" to add the edited video to your
                  project timeline.
                </p>
              </div>

              <div class="button-group">
                <button
                  class="btn btn-secondary"
                  @click=${this.handleDiscardResult}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path
                      d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"
                    ></path>
                  </svg>
                  Discard
                </button>
                <button class="btn btn-secondary" @click=${this.handleTryAgain}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                    ></path>
                    <path d="M21 3v5h-5"></path>
                    <path
                      d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                    ></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  Try Again
                </button>
                <button
                  class="btn btn-primary btn-add"
                  @click=${this.handleAddToTimeline}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add to Timeline
                </button>
              </div>
            </div>

            ${this.processingProgress
              ? html`
                  <div class="status-message">${this.processingProgress}</div>
                `
              : ""}
          </div>
        </div>
      `;
    }

    // Show editing UI (default)
    return html`
      <div class="modal-overlay" @click=${this.handleOverlayClick}>
        <div class="modal-content" @click=${this.handleContentClick}>
          <div class="modal-header">
            <h3 class="modal-title">Edit Video with AI</h3>
            <button
              class="close-btn"
              @click=${this.hide}
              ?disabled=${this.isProcessing}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="video-info">
            <div class="video-info-title">Selected Video:</div>
            <div class="video-info-path">
              ${this.selectedVideoElement.localpath || "Unknown path"}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"
              >Describe the changes you want to make:</label
            >
            <textarea
              class="form-input"
              placeholder="e.g., Add snow falling in the background, Change the sky to sunset, Add aliens to this video..."
              .value=${this.promptText}
              @input=${this.handlePromptChange}
              @keydown=${this.handleKeyDown}
              @keyup=${this.handleKeyUp}
              ?disabled=${this.isProcessing}
            ></textarea>
          </div>

          <div class="button-group">
            <button
              class="btn btn-primary"
              @click=${this.handleStartEditing}
              ?disabled=${this.isProcessing || !this.promptText.trim()}
            >
              ${this.isProcessing
                ? html`
                    <div class="spinner"></div>
                    Processing...
                  `
                : "Start Editing"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private handleOverlayClick = (e: Event) => 
    VideoEditModalUtils.handleOverlayClick(e, this.isProcessing, () => this.hide());

  private handleContentClick = VideoEditModalUtils.handleContentClick;
}
