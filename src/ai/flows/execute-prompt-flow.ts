
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
    // Simulate backend call to SuperAGI/CrewAI or LLM
    console.log(`[SIMULATE] executePromptFlow called with prompt: "${input.promptText}", model: ${input.modelName || 'default'}`);
    
    // Simulate a successful response
    if (input.promptText.toLowerCase().includes("error test")) {
        return {
            error: "Simulated error during prompt execution as requested by 'error test' in prompt.",
        };
    }
    
    return {
      responseText: `Simulated LLM response to: "${input.promptText}". Model/Agent specified: ${input.modelName || 'default/not specified'}. This response would come from SuperAGI/CrewAI.`,
    };
    
    // Original Genkit call is commented out to prevent errors and align with SuperAGI/CrewAI direction.
    // try {
    //   const llmOptions: any = {
    //     prompt: input.promptText,
    //   };
    //   if (input.modelName) {
    //     llmOptions.model = input.modelName;
    //   }
      
    //   const llmResponse = await ai.generate(llmOptions);
    //   const responseText = llmResponse.text; 
      
    //   if (responseText) {
    //     return { responseText };
    //   } else {
    //     let errorMessage = "LLM returned an empty response.";
    //      if (llmResponse.candidates && llmResponse.candidates.length > 0) {
    //         const firstCandidate = llmResponse.candidates[0];
    //         if (firstCandidate.finishReason !== 'STOP' && firstCandidate.finishMessage) {
    //             errorMessage = `LLM generation incomplete: ${firstCandidate.finishMessage} (Reason: ${firstCandidate.finishReason})`;
    //         } else if (firstCandidate.blocked && firstCandidate.blockedMessage) {
    //              errorMessage = `LLM response blocked: ${firstCandidate.blockedMessage}`;
    //         }
    //       }
    //     return { error: errorMessage };
    //   }
    // } catch (e: any) {
    //   console.error('Error executing prompt flow:', e);
    //   return { error: e.message || 'An unexpected error occurred during prompt execution.' };
    // }
  }
);
