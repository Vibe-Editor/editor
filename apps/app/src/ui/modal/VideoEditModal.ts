import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { VIDEO_EDITING_CONFIG, getVideoEditingApiUrl, convertS3ToCloudFront, generateProjectId } from "../../config/video-editing";

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
  private selectedVideoElement: any = null;

  @state()
  private processingProgress = "";

  @state()
  private editedVideoResult: any = null;

  @state()
  private showResult = false;

  private modal: any = null;

  static styles = css`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .modal-content {
      background: #1a1b1e;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 500px;
      border: 1px solid #3a3f44;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: #888;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      padding: 12px;
      background: #2a2d32;
      border: 1px solid #3a3f44;
      border-radius: 8px;
      color: #ffffff;
      font-size: 14px;
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }

    .form-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .form-input::placeholder {
      color: #888;
    }

    .video-info {
      background: #2a2d32;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
    }

    .video-info-title {
      color: #ffffff;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .video-info-path {
      color: #888;
      font-size: 11px;
      word-break: break-all;
    }

    .button-group {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-secondary {
      background: #3a3f44;
      color: #ffffff;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4a4f54;
    }

    .btn-primary {
      background: #007bff;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .processing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #007bff;
      font-size: 14px;
    }

    .result-info {
      padding: 20px 0;
    }

    .success-message {
      font-size: 18px;
      font-weight: 600;
      color: #28a745;
      margin-bottom: 12px;
      text-align: center;
    }

    .credits-info {
      font-size: 14px;
      color: #6c757d;
      text-align: center;
      margin-bottom: 20px;
    }

    .preview-section {
      margin: 20px 0;
    }

    .preview-label {
      font-size: 14px;
      font-weight: 500;
      color: #495057;
      margin-bottom: 8px;
    }

    .video-preview {
      border: 2px solid #e9ecef;
      border-radius: 8px;
    }

    .result-actions {
      border-top: 1px solid #e9ecef;
      padding-top: 20px;
    }

    .action-description {
      margin-bottom: 20px;
    }

    .action-description strong {
      color: #495057;
      font-size: 16px;
    }

    .action-description p {
      color: #6c757d;
      font-size: 14px;
      margin: 8px 0 0 0;
    }

    .btn-add {
      background: #28a745 !important;
      border-color: #28a745 !important;
    }

    .btn-add:hover {
      background: #218838 !important;
      border-color: #1e7e34 !important;
    }

    .status-message {
      text-align: center;
      padding: 12px;
      background: #e7f3ff;
      border-radius: 6px;
      margin-top: 16px;
      font-size: 14px;
      color: #0056b3;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #3a3f44;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .hidden {
      display: none;
    }
  `;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timelineState = state;
    });
    return super.createRenderRoot();
  }

  show(videoId: string) {
    console.log("VideoEditModal.show called with:", videoId);
    console.log("Timeline state:", this.timelineState.timeline);
    
    this.selectedVideoId = videoId;
    this.selectedVideoElement = this.timelineState.timeline[videoId];
    this.promptText = "";
    this.isProcessing = false;
    this.processingProgress = "";
    
    console.log("Selected video element:", this.selectedVideoElement);
    
    if (!this.selectedVideoElement || this.selectedVideoElement.filetype !== "video") {
      console.error("Invalid video element selected", this.selectedVideoElement);
      return;
    }

    console.log("Requesting update to show modal");
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

  private handleKeyDown(e: KeyboardEvent) {
    // Prevent timeline keyboard shortcuts when typing in modal
    e.stopPropagation();
  }

  private handleKeyUp(e: KeyboardEvent) {
    // Prevent timeline keyboard shortcuts when typing in modal
    e.stopPropagation();
  }

  private async handleAddToTimeline() {
    if (!this.editedVideoResult || !this.editedVideoResult.s3Key) {
      console.error("No edited video result to add");
      return;
    }

    try {
      console.log("➕ User clicked Add to Timeline - adding to end of timeline...");
      
      // Get the CloudFront URL for the edited video
      const cloudFrontUrl = convertS3ToCloudFront(this.editedVideoResult.s3Key);
      console.log("🎬 Adding edited video to timeline:", cloudFrontUrl);
      
      // Calculate the end position of current timeline
      const currentTimeline = this.timelineState.timeline;
      let endPosition = 0;
      
      if (currentTimeline && Object.keys(currentTimeline).length > 0) {
        Object.values(currentTimeline).forEach((element: any) => {
          if (element && typeof element === 'object') {
            const elementEndTime = (element.startTime || 0) + (element.duration || 0);
            endPosition = Math.max(endPosition, elementEndTime);
          }
        });
        console.log(`🎯 Timeline end position: ${endPosition}ms`);
      } else {
        console.log('🎯 Timeline is empty, starting at position 0');
      }
      
      // Create the new video element directly and add it to timeline
      const videoId = Date.now();
      const newVideoElement = {
        filetype: "video",
        key: `seg-edited-${videoId}`,
        localpath: undefined, // Don't set localpath for URL-based videos
        blob: cloudFrontUrl, // Use CloudFront URL as blob
        url: cloudFrontUrl,
        src: cloudFrontUrl, // Also set src for video loading
        priority: 0,
        track: 0,
        startTime: endPosition, // Start at the end of current timeline
        duration: 5000, // Default duration, will be updated after download
        location: { x: 0, y: 0 },
        timelineOptions: { color: "rgb(71, 59, 179)" },
        width: 1920,
        height: 1080,
        ratio: 16/9,
        opacity: 100,
        rotation: 0,
        animation: {
          opacity: { isActivate: false, x: [], ax: [] },
          position: { isActivate: false, x: [], y: [], ax: [], ay: [] },
          scale: { isActivate: false, x: [], ax: [] },
          rotation: { isActivate: false, x: [], ax: [] }
        },
        trim: { startTime: 0, endTime: 5000 },
        isExistAudio: true,
        codec: { video: "", audio: "" },
        speed: 1,
        filter: { enable: false, list: [] },
        origin: { width: 1920, height: 1080 }
      };
      
      // Update UI to show adding state
      this.processingProgress = "Adding to timeline...";
      this.requestUpdate();
      
      // Add the video element to the timeline store
      const updatedTimeline = {
        ...currentTimeline,
        [newVideoElement.key]: newVideoElement
      };
      
      this.timelineState.patchTimeline(updatedTimeline);
      
      // Trigger UI update
      const elementTimelineCanvas = document.querySelector('element-timeline-canvas');
      if (elementTimelineCanvas) {
        elementTimelineCanvas.requestUpdate();
      }
      
      console.log("✅ Video added to timeline at end position");
      
      // Success
      this.processingProgress = "Video added to timeline successfully!";
      this.requestUpdate();
      
      setTimeout(() => {
        this.hide();
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error in add process:", error);
      this.processingProgress = `Error: ${error instanceof Error ? error.message : 'Failed to add video to timeline'}`;
      this.requestUpdate();
      
      setTimeout(() => {
        this.processingProgress = "";
        this.requestUpdate();
      }, 3000);
    }
  }

  private handleDiscardResult() {
    console.log("🗑️ User discarded the edited video result");
    this.editedVideoResult = null;
    this.showResult = false;
    this.processingProgress = "";
    this.requestUpdate();
  }

  private handleTryAgain() {
    console.log("🔄 User wants to try editing again");
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
    this.processingProgress = "Preparing video for editing...";
    this.requestUpdate();

    try {
      const videoUri = await this.getVideoUri();
      const projectId = generateProjectId();

      // Log the video URI we're using
      console.log("🎯 Final video URI for API:", videoUri);

      const apiUrl = getVideoEditingApiUrl(VIDEO_EDITING_CONFIG.ENDPOINTS.VIDEO_EDIT_COMPLETE, { projectId });
      
      const requestBody = {
        videoUri: videoUri,
        promptText: this.promptText.trim(),
        model: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.model,
        ratio: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.ratio,
        seed: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.seed(),
        references: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.references,
        contentModeration: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.contentModeration,
        publicFigureThreshold: VIDEO_EDITING_CONFIG.DEFAULT_PARAMS.publicFigureThreshold
      };

      // Log the exact request being sent
      console.log("🚀 API REQUEST DETAILS:");
      console.log("   URL:", apiUrl);
      console.log("   Method: POST");
      console.log("   Headers:", {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthToken() ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'
      });
      console.log("   Body:", JSON.stringify(requestBody, null, 2));
      console.log("   Video URI being sent:", videoUri);
      console.log("   Project ID:", projectId);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthToken()
        },
        body: JSON.stringify(requestBody)
      });

      console.log("📡 API RESPONSE:");
      console.log("   Status:", response.status);
      console.log("   Status Text:", response.statusText);
      console.log("   Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("❌ ERROR RESPONSE DATA:", errorData);
        
        let errorMessage = `API request failed: ${response.status}`;
        
        switch (response.status) {
          case 400:
            // Check if it's a video access issue
            if (errorData.error && errorData.error.includes('Failed to fetch asset') && errorData.error.includes('403')) {
              errorMessage = `Video URL not accessible (403 Forbidden). The CloudFront URL might be incorrect or the video doesn't exist at that location.`;
            } else {
              errorMessage = errorData.message || errorData.error || 'Bad request - check video URI and parameters';
            }
            break;
          case 401:
            errorMessage = 'Authentication failed - invalid API key or token';
            break;
          case 429:
            errorMessage = 'Rate limit exceeded - please try again later';
            break;
          case 500:
            errorMessage = 'Server error - please try again later';
            break;
          default:
            errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`;
        }
        
        console.log("💥 Final error message:", errorMessage);
        throw new Error(errorMessage);
      }

      this.processingProgress = "Processing video with AI...";
      this.requestUpdate();

      const result = await response.json();
      console.log("✅ SUCCESS RESPONSE DATA:", result);
      console.log("   S3 Key:", result.s3Key);
      console.log("   Video URL:", result.videoUrl);
      console.log("   Credits Used:", result.creditsUsed);
      
      if (result.s3Key) {
        // Store the result and show it to the user
        this.editedVideoResult = result;
        this.showResult = true;
        this.isProcessing = false;
        this.processingProgress = `Video editing complete! Used ${result.creditsUsed || 'unknown'} credits`;
        this.requestUpdate();
        
        console.log("🎉 Video editing complete! Showing result to user.");
      } else {
        throw new Error("No S3 key received from API");
      }

    } catch (error) {
      console.error("Video editing failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.processingProgress = `Error: ${errorMessage}`;
      this.isProcessing = false;
      setTimeout(() => {
        this.processingProgress = "";
        this.requestUpdate();
      }, 3000);
    }
  }

  private async getVideoUri(): Promise<string> {
    console.log("🔍 GETTING VIDEO URI FROM STORE");
    console.log("🔍 Selected video element:", this.selectedVideoElement);
    console.log("🔍 All properties:", Object.keys(this.selectedVideoElement));
    
    // Extract video ID from the key
    const videoId = this.selectedVideoElement.key?.replace('seg-', '') || this.selectedVideoElement.id;
    console.log("🎯 Video ID:", videoId);
    
    // Method 1: Check for existing CloudFront URL in video element
    for (const [key, value] of Object.entries(this.selectedVideoElement)) {
      if (value && typeof value === 'string' && value.includes('cloudfront')) {
        console.log(`✅ Found existing CloudFront URL in property '${key}':`, value);
        return value;
      }
    }
    
    // Method 2: Check React stores for video URLs
    console.log("🔍 Checking React stores for video URLs...");
    console.log("🔍 Looking for video ID:", videoId);
    
    // Check project store videos array
    try {
      const projectStore = (window as any).__MY_GLOBAL_PROJECT_STORE__;
      if (projectStore) {
        const state = projectStore.getState();
        console.log("📋 Project store state:", state);
        
        // Check videos array in project store
        if (state.videos && Array.isArray(state.videos)) {
          console.log("📹 Found videos in project store:", state.videos);
          
          const video = state.videos.find((v: any) => v.id === videoId);
          if (video && video.url) {
            console.log(`✅ Found CloudFront URL in project store for ${videoId}:`, video.url);
            return video.url;
          }
        }
        
        // Check storedVideosMap (backward compatibility)
        if (state.storedVideosMap && state.storedVideosMap[videoId]) {
          const videoUrl = state.storedVideosMap[videoId];
          if (typeof videoUrl === 'string' && videoUrl.includes('cloudfront')) {
            console.log(`✅ Found CloudFront URL in storedVideosMap for ${videoId}:`, videoUrl);
            return videoUrl;
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not access project store:", error);
    }
    
    // Check segment store for video URLs
    try {
      // Try to access segment store from window or import
      const segmentStore = (window as any).useSegmentStore || (window as any).__SEGMENT_STORE__;
      if (segmentStore && segmentStore.getState) {
        const segmentState = segmentStore.getState();
        console.log("📋 Segment store state:", segmentState);
        
        // Check project videos first (if we're in project mode)
        if (segmentState.projectVideos && segmentState.projectVideos[videoId]) {
          const videoUrl = segmentState.projectVideos[videoId];
          if (typeof videoUrl === 'string' && videoUrl.includes('cloudfront')) {
            console.log(`✅ Found CloudFront URL in projectVideos for ${videoId}:`, videoUrl);
            return videoUrl;
          }
        }
        
        // Check segment videos
        if (segmentState.segmentVideos && segmentState.segmentVideos[videoId]) {
          const videoUrl = segmentState.segmentVideos[videoId];
          if (typeof videoUrl === 'string' && videoUrl.includes('cloudfront')) {
            console.log(`✅ Found CloudFront URL in segmentVideos for ${videoId}:`, videoUrl);
            return videoUrl;
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not access segment store:", error);
    }
    
    // Method 3: Check window.videoStore or other global stores
    const globalStores = [
      (window as any).videoStore,
      (window as any).projectStore,
      (window as any).timelineStore
    ];
    
    for (const store of globalStores) {
      if (store && typeof store === 'object') {
        if (store.videos && Array.isArray(store.videos)) {
          const video = store.videos.find((v: any) => v.id === videoId);
          if (video && video.url) {
            console.log(`✅ Found CloudFront URL in global store for ${videoId}:`, video.url);
            return video.url;
          }
        }
      }
    }
    
    // Method 4: Last resort - upload local video to CloudFront
    const localPath = this.selectedVideoElement.localpath;
    if (localPath && typeof localPath === 'string' && localPath.startsWith('/')) {
      console.log("📁 No CloudFront URL found, uploading local file:", localPath);
      
      this.processingProgress = "Uploading video to CloudFront...";
      this.requestUpdate();
      
      const uploadResult = await this.uploadVideoToCloudFront(localPath);
      if (uploadResult && uploadResult.cloudFrontUrl) {
        console.log("✅ Video uploaded to CloudFront:", uploadResult.cloudFrontUrl);
        return uploadResult.cloudFrontUrl;
      } else {
        throw new Error("Failed to upload video to CloudFront. Please try again.");
      }
    }
    
    // No usable video found
    console.error("❌ No CloudFront URL found anywhere!");
    console.error("Video ID:", videoId);
    console.error("Available properties:", Object.keys(this.selectedVideoElement));
    console.error("Property values:", this.selectedVideoElement);
    
    throw new Error(`No CloudFront URL found for video ${videoId}. Please ensure the video is properly loaded.`);
  }

  private async uploadVideoToCloudFront(localPath: string): Promise<{cloudFrontUrl: string}> {
    try {
      const projectId = generateProjectId();
      const videoId = this.selectedVideoElement.key?.replace('seg-', '') || `video_${Date.now()}`;
      
      console.log("📤 Uploading video to CloudFront...");
      console.log("   Local path:", localPath);
      console.log("   Project ID:", projectId);
      console.log("   Video ID:", videoId);
      
      // Read the file using Electron's file system
      if (!window.electronAPI?.req?.readFile) {
        throw new Error("Electron file system API not available");
      }
      
      const fileBuffer = await window.electronAPI.req.readFile(localPath);
      console.log("📁 File read successfully, size:", fileBuffer.byteLength);
      
      // Create FormData for upload
      const formData = new FormData();
      const videoBlob = new Blob([fileBuffer], { type: 'video/mp4' });
      formData.append('video', videoBlob, `${videoId}.mp4`);
      formData.append('projectId', projectId);
      formData.append('videoId', videoId);
      
      // Upload to your backend
      const uploadUrl = `https://backend.usuals.ai/upload/video`;
      console.log("⬆️ Uploading to:", uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthToken()
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", response.status, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("✅ Upload successful:", result);
      
      // Extract CloudFront URL from response
      let cloudFrontUrl = result.cloudFrontUrl || result.url;
      
      // If we got an S3 key, convert it to CloudFront URL
      if (!cloudFrontUrl && result.s3Key) {
        cloudFrontUrl = convertS3ToCloudFront(result.s3Key);
      }
      
      if (!cloudFrontUrl) {
        throw new Error("No CloudFront URL returned from upload");
      }
      
      console.log("🌐 Final CloudFront URL:", cloudFrontUrl);
      return { cloudFrontUrl };
      
    } catch (error) {
      console.error("❌ Upload to CloudFront failed:", error);
      throw error;
    }
  }


  private getAuthToken(): string {
    // Try to get token from localStorage first
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('jwt') || 
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('authToken') ||
                  sessionStorage.getItem('jwt') ||
                  sessionStorage.getItem('token');
    
    if (token) {
      return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    
    // For now, return a placeholder - you may need to implement proper auth
    return 'Bearer temp-token';
  }

  private async replaceVideoInTimeline(s3Key: string) {
    const cloudFrontUrl = convertS3ToCloudFront(s3Key);
    
    console.log("🔄 REPLACING VIDEO IN TIMELINE:");
    console.log("   S3 Key:", s3Key);
    console.log("   CloudFront URL:", cloudFrontUrl);
    console.log("   Selected Video ID:", this.selectedVideoId);
    console.log("   Original Element:", this.selectedVideoElement);
    
    try {
      // Download the edited video to user's folder (like original videos)
      console.log("📥 Downloading edited video to local folder...");
      
      const downloadResult = await window.electronAPI.req.downloadVideo({
        url: cloudFrontUrl,
        videoId: this.selectedVideoElement.key?.replace('seg-', '') || 'edited_video',
        projectId: this.selectedVideoElement.key?.replace('seg-', '') || 'project'
      });
      
      console.log("📁 Download result:", downloadResult);
      
      if (downloadResult && downloadResult.localPath) {
        // Use the local path like original videos
        const updatedElement = {
          ...this.selectedVideoElement,
          localpath: downloadResult.localPath,
          blob: undefined, // Clear blob to force reload
          url: undefined,
          src: undefined
        };
        
        console.log("   Updated Element (with local path):", updatedElement);
        
        // Continue with timeline update...
        await this.updateTimelineWithElement(updatedElement);
        
      } else {
        // Fallback: Use CloudFront URL directly
        console.log("⚠️  Download failed, using CloudFront URL directly");
        const updatedElement = {
          ...this.selectedVideoElement,
          localpath: cloudFrontUrl,
          blob: undefined,
          url: cloudFrontUrl,
          src: cloudFrontUrl
        };
        
        await this.updateTimelineWithElement(updatedElement);
      }
      
    } catch (error) {
      console.error("❌ Error downloading video:", error);
      // Fallback to CloudFront URL
      const updatedElement = {
        ...this.selectedVideoElement,
        localpath: cloudFrontUrl,
        blob: undefined,
        url: cloudFrontUrl
      };
      
      await this.updateTimelineWithElement(updatedElement);
    }
  }

  private async updateTimelineWithElement(updatedElement: any) {
    console.log("🔧 Updating timeline with element:", updatedElement);

    const currentTimeline = this.timelineState.timeline;
    console.log("   Current timeline keys:", Object.keys(currentTimeline));
    console.log("   Looking for video ID:", this.selectedVideoId);
    
    if (!currentTimeline[this.selectedVideoId]) {
      console.error("❌ Video ID not found in timeline!", this.selectedVideoId);
      console.log("Available video IDs:", Object.keys(currentTimeline));
      return;
    }

    const updatedTimeline = {
      ...currentTimeline,
      [this.selectedVideoId]: updatedElement
    };

    // Patch ONLY this specific video element in the timeline
    this.timelineState.patchTimeline(updatedTimeline);
    console.log("✅ Timeline store updated (single video only)");

    // Clear any cached video data for this element
    const loadedAssetStore = (window as any).loadedAssetStore;
    if (loadedAssetStore && loadedAssetStore._loadedElementVideo) {
      delete loadedAssetStore._loadedElementVideo[this.selectedVideoId];
      console.log("🗑️ Cleared cached video data");
    }

    // Try to update only the specific video element without full refresh
    console.log("🔄 Attempting targeted video update...");
    
    try {
      const elementTimelineCanvas = document.querySelector("element-timeline-canvas");
      if (elementTimelineCanvas) {
        console.log("   Using requestUpdate on canvas only");
        (elementTimelineCanvas as any).requestUpdate();
      }
    } catch (e) {
      console.log("   Targeted update failed, using minimal refresh");
    }

    // Force re-render of the specific video thumbnail/preview
    setTimeout(() => {
      console.log("🔄 Delayed element-specific refresh...");
      const videoElements = document.querySelectorAll(`[data-element-id="${this.selectedVideoId}"]`);
      videoElements.forEach(el => {
        if ((el as any).requestUpdate) {
          (el as any).requestUpdate();
        }
      });
    }, 100);

    console.log("⚠️  Using targeted refresh to preserve other videos");
    console.log("✅ VIDEO REPLACEMENT COMPLETE!");
    console.log("   Updated element:", updatedElement);
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
              <h3 class="modal-title">✨ Video Editing Complete!</h3>
              <button class="close-btn" @click=${this.hide}>×</button>
            </div>

            <div class="result-info">
              <div class="success-message">
                🎉 Your video has been successfully edited!
              </div>
              <div class="credits-info">
                Credits used: ${this.editedVideoResult.creditsUsed || 'Unknown'}
              </div>
              
              ${this.editedVideoResult.videoUrl ? html`
                <div class="preview-section">
                  <div class="preview-label">Preview (Runway's temporary URL):</div>
                  <video 
                    class="video-preview" 
                    src="${this.editedVideoResult.videoUrl}" 
                    controls 
                    muted
                    style="width: 100%; max-height: 300px; border-radius: 8px;"
                  ></video>
                </div>
              ` : ''}
            </div>

            <div class="result-actions">
              <div class="action-description">
                <strong>What would you like to do?</strong>
                <p>Click "Replace Video" to save the edited video to your laptop and replace it in the timeline.</p>
              </div>
              
              <div class="button-group">
                <button 
                  class="btn btn-secondary" 
                  @click=${this.handleDiscardResult}
                >
                  Discard
                </button>
                <button 
                  class="btn btn-secondary" 
                  @click=${this.handleTryAgain}
                >
                  Try Again
                </button>
                <button 
                  class="btn btn-primary btn-add" 
                  @click=${this.handleAddToTimeline}
                >
                  ➕ Add to Timeline
                </button>
              </div>
            </div>

            ${this.processingProgress ? html`
              <div class="status-message">
                ${this.processingProgress}
              </div>
            ` : ''}
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
            <button class="close-btn" @click=${this.hide} ?disabled=${this.isProcessing}>
              ×
            </button>
          </div>

          <div class="video-info">
            <div class="video-info-title">Selected Video:</div>
            <div class="video-info-path">${this.selectedVideoElement.localpath || 'Unknown path'}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Describe the changes you want to make:</label>
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

          ${this.isProcessing ? html`
            <div class="processing-indicator">
              <div class="spinner"></div>
              <span>${this.processingProgress}</span>
            </div>
          ` : ''}

          <div class="button-group">
            <button 
              class="btn btn-secondary" 
              @click=${this.hide}
              ?disabled=${this.isProcessing}
            >
              Cancel
            </button>
            <button 
              class="btn btn-primary" 
              @click=${this.handleStartEditing}
              ?disabled=${this.isProcessing || !this.promptText.trim()}
            >
              ${this.isProcessing ? html`
                <div class="spinner"></div>
                Processing...
              ` : 'Start Editing'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private handleOverlayClick(e: Event) {
    if (e.target === e.currentTarget && !this.isProcessing) {
      this.hide();
    }
  }

  private handleContentClick(e: Event) {
    e.stopPropagation();
  }
}
