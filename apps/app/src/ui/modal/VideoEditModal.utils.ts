export class VideoEditModalUtils {
  static handleOverlayClick(e: Event, isProcessing: boolean, hideCallback: () => void) {
    if (e.target === e.currentTarget && !isProcessing) {
      hideCallback();
    }
  }

  static handleContentClick(e: Event) {
    e.stopPropagation();
  }

  static handleKeyDown(e: KeyboardEvent) {
    // Prevent timeline keyboard shortcuts when typing in modal
    e.stopPropagation();
  }

  static handleKeyUp(e: KeyboardEvent) {
    // Prevent timeline keyboard shortcuts when typing in modal
    e.stopPropagation();
  }
}
