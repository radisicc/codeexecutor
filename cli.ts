import { CodeExecutor } from './executor';
import * as readline from 'readline';

// Create readline interface for CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create our code executor
const executor = new CodeExecutor();

/**
 * Prompt the user for input
 */
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Main function to run the CLI
 */
async function main() {
  try {
    console.log('Welcome to Daytona Code Executor!');
    
    // Ask for language
    const language = await prompt(
      'Which language would you like to use? (typescript, javascript, python): '
    );
    
    // Initialize workspace
    await executor.initializeWorkspace(language.toLowerCase());
    
    console.log('\nEnter your code below. Type "exit" on a new line to execute:');
    
    let codeLines: string[] = [];
    let line: string;
    
    // Collect code until user types "exit"
    while (true) {
      line = await prompt('> ');
      if (line.toLowerCase() === 'exit') break;
      codeLines.push(line);
    }
    
    const code = codeLines.join('\n');
    
    // Execute the code
    const result = await executor.executeCode(code);
    
    // Display results
    console.log('\n--- Execution Result ---');
    console.log('Success:', result.success);
    console.log('Exit Code:', result.exitCode);
    console.log('Output:');
    console.log(result.result);
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    // Clean up
    await executor.cleanup();
    rl.close();
  }
}

// Run the CLI
main();