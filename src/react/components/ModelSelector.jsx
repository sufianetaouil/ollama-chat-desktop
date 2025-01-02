import React, { useState, useEffect } from 'react';
import { getInstalledModels } from '../utils/ollamaAPI';
import ModelManager from './ModelManager';

/**
 * ModelSelector component provides a dropdown to select AI models
 * @param {Object} props
 * @param {string} props.currentModel - Currently selected model
 * @param {Function} props.onModelChange - Callback when model is changed
 */
const ModelSelector = ({ currentModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState([currentModel]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModelManager, setShowModelManager] = useState(false);

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      const models = await getInstalledModels();
      setAvailableModels(models);

      // Auto-select model if needed
      if (models.length === 1) {
        onModelChange(models[0]);
      } else if (!currentModel || !models.includes(currentModel)) {
        onModelChange(models[models.length - 1]);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchModels();
  }, []);

  const handleModelManagerClose = () => {
    setShowModelManager(false);
    fetchModels(); // Refresh models when manager is closed
  };

  /**
   * Formats model name for display
   * Shows both friendly name and full model identifier
   * @param {string} modelName - Full model name
   * @returns {string} Formatted model name
   */
  const formatModelName = (modelName) => {
    const [name, version] = modelName.split(':');
    if (!version) return modelName;
    
    const paramMatch = version.match(/(\d+b)/i);
    const params = paramMatch ? ` (${paramMatch[1]})` : '';
    
    return `${name}${params}`;
  };

  return (
    <div className="model-selector">
      <button 
        className="settings-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={`Current Model: ${currentModel}`}
      >
        <i className="fas fa-cog"></i>
      </button>
      {isOpen && (
        <div className="model-dropdown">
          <div className="dropdown-title">
            {isLoading ? 'Loading models...' : 'Select Model'}
          </div>
          {availableModels.map(model => (
            <div 
              key={model}
              className={`model-option ${currentModel === model ? 'active' : ''}`}
              onClick={() => {
                onModelChange(model);
                setIsOpen(false);
              }}
            >
              <div className="model-info">
                <div className="model-name">{formatModelName(model)}</div>
                <div className="model-full-name">{model}</div>
              </div>
              {currentModel === model && <i className="fas fa-check"></i>}
            </div>
          ))}
          <div 
            className="model-option manage-models"
            onClick={() => {
              setShowModelManager(true);
              setIsOpen(false);
            }}
          >
            <div className="model-info">
              <div className="model-name">Manage Models</div>
              <div className="model-full-name">Download or remove models</div>
            </div>
            <i className="fas fa-download"></i>
          </div>
        </div>
      )}
      {showModelManager && (
        <div className="modal-overlay" onClick={() => handleModelManagerClose()}>
          <div className="model-manager-container" onClick={e => e.stopPropagation()}>
            <ModelManager onClose={handleModelManagerClose} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 