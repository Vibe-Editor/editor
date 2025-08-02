import React from "react";
import ChatWidgetSidebar from "./ChatWidgetSidebar";
import FloatingChatButton from "./chat-widget/FloatingChatButton";

// Wrapper component that manages the "open" state and toggles the sidebar / button
function ChatWidget() {
  const [open, setOpen] = React.useState(false);

  // Hide Electron publish button when the chat is open
  React.useEffect(() => {
    const btn = document.getElementById("publish-button");
    if (btn) {
      btn.style.display = open ? "none" : "";
    }
  }, [open]);

  // Expose open state for external inspection (optional)
  React.useEffect(() => {
    const host = document.querySelector("react-chat-widget") || document.body;
    if (host) host.setAttribute("data-open", open.toString());
  }, [open]);

  return (
    <>
      {/* Floating chat button is rendered only when sidebar is closed */}
      <FloatingChatButton open={open} setOpen={setOpen} />

      {/* Sidebar */}
      <ChatWidgetSidebar open={open} setOpen={setOpen} />
    </>
  );
}

export default ChatWidget;
