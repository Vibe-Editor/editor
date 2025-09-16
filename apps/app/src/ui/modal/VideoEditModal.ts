
import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { VideoElement, EditedVideoResult, CONSTANTS } from './VideoEditModal.types';
import { VideoEditingService } from './VideoEditingService';
import { TimelineIntegrationService } from './TimelineIntegrationService';
import { VideoEditModalUtils } from './VideoEditModal.utils';
import { videoEditModalStyles } from './VideoEditModal.styles';

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

  static styles = videoEditModalStyles;

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
