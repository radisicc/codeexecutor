import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { CodeExecutor } from './executor';

// For Express.Multer.File type
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Add static files directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up file upload storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Create a map to store active workspaces
const workspaces = new Map();

// Initialize Anthropic client if API key is available
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
let anthropic = null;

if (anthropicApiKey) {
  anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  });
}

// Routes
app.get('/', function(req, res) {
  res.render('index', {
    supportedLanguages: ['typescript', 'javascript', 'python'],
    result: null
  });
});

app.post('/execute', upload.array('files', 5), function(req, res) {
  const { language, code, sessionId } = req.body;
  // Properly type the uploaded files
  const uploadedFiles = req.files as Express.Multer.File[] || [];
  let executor;
  let newSessionId = sessionId;

  (async function() {
    try {
      // If sessionId is provided and exists, use that executor
      if (sessionId && workspaces.has(sessionId)) {
        executor = workspaces.get(sessionId);
      } else {
        // Create a new executor and session
        executor = new CodeExecutor();
        await executor.initializeWorkspace(language);
        newSessionId = `session-${Date.now()}`;
        workspaces.set(newSessionId, executor);
      }
      
      // Upload files to the workspace if any were provided
      let uploadedFilePaths = [];
      if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileContent = fs.readFileSync(file.path);
          const remotePath = `/workspace/${file.originalname}`;
          
          // Upload the file to the Daytona workspace
          await executor.workspace.fs.uploadFile(remotePath, Buffer.from(fileContent));
          uploadedFilePaths.push(remotePath);
        }
      }
      
      // Execute the code
      const result = await executor.executeCode(code);
      
      res.render('index', {
        supportedLanguages: ['typescript', 'javascript', 'python'],
        code,
        language,
        result,
        sessionId: newSessionId,
        uploadedFiles: uploadedFilePaths
      });
    } catch (error: any) {
      res.render('index', {
        supportedLanguages: ['typescript', 'javascript', 'python'],
        code,
        language,
        result: {
          success: false,
          result: `Error: ${error.message || 'Unknown error occurred'}`,
          exitCode: 1
        },
        sessionId: newSessionId,
        uploadedFiles: []
      });
    }
  })();
});

app.post('/analyze-code', function(req, res) {
  const { code, language, action } = req.body;
  
  (async function() {
    if (!anthropic) {
      return res.json({
        success: false,
        message: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in your .env file.'
      });
    }
    
    try {
      let prompt = '';
      
      if (action === 'optimize') {
        prompt = `You are an expert ${language} developer. Optimize the following code while maintaining its functionality. Focus on performance, readability, and best practices. Return only the optimized code without explanations.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;
      } else if (action === 'explain') {
        prompt = `You are an expert ${language} developer. Explain the following code in detail, focusing on what it does, how it works, and any potential issues or improvements. Be thorough but concise.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;
      } else if (action === 'review') {
        prompt = `You are an expert ${language} developer conducting a code review. Identify potential bugs, security issues, performance problems, and areas for improvement in the following code. Provide specific recommendations.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;
      }
      
      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      
      // Extract the text content properly based on the content type
      let responseText = '';
      if (message.content && message.content.length > 0) {
        const content = message.content[0];
        if (content.type === 'text') {
          responseText = content.text;
        }
      }
      
      res.json({
        success: true,
        result: responseText
      });
    } catch (error: any) {
      console.error('Anthropic API error:', error);
      res.json({
        success: false,
        message: `Error analyzing code: ${error.message || 'Unknown error occurred'}`
      });
    }
  })();
});

app.post('/cleanup', function(req, res) {
  const { sessionId } = req.body;
  
  (async function() {
    if (sessionId && workspaces.has(sessionId)) {
      const executor = workspaces.get(sessionId);
      await executor.cleanup();
      workspaces.delete(sessionId);
      res.json({ success: true, message: 'Workspace cleaned up successfully' });
    } else {
      res.json({ success: false, message: 'No workspace found with that session ID' });
    }
  })();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export {};