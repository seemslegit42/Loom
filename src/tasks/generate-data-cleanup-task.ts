'use server';
/**
 * @fileOverview A task to generate a data cleanup workflow based on natural language input (simulated).
 *
 * - generateDataCleanupTask - A function that generates a data cleanup workflow.
 * - GenerateDataCleanupInput - The input type for the generateDataCleanupTask function.
 * - GenerateDataCleanupOutput - The return type for the generateDataCleanupTask function.
 */

export interface GenerateDataCleanupInput {
  userInput: string;
}

export interface GenerateDataCleanupOutput {
  workflowDescription: string;
  promptSequence: string[];
  error?: string;
}

export async function generateDataCleanupTask(
  input: GenerateDataCleanupInput
): Promise<GenerateDataCleanupOutput> {
  console.log(`[SIMULATE_TASK] generateDataCleanupTask called with input: "${input.userInput}"`);

  // Simulate a successful response based on keywords in input
  if (input.userInput.toLowerCase().includes("error test")) {
    return {
      workflowDescription: "Error Simulation",
      promptSequence: [],
      error: "Simulated error during workflow generation as requested by 'error test'.",
    };
  }

  if (input.userInput.toLowerCase().includes("empty test")) {
    return {
      workflowDescription: "Empty Test Flow",
      promptSequence: [],
    };
  }

  // Default simulated success response
  return {
    workflowDescription: `Simulated Workflow for: ${input.userInput.substring(0, 20)}...`,
    promptSequence: [
      `Simulated Step 1 based on: "${input.userInput.substring(0, 15)}"`,
      `Simulated Step 2 related to data processing for "${input.userInput.substring(0, 15)}"`,
      `Simulated Step 3 to finalize output for "${input.userInput.substring(0, 15)}"`,
    ],
  };
}
