import React from "react";

/**
 * Floating button that opens the chat sidebar.
 * Rendered only when the sidebar (open state) is false.
 */
export default function FloatingChatButton({ open, setOpen }) {
  console.log('FloatingChatButton rendered, open:', open);
  
  // For debugging, let's always show the button
  // if (open) return null;

  React.useEffect(() => {
    console.log('FloatingChatButton mounted - checking DOM');
    const button = document.getElementById('chat-widget-button');
    if (button) {
      console.log('Button found in DOM:', button);
      console.log('Button styles:', window.getComputedStyle(button));
    } else {
      console.log('Button NOT found in DOM');
    }
  }, []);

  return (
    <button
      id="chat-widget-button"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99999999, // Extremely high z-index
        backgroundColor: '#ff0000',
        color: 'white',
        padding: '20px 30px',
        borderRadius: '15px',
        border: '4px solid yellow', // Bright border to make it visible
        boxShadow: '0 10px 30px rgba(255,0,0,0.8)', // Red glow
        fontSize: '20px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '150px',
        minHeight: '60px',
        // Add more debugging styles
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto'
      }}
      aria-label="Open chat"
      onClick={() => {
        console.log('Chat button clicked!');
        setOpen(true);
      }}
    >
      <span style={{ fontSize: '24px' }}>✨</span>
      <span>CHAT BUTTON</span>
    </button>
  );
}
