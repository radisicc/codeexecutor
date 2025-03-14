import { Daytona } from '@daytonaio/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class CodeExecutor {
  private daytona: Daytona;
  public workspace: any; // Changed to public to allow access from outside
  private supportedLanguages = ['typescript', 'javascript', 'python'];

  constructor() {
    // Initialize Daytona client
    this.daytona = new Daytona();
  }

  /**
   * Initialize a workspace with the specified language
   */
  async initializeWorkspace(language: string = 'typescript'): Promise<void> {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Language ${language} is not supported. Supported languages: ${this.supportedLanguages.join(', ')}`);
    }
    
    console.log(`Creating workspace for ${language}...`);
    this.workspace = await this.daytona.create({
      language: language,
    });
    console.log(`Workspace created with ID: ${this.workspace.id}`);
  }

  /**
   * Execute code in the workspace
   */
  async executeCode(code: string, options: any = {}): Promise<any> {
    if (!this.workspace) {
      throw new Error('Workspace not initialized. Call initializeWorkspace() first.');
    }

    try {
      console.log('Executing code...');
      const response = await this.workspace.process.codeRun(code, options);
      
      return {
        success: response.exitCode === 0,
        result: response.result,
        exitCode: response.exitCode,
      };
    } catch (error: any) {
      console.error('Error executing code:', error);
      return {
        success: false,
        result: error.message || 'An unknown error occurred',
        exitCode: 1,
      };
    }
  }

  /**
   * Clean up the workspace
   */
  async cleanup(): Promise<void> {
    if (this.workspace) {
      console.log(`Removing workspace ${this.workspace.id}...`);
      await this.daytona.remove(this.workspace);
      console.log('Workspace removed.');
      this.workspace = null;
    }
  }
}

export { CodeExecutor };