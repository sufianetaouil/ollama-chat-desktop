import React, { useState, useEffect, useRef } from 'react';
import Conversation from './components/Conversation';
import ModelSelector from './components/ModelSelector';
import { sendMessage, generateTitle } from './utils/ollamaAPI';

/**
 * Main application component that handles:
 * - Conversation management
 * - Message sending/receiving
 * - Model selection
 * - UI state management
 */
const App = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Stops the current message generation
   * Adds a note to the message indicating it was stopped
   */
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setIsWaitingResponse(false);
      setCurrentStreamingMessage(prev => prev + "\n\n[Generation stopped by user]");
    }
  };

  /**
   * Initiates conversation deletion process
   * @param {number} convId - ID of conversation to delete
   * @param {Event} e - Click event
   */
  const handleDeleteConversation = (convId, e) => {
    e.stopPropagation();
    setConversationToDelete(convId);
  };

  /**
   * Confirms and executes conversation deletion
   */
  const confirmDelete = () => {
    if (conversationToDelete) {
      setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete));
      if (selectedConversation === conversationToDelete) {
        setSelectedConversation(null);
      }
      setConversationToDelete(null);
    }
  };

  /**
   * Creates a new blank conversation
   */
  const createNewConversation = () => {
    const newConversation = {
      id: Date.now(),
      title: 'New Conversation',
      currentModel: 'llama3.2',
      messages: []
    };
    
    setConversations(prev => [...prev, newConversation]);
    setSelectedConversation(newConversation.id);
  };

  /**
   * Updates the model for a specific conversation
   * @param {number} conversationId - ID of conversation to update
   * @param {string} newModel - New model to use
   */
  const handleModelChange = (conversationId, newModel) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, currentModel: newModel };
      }
      return conv;
    }));
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result); // This will be the base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handles message sending and response generation
   * @param {Event} e - Keypress event
   */
  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isWaitingResponse) {
      e.preventDefault();
      
      if (!currentMessage.trim() && !selectedImage) return;

      const currentConv = conversations.find(c => c.id === selectedConversation);
      const currentModel = currentConv?.currentModel || 'llama3.2';

      const newUserMessage = {
        role: 'user',
        content: currentMessage,
        image: selectedImage, // Add the image if present
        timestamp: new Date().toLocaleString(),
        model: currentModel
      };

      // Create or update conversation
      if (!selectedConversation) {
        const newConversation = {
          id: Date.now(),
          title: 'New Conversation',
          currentModel: currentModel,
          messages: [newUserMessage]
        };
        setConversations(prev => [...prev, newConversation]);
        setSelectedConversation(newConversation.id);
      } else {
        setConversations(prev => prev.map(conv => {
          if (conv.id === selectedConversation) {
            return {
              ...conv,
              messages: [...conv.messages, newUserMessage]
            };
          }
          return conv;
        }));
      }

      setCurrentMessage('');
      setSelectedImage(null); // Clear the image after sending
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
      setIsWaitingResponse(true);
      setIsGenerating(true);
      setCurrentStreamingMessage('');

      try {
        const messages = currentConv ? [...currentConv.messages, newUserMessage] : [newUserMessage];
        
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();
        
        const response = await sendMessage(
          messages, 
          (chunk) => {
            setCurrentStreamingMessage(prev => prev + chunk);
          }, 
          currentModel,
          abortControllerRef.current.signal
        );

        const assistantMessage = {
          role: 'assistant',
          content: response.message.content,
          timestamp: new Date().toLocaleString(),
          model: currentModel
        };

        // If this is the first message, generate title
        if (messages.length === 1) {
          
          // Create a copy of the messages without the image for title generation
          const messagesForTitle = [
            { ...newUserMessage, image: undefined },
            { ...assistantMessage, image: undefined }
          ];
          
          const title = await generateTitle(
            messagesForTitle[0].content,
            messagesForTitle[1].content
          );
          
          setConversations(prev => prev.map(conv => {
            if (conv.id === selectedConversation) {
              return {
                ...conv,
                title: title || 'New Conversation',
                messages: [...conv.messages, assistantMessage]
              };
            }
            return conv;
          }));
        } else {
          setConversations(prev => prev.map(conv => {
            if (conv.id === selectedConversation) {
              return {
                ...conv,
                messages: [...conv.messages, assistantMessage]
              };
            }
            return conv;
          }));
        }

        setCurrentStreamingMessage('');
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request was aborted');
        } else {
          console.error('Failed to get response:', error);
        }
      } finally {
        setIsWaitingResponse(false);
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return conv.title.toLowerCase().includes(searchLower) ||
           conv.messages.some(msg => msg.content.toLowerCase().includes(searchLower));
  });

  // Sort conversations by most recent message
  const sortedAndFilteredConversations = filteredConversations.sort((a, b) => {
    const aLastMessage = a.messages[a.messages.length - 1];
    const bLastMessage = b.messages[b.messages.length - 1];
    
    const aTime = aLastMessage ? new Date(aLastMessage.timestamp).getTime() : a.id;
    const bTime = bLastMessage ? new Date(bLastMessage.timestamp).getTime() : b.id;
    
    return bTime - aTime;
  });

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  return (
    <div className={`flex ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
      <div className="sidebar">
        <div className="search">
          <input 
            placeholder="Search conversations..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="conversations-list">
          {sortedAndFilteredConversations.map(conv => (
            <div 
              key={conv.id}
              className={`menu-item ${selectedConversation === conv.id ? 'active' : ''}`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <span title={conv.title}>{conv.title}</span>
              <button
                className="delete-btn"
                onClick={(e) => handleDeleteConversation(conv.id, e)}
                title="Delete conversation"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="main-content">
        <div className="chat-container">
          {selectedConversation && (
            <Conversation 
              {...conversations.find(c => c.id === selectedConversation)}
              streamingMessage={currentStreamingMessage} 
            />
          )}
        </div>
        <div className="input-container">
          <div className="controls-row">
            {selectedConversation && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <button 
                  className="control-btn"
                  onClick={() => fileInputRef.current.click()}
                  title="Attach image"
                >
                  <i className="fas fa-image"></i>
                </button>
                <ModelSelector 
                  currentModel={conversations.find(c => c.id === selectedConversation)?.currentModel || 'llama3.2'}
                  onModelChange={(model) => handleModelChange(selectedConversation, model)}
                />
                {isGenerating && (
                  <button 
                    className="stop-btn"
                    onClick={stopGeneration}
                    title="Stop generation"
                  >
                    <i className="fas fa-stop"></i>
                  </button>
                )}
              </>
            )}
          </div>
          {selectedImage && (
            <div className="image-preview">
              <img src={selectedImage} alt="Selected" />
              <button 
                className="remove-image"
                onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
          <textarea 
            placeholder={isWaitingResponse ? "Waiting for response..." : "Type your message here..."}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isWaitingResponse}
          />
        </div>
      </div>
      <div className="window-controls">
        <button onClick={() => setSidebarVisible(!isSidebarVisible)} className="control-btn">
          <i className="fas fa-bars"></i>
        </button>
        <button onClick={createNewConversation} className="control-btn">
          <i className="fas fa-plus"></i>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {conversationToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Conversation</h3>
            <p>Are you sure you want to delete this conversation?</p>
            <div className="modal-buttons">
              <button onClick={confirmDelete} className="confirm-btn">
                Delete
              </button>
              <button onClick={() => setConversationToDelete(null)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;