# Ollama Chat Desktop

A modern, cross-platform desktop application for interacting with Ollama's AI models. Built with Electron and React, this application provides a clean, intuitive interface for AI conversations with support for multiple models and conversations.

## Features

- 🤖 Support for all Ollama models
- 💬 Multiple conversation management
- 🔄 Real-time message streaming
- 🎨 Clean, modern interface
- 🔍 Conversation search functionality
- ⚡ Model switching mid-conversation
- 🛑 Generation interruption
- 💾 Automatic conversation saving
- 📱 Responsive design
- 🌗 Dark mode interface

## Screenshots

(upcoming)

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- [Ollama](https://ollama.ai) installed and running
- At least one Ollama model pulled (e.g., `ollama pull llama3.2:latest`)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sufianetaouil/ollama-chat-desktop.git
cd ollama-gui
```

2. Install dependencies:
```bash
npm install
```

3. Start Ollama in the background:
```bash
ollama serve
```

4. Start the development server:
```bash
npm start
```

## Building

To create a production build:

```bash
# For your current platform
npm run build

# For specific platforms
npm run build:win
npm run build:mac
npm run build:linux
```

The built application will be available in the `dist` directory.

## Usage

1. Launch the application
2. Ensure Ollama is running (`ollama serve`)
3. Start a new conversation using the '+' button
4. Select your preferred model using the settings icon
5. Type your message and press Enter to send
6. Use the stop button (red square) to interrupt generation
7. Search conversations using the search bar
8. Delete conversations using the trash icon

## Future Plans

- [ ] Conversation export/import
- [ ] Markdown support in messages
- [ ] Code syntax highlighting
- [ ] System prompt templates
- [ ] Conversation categories/folders
- [ ] Voice input/output
- [ ] Custom themes
- [ ] Keyboard shortcuts
- [ ] Context length management
- [ ] Chat history analytics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ollama](https://ollama.ai) for providing the AI backend
- [Electron](https://www.electronjs.org/) for the desktop framework
- [React](https://reactjs.org/) for the UI framework
- [Screenshot-to-code](https://github.com/abi/screenshot-to-code) for the screenshot to code feature
- All contributors and users of this project

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
```
