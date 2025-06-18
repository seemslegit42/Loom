
'use server';
/**
 * @fileOverview A task for executing a given prompt with an optional model (simulated).
 *
 * - executePromptTask - A function that handles the simulated LLM call.
 * - ExecutePromptInput - The input type for the executePromptTask function.
 * - ExecutePromptOutput - The return type for the executePromptTask function.
 */

import { z } from 'zod';

const ExecutePromptInputSchema = z.object({
  promptText: z.string().min(1, { message: 'Prompt text cannot be empty.' }).describe('The text prompt to send to the LLM.'),
  modelName: z.string().optional().describe('The specific model name to use (e.g., "googleai/gemini-pro"). If not provided, the default model will be used.'),
});
export type ExecutePromptInput = z.infer<typeof ExecutePromptInputSchema>;

const ExecutePromptOutputSchema = z.object({
  responseText: z.string().optional().describe('The text response from the LLM.'),
  error: z.string().optional().describe('An error message if the execution failed.'),
});
export type ExecutePromptOutput = z.infer<typeof ExecutePromptOutputSchema>;

export async function executePromptTask(input: ExecutePromptInput): Promise<ExecutePromptOutput> {
  // Validate input against the schema if desired, though Next.js doesn't enforce this for server actions directly
  // const validationResult = ExecutePromptInputSchema.safeParse(input);
  // if (!validationResult.success) {
  //   return { error: validationResult.error.flatten().fieldErrors.toString() };
  // }

  // Simulate backend call to SuperAGI/CrewAI or LLM
  console.log(`[SIMULATE_TASK] executePromptTask called with prompt: "${input.promptText}", model: ${input.modelName || 'default'}`);
  
  // Simulate a successful response
  if (input.promptText.toLowerCase().includes("error test")) {
      return {
          error: "Simulated error during prompt execution as requested by 'error test' in prompt.",
      };
  }
  
  return {
    responseText: `Simulated LLM response (from task) to: "${input.promptText}". Model/Agent specified: ${input.modelName || 'default/not specified'}. This response would come from SuperAGI/CrewAI.`,
  };
}
