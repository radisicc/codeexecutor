import { Daytona } from '@daytonaio/sdk';
import * as dotenv from 'dotenv';

// Load environment variables   
dotenv.config();

async function testDaytona() {

  try {
    console.log('Initializing Daytona client...');
    const daytona = new Daytona();
    
    console.log('Creating workspace...');
    const workspace = await daytona.create({
      language: 'typescript',
    });
    
    console.log(`Workspace created with ID: ${workspace.id}`);
    
    console.log('Executing simple code...');
    const response = await workspace.process.codeRun('console.log("Hello from Daytona!");');
    
    console.log('Execution result:');
    console.log(response.result);
    
    console.log('Cleaning up workspace...');
    //await daytona.remove(workspace);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testDaytona();