
'use server';
/**
 * @fileOverview A task for executing a given prompt with an optional model (simulated call to a backend LLM or agent).
 *
 * - executePromptTask - A function that handles the simulated LLM call.
 * - ExecutePromptInput - The input type for the executePromptTask function.
 * - ExecutePromptOutput - The return type for the executePromptTask function.
 */

export interface ExecutePromptInput {
  promptText: string;
  modelName?: string; // Can be a model name or a specific agent ID for the backend
}

export interface ExecutePromptOutput {
  responseText?: string;
  error?: string;
}

export async function executePromptTask(input: ExecutePromptInput): Promise<ExecutePromptOutput> {
  // Simulate backend call to an LLM or a specific agent
  console.log(`[TASK_SIM] executePromptTask called (simulating backend LLM/agent). Prompt: "${input.promptText}", Model/Agent ID: ${input.modelName || 'default'}`);

  if (input.promptText.toLowerCase().includes("error test")) {
      return {
          error: "Simulated error during prompt execution (backend task) as requested by 'error test' in prompt.",
      };
  }

  return {
    responseText: `Simulated LLM response (from backend task) to: "${input.promptText}". Model/Agent ID specified: ${input.modelName || 'default/not specified'}. This response would typically come from the configured backend LLM or agent.`,
  };
}

