
'use server';
/**
 * @fileOverview A task for executing a given prompt.
 * This task now simulates a direct backend interaction or an LLM call,
 * as the /api/chat route has been removed in favor of /api/loom/* endpoints.
 *
 * - executePromptTask - A function that handles the LLM call.
 * - ExecutePromptInput - The input type for the executePromptTask function.
 * - ExecutePromptOutput - The return type for the executePromptTask function.
 */

export interface ExecutePromptInput {
  promptText: string;
  modelName?: string; // This can be used by a backend API if needed
}

export interface ExecutePromptOutput {
  responseText?: string;
  error?: string;
}

export async function executePromptTask(input: ExecutePromptInput): Promise<ExecutePromptOutput> {
  console.log(`[TASK_SIM] executePromptTask (simulating backend). Prompt: "${input.promptText.substring(0, 50)}..." Model: ${input.modelName || 'default'}`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

  if (input.promptText.toLowerCase().includes("error test")) {
    return {
      error: "Simulated error during prompt execution (backend task) as requested by 'error test'.",
    };
  }

  if (!input.promptText.trim()) {
    return { error: "Prompt text cannot be empty (simulated backend validation)." };
  }

  // Simulate a successful response
  return {
    responseText: `Simulated LLM response (from backend task) to: "${input.promptText}". Model/Agent ID specified: ${input.modelName || 'default/not specified'}. The actual response would come from the configured backend LLM or agent via /api/loom/start or similar.`,
  };
}
