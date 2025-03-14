# Daytona Code Executor

A web-based code execution environment that lets you run code in isolated sandboxes using Daytona's platform.

## Features

- Execute code in multiple languages (TypeScript, JavaScript, Python)
- Upload files to use in your code
- AI-powered code analysis, explanation, and optimization
- Secure execution in isolated sandboxes

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your API keys:

```bash
DAYTONA_API_KEY=your-daytona-api-key
DAYTONA_SERVER_URL=your-daytona-server-url
DAYTONA_TARGET=us
ANTHROPIC_API_KEY=your-anthropic-api-key
```

4. Run the server: `npm start`
5. Open http://localhost:3000 in your browser