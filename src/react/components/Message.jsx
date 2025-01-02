import React from 'react';
import DOMPurify from 'dompurify';

/**
 * Message component displays individual messages in the conversation
 * @param {Object} props
 * @param {string} props.content - Message content
 * @param {string} props.role - Message sender role ('user' or 'assistant')
 * @param {string} props.timestamp - Message timestamp
 * @param {string} props.model - AI model used for this message
 * @param {string} props.image - Image attached to the message
 */
const Message = ({ content, role, timestamp, model, image }) => {
  return (
    <div className={`message-wrapper ${role}`}>
      <div className="message-metadata">
        <span>{role === 'user' ? 'You' : 'Assistant'}</span>
        <span className="timestamp">{timestamp}</span>
        {role === 'assistant' && <span className="model-badge">{model}</span>}
      </div>
      <div className="message">
        {image && (
          <div className="message-image">
            <img src={image} alt="Attached" />
          </div>
        )}
        <div 
          className="message-content"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(content) 
          }}
        />
      </div>
    </div>
  );
};

export default Message; 