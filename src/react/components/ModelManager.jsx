import React, { useState, useEffect } from 'react';
import { getInstalledModels, downloadModel, deleteModel, getAvailableModels } from '../utils/ollamaAPI';

/**
 * ModelManager component provides interface for managing Ollama models
 * Allows downloading new models and removing existing ones
 */
const ModelManager = ({ onClose }) => {
  const [installedModels, setInstalledModels] = useState([]);
  const [modelGroups, setModelGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [installingModels, setInstallingModels] = useState(new Set());
  const [error, setError] = useState(null);

  // Fetch installed models and available models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      const [installed, available] = await Promise.all([
        getInstalledModels(),
        getAvailableModels()
      ]);
      setInstalledModels(installed);
      setModelGroups(available);
      setError(null);
    } catch (err) {
      setError('Failed to fetch models');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (modelName) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [modelName]: 0 }));
      await downloadModel(
        modelName, 
        (progress) => {
          if (progress === 'installing') {
            setInstallingModels(prev => new Set(prev).add(modelName));
            setDownloadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[modelName];
              return newProgress;
            });
          } else {
            setDownloadProgress(prev => ({ ...prev, [modelName]: progress }));
          }
        }
      );
      setInstallingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
      await fetchModels();
      setError(null);
    } catch (err) {
      setError(`Failed to download ${modelName}`);
      console.error(err);
      setInstallingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    } finally {
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelName];
        return newProgress;
      });
    }
  };

  const handleDelete = async (modelName) => {
    if (window.confirm(`Are you sure you want to delete ${modelName}?`)) {
      try {
        await deleteModel(modelName);
        await fetchModels();
        setError(null);
      } catch (err) {
        setError(`Failed to delete ${modelName}`);
        console.error(err);
      }
    }
  };

  const toggleGroup = (modelName) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modelName)) {
        newSet.delete(modelName);
      } else {
        newSet.add(modelName);
      }
      return newSet;
    });
  };

  // Filter model groups based on search query
  const filteredModelGroups = modelGroups.filter(group => 
    group.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="model-manager">
      <div className="model-manager-header">
        <h2>Model Manager</h2>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="model-search">
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="model-sections">
        <div className="installed-models">
          <h3>Installed Models</h3>
          {isLoading ? (
            <div className="loading">Loading installed models...</div>
          ) : (
            <div className="model-list">
              {installedModels.map(model => (
                <div key={model} className="model-item">
                  <span className="model-name">{model}</span>
                  <button 
                    className="delete-model-btn"
                    onClick={() => handleDelete(model)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="available-models">
          <h3>Available Models</h3>
          <div className="model-list">
            {filteredModelGroups.map(group => (
              <div key={group.model} className="model-group">
                <div 
                  className="model-group-header"
                  onClick={() => toggleGroup(group.model)}
                >
                  <span className="model-name">{group.model}</span>
                  <i className={`fas fa-chevron-${expandedGroups.has(group.model) ? 'down' : 'right'}`}></i>
                </div>
                {expandedGroups.has(group.model) && (
                  <div className="model-variants">
                    {group.tags.map(tag => {
                      const fullModelName = `${group.model}:${tag}`;
                      const isInstalled = installedModels.includes(fullModelName);
                      const isDownloading = fullModelName in downloadProgress;
                      const isInstalling = installingModels.has(fullModelName);
                      
                      return (
                        <div key={fullModelName} className="model-item variant">
                          <span className="model-name">{tag}</span>
                          {isDownloading ? (
                            <div className="download-progress">
                              {Math.round(downloadProgress[fullModelName])}%
                            </div>
                          ) : isInstalling ? (
                            <div className="download-progress installing">
                              Installing...
                            </div>
                          ) : (
                            <button 
                              className="download-btn"
                              onClick={() => handleDownload(fullModelName)}
                              disabled={isInstalled}
                            >
                              {isInstalled ? 'Installed' : 'Download'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelManager; 