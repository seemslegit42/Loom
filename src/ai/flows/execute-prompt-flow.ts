
'use server';
/**
 * @fileOverview A Genkit flow for executing a given prompt with an optional model.
 *
 * - executePrompt - A function that handles the LLM call.
 * - ExecutePromptInput - The input type for the executePrompt function.
 * - ExecutePromptOutput - The return type for the executePrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

export async function executePrompt(input: ExecutePromptInput): Promise<ExecutePromptOutput> {
  return executePromptFlow(input);
}

const executePromptFlow = ai.defineFlow(
  {
    name: 'executePromptFlow',
    inputSchema: ExecutePromptInputSchema,
    outputSchema: ExecutePromptOutputSchema,
  },
  async (input) => {
    try {
      const llmResponse = await ai.generate({
        prompt: input.promptText,
        model: input.modelName || ai.config.model, // Use specified model or default from ai config
      });
      const responseText = llmResponse.text; // Use .text as per Genkit v1.x
      
      if (responseText) {
        return { responseText };
      } else {
        // This case can happen if the LLM response is empty or if there was a different kind of issue
        // not caught by the safety settings or other explicit errors during generation.
        let errorMessage = "LLM returned an empty response.";
         if (llmResponse.candidates && llmResponse.candidates.length > 0) {
            const firstCandidate = llmResponse.candidates[0];
            if (firstCandidate.finishReason !== 'STOP' && firstCandidate.finishMessage) {
                errorMessage = `LLM generation incomplete: ${firstCandidate.finishMessage} (Reason: ${firstCandidate.finishReason})`;
            } else if (firstCandidate.blocked && firstCandidate.blockedMessage) {
                 errorMessage = `LLM response blocked: ${firstCandidate.blockedMessage}`;
            }
          }
        return { error: errorMessage };
      }
    } catch (e: any) {
      console.error('Error executing prompt flow:', e);
      return { error: e.message || 'An unexpected error occurred during prompt execution.' };
    }
  }
);

