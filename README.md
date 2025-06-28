# AI Text Editor with BYOK (Bring Your Own Key)

A modern text editor with integrated AI chat functionality using a Bring Your Own Key (BYOK) system for secure API key management.

## Features

- **Secure BYOK System**: Your API keys are stored securely in HTTP-only cookies
- **Real-time AI Chat**: Stream responses from OpenAI's GPT models
- **Modern UI**: Built with Next.js 15, TypeScript, and Tailwind CSS
- **Error Handling**: Graceful error handling with user-friendly messages
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- An OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-text-editor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Setting Up Your API Key

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click on the chat panel in the application
3. Enter your API key in the setup form
4. Click "Save" to securely store your key
5. Start chatting with the AI assistant!

### Security Features

- **HTTP-only Cookies**: API keys are stored in secure, HTTP-only cookies
- **No Server Storage**: Your keys are never stored on the server
- **Automatic Cleanup**: Keys can be cleared at any time
- **CORS Protection**: Built-in protection against cross-origin attacks

## API Endpoints

- `POST /api/set-key` - Store API key in secure cookie
- `GET /api/key-check` - Check if API key exists
- `POST /api/clear-key` - Clear stored API key
- `POST /api/chat` - Stream chat responses from LLM

## Error Handling

The application includes comprehensive error handling for:

- Invalid API keys
- Network connectivity issues
- Rate limiting
- Service unavailability
- Malformed requests

## Development

### Project Structure

```
├── app/
│   ├── api/           # API routes
│   ├── components/    # App-specific components
│   └── page.tsx       # Main page
├── components/
│   ├── ui/           # Reusable UI components
│   ├── LLMPane.tsx   # Chat interface
│   ├── EditorPane.tsx # Text editor
│   └── KeyInput.tsx  # API key input
└── lib/
    └── llm/          # LLM provider implementations
```

### Adding New LLM Providers

1. Create a new provider in `lib/llm/providers/`
2. Implement the `LLMProvider` interface
3. Register the provider in `lib/llm/registry.ts`

## License

MIT License - see LICENSE file for details
