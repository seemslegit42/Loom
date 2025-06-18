'use server';
/**
 * @fileOverview A task for executing a given prompt with an optional model (simulated).
 *
 * - executePromptTask - A function that handles the simulated LLM call.
 * - ExecutePromptInput - The input type for the executePromptTask function.
 * - ExecutePromptOutput - The return type for the executePromptTask function.
 */

export interface ExecutePromptInput {
  promptText: string;
  modelName?: string;
}

export interface ExecutePromptOutput {
  responseText?: string;
  error?: string;
}

export async function executePromptTask(input: ExecutePromptInput): Promise<ExecutePromptOutput> {
  // Simulate backend call to SuperAGI/CrewAI or LLM
  console.log(`[SIMULATE_TASK] executePromptTask called with prompt: "${input.promptText}", model: ${input.modelName || 'default'}`);
  
  if (input.promptText.toLowerCase().includes("error test")) {
      return {
          error: "Simulated error during prompt execution as requested by 'error test' in prompt.",
      };
  }
  
  return {
    responseText: `Simulated LLM response (from task) to: "${input.promptText}". Model/Agent specified: ${input.modelName || 'default/not specified'}. This response would come from SuperAGI/CrewAI.`,
  };
}
