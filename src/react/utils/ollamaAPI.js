const OLLAMA_ENDPOINT = 'http://localhost:11434/api';

export const sendMessage = async (messages, onChunk, model = 'llama3.2:latest', signal) => {
  try {
    const formattingInstruction = `Format your response using HTML for better readability. Use <h1>, <h2>, <h3> for titles and subtitles. If you include code, wrap it in <pre><code class="language-{language}"> tags. Use <p> for paragraphs and <ul>/<li> for lists.`;
    
    const prompt = [
      formattingInstruction,
      ...messages.map(msg => 
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      )
    ].join('\n\n');

    const response = await fetch(`${OLLAMA_ENDPOINT}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: true
      }),
      signal
    });

    let fullResponse = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line) continue;
        const data = JSON.parse(line);
        onChunk(data.response);
        fullResponse += data.response;
      }
    }

    return { message: { content: fullResponse } };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

export const getInstalledModels = async () => {
  try {
    const response = await fetch(`${OLLAMA_ENDPOINT}/tags`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.models.map(model => model.name);
  } catch (error) {
    console.error('Error fetching models:', error);
    return ['llama3.2:latest'];
  }
};

/**
 * Downloads a model from Ollama
 * @param {string} modelName - Name of the model to download
 * @param {function} onProgress - Callback for download progress updates
 */
export const downloadModel = async (modelName, onProgress) => {
  try {
    console.log(`Starting download of ${modelName}`);
    const response = await fetch(`${OLLAMA_ENDPOINT}/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Keep track of total size across all pulls
    let totalPullSize = 0;
    let completedPullSize = 0;
    const pulls = new Map(); // Track individual pulls

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line) continue;
        try {
          const data = JSON.parse(line);
          console.log('Received data:', data);

          if (data.status.startsWith('pulling')) {
            const digest = data.digest;
            
            // Initialize or update pull information
            if (!pulls.has(digest)) {
              pulls.set(digest, {
                total: data.total || 0,
                completed: 0
              });
              totalPullSize += data.total || 0;
            }

            // Update completed size for this pull
            if (data.completed) {
              const prevCompleted = pulls.get(digest).completed;
              const newCompleted = data.completed;
              completedPullSize += (newCompleted - prevCompleted);
              pulls.get(digest).completed = newCompleted;
            }

            // Calculate overall progress
            if (totalPullSize > 0) {
              const progress = Math.round((completedPullSize / totalPullSize) * 100);
              console.log(`Overall progress: ${progress}% (${completedPullSize}/${totalPullSize})`);
              onProgress(progress);
            }
          } else if (data.status === 'verifying sha256 digest') {
            onProgress('installing');
          } else if (data.status === 'writing manifest') {
            onProgress('installing');
          } else if (data.status === 'success') {
            onProgress('installing');
          }
        } catch (e) {
          console.error('Error parsing JSON:', e, 'Line:', line);
        }
      }
    }
  } catch (error) {
    console.error('Error downloading model:', error);
    throw error;
  }
};

/**
 * Deletes an installed model
 * @param {string} modelName - Name of the model to delete
 */
export const deleteModel = async (modelName) => {
  try {
    const response = await fetch(`${OLLAMA_ENDPOINT}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
};

/**
 * Generates a title for a conversation based on the first exchange
 * @param {string} userMessage - The first user message
 * @param {string} assistantMessage - The first assistant response
 * @param {string} model - The model to use for generation
 * @returns {Promise<string>} Generated title
 */

export const generateTitle = async (userMessage, assistantMessage) => {
  try {
    const titlePrompt = `Based on this conversation:\nHuman: ${userMessage}\nAssistant: ${assistantMessage}\n\nGenerate a very brief title (2-5 words maximum) that captures the main topic. Respond with ONLY the title, no additional text or punctuation.`;

    const response = await fetch(`${OLLAMA_ENDPOINT}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3.2:latest",
        prompt: titlePrompt,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const title = data.response.trim();
    console.log('Generated title:', title);
    return title;
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
};

/**
 * Fetches all available models and their tags from the API
 * @returns {Promise<Array>} Array of model objects with their tags
 */
export const getAvailableModels = async () => {
  try {
    const response = await fetch('https://ollamagui-bucket-4458eff47-3712-88ae-de1d.s3.us-east-1.amazonaws.com/models.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching available models:', error);
    return [];
  }
}; 