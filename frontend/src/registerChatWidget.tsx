import React from 'react';
import ReactDOM from 'react-dom/client';
import reactToWebComponent from 'react-to-webcomponent';
import './index.css'; // tailwind utilities for widget
// @ts-ignore - importing .jsx component
import ChatWidget from './components/ChatWidget';
import { AuthProvider } from './context/AuthContext';

// Polyfill process for UMD bundles that expect it (e.g., React internals)
if (typeof window !== 'undefined' && (window as any).process === undefined) {
  (window as any).process = { env: { NODE_ENV: 'production' } };
}

// Wrap ChatWidget with AuthProvider
const ChatWidgetWithAuth = () => (
  <AuthProvider>
    <ChatWidget />
  </AuthProvider>
);

// Wrap React component into a custom element that can be used anywhere
// (lit-based Electron renderer, plain HTML, etc.).
const ChatWidgetElement = reactToWebComponent(ChatWidgetWithAuth, React, ReactDOM, {});

// Add some debugging
console.log('Registering react-chat-widget element');

customElements.define(
  'react-chat-widget',
  ChatWidgetElement
);

// Also log when the element is created
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, looking for react-chat-widget elements');
  const elements = document.querySelectorAll('react-chat-widget');
  console.log('Found react-chat-widget elements:', elements.length);
}); 