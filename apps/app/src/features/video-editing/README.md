# Video Editing Feature

This feature allows users to edit videos directly from the timeline using AI-powered video editing through the Runway API.

## How It Works

### User Interaction
1. **Double-click** any video element in the timeline
2. A modal dialog opens with a text input for editing instructions
3. User types their editing prompt (e.g., "Add snow falling in the background")
4. Click "Start Editing" to begin the process

### Technical Flow
1. **Modal Display**: `VideoEditModal` component shows with video information
2. **API Call**: Makes request to `/video-editing/runway-aleph/complete` endpoint
3. **Processing**: Video is processed using Runway's Aleph model
4. **S3 Storage**: Edited video is stored in S3 and returns S3 key
5. **CloudFront CDN**: S3 key is converted to CloudFront URL for fast access
6. **Timeline Update**: Original video in timeline is replaced with edited version

## Components

### VideoEditModal (`/ui/modal/VideoEditModal.ts`)
- Clean, modern modal interface
- Real-time processing status updates
- Error handling with user-friendly messages
- Automatic video replacement in timeline

### Timeline Integration (`/features/element/elementTimelineCanvas.ts`)
- Double-click detection on video elements
- Modal management and lifecycle
- Video element validation

## API Integration

### Endpoint
```
POST /video-editing/runway-aleph/complete?projectId={projectId}
```

### Request Body
```json
{
  "videoUri": "https://example.com/input-video.mp4",
  "promptText": "Add snow falling in the background",
  "model": "gen4_aleph",
  "ratio": "1280:720"
}
```

### Response
```json
{
  "s3Key": "project-id/videos/operation-id/uuid.mp4",
  "videoUrl": "https://runway-output-url.mp4",
  "creditsUsed": 50
}
```

## Configuration

### Environment Variables
- `API_BASE_URL`: Backend API base URL (default: http://localhost:3000)
- `CLOUDFRONT_DOMAIN`: CloudFront distribution domain for video access

### Project Context
- Project ID is automatically generated from current project file
- Format: `proj_{filename}_{timestamp}`

## Features

### ✅ Implemented
- Double-click detection on video elements
- Modal dialog with prompt input
- API integration with Runway Aleph
- S3 to CloudFront URL conversion
- Timeline video replacement
- Processing status indicators
- Error handling and user feedback
- Clean component architecture

### 🔄 Processing Flow
1. **Validation**: Ensures selected element is a video
2. **Modal Display**: Shows editing interface
3. **API Request**: Sends video and prompt to backend
4. **Status Updates**: Real-time progress feedback
5. **Video Replacement**: Updates timeline with edited video
6. **Cleanup**: Closes modal and resets state

### 🛡️ Error Handling
- Invalid video element selection
- API request failures
- Network connectivity issues
- Missing S3 key in response
- Timeline update failures

## Usage Examples

### Basic Video Editing
```typescript
// Double-click any video in timeline
// Modal opens automatically
// Type prompt: "Make the sky purple"
// Click "Start Editing"
// Wait for processing to complete
// Video is automatically replaced in timeline
```

### Programmatic Access
```typescript
const timelineCanvas = document.querySelector('element-timeline-canvas');
timelineCanvas.openVideoEditModal('video-element-id');
```

## Testing

Run the integration tests:
```bash
npm test video-editing-integration.test.ts
```

Tests cover:
- Double-click detection
- Modal functionality
- API integration
- Video replacement
- Error scenarios

## Architecture Benefits

### 🎯 Clean Separation
- Modal component handles UI and API logic
- Timeline component handles interaction detection
- Clear interfaces between components

### 🔄 Reactive Updates
- Real-time status updates during processing
- Automatic timeline refresh after editing
- Proper state management

### 🛠️ Maintainable Code
- TypeScript for type safety
- Lit components for modern web standards
- Comprehensive error handling
- Extensive test coverage

### 🚀 Performance
- CloudFront CDN for fast video access
- Efficient double-click detection
- Minimal DOM manipulation
- Lazy modal creation

## Future Enhancements

### Potential Improvements
- [ ] Batch video editing
- [ ] Editing history/undo
- [ ] Preview before applying
- [ ] Custom model selection
- [ ] Advanced editing options
- [ ] Progress bar for long operations
- [ ] Keyboard shortcuts
- [ ] Drag & drop video replacement

### API Enhancements
- [ ] Real-time progress updates via WebSocket
- [ ] Video quality selection
- [ ] Multiple output formats
- [ ] Editing templates/presets
