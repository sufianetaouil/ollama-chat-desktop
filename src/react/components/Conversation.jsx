import React, { useEffect, useRef } from 'react';
import Message from './Message';

/**
 * Conversation component displays a list of messages and handles auto-scrolling
 * @param {Object} props
 * @param {number} props.id - Conversation ID
 * @param {string} props.title - Conversation title
 * @param {string} props.currentModel - Current AI model in use
 * @param {Array} props.messages - Array of message objects
 * @param {string} props.streamingMessage - Currently generating message content
 */
const Conversation = ({ id, title, currentModel, messages, streamingMessage }) => {
  const messagesEndRef = useRef(null);

  /**
   * Scrolls to the bottom of the conversation smoothly
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when messages update or during streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return (
    <div className="conversation">
      <div className="conversation-header">
        <h2>{title}</h2>
        <div className="model-badge">{currentModel}</div>
      </div>
      <div className="messages-container">
        {messages.map((message, index) => (
          <Message
            key={index}
            content={message.content}
            role={message.role}
            timestamp={message.timestamp}
            model={message.model || currentModel}
          />
        ))}
        {streamingMessage && (
          <Message
            content={streamingMessage}
            role="assistant"
            timestamp={new Date().toLocaleString()}
            model={currentModel}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default Conversation; 