'use server';
/**
 * @fileOverview A task for executing a given prompt with an optional model (simulated call to SuperAGI/LLM backend).
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
  console.log(`[SIMULATE_TASK] executePromptTask called (simulating SuperAGI/LLM backend). Prompt: "${input.promptText}", Model/Agent: ${input.modelName || 'default'}`);
  
  if (input.promptText.toLowerCase().includes("error test")) {
      return {
          error: "Simulated error during prompt execution (SuperAGI/LLM backend) as requested by 'error test' in prompt.",
      };
  }
  
  return {
    responseText: `Simulated LLM response (from SuperAGI/LLM backend task) to: "${input.promptText}". Model/Agent specified: ${input.modelName || 'default/not specified'}. This response would typically come from the configured SuperAGI agent or LLM.`,
  };
}
