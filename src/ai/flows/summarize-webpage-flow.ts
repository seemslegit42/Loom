
'use server';
/**
 * @fileOverview A Genkit flow for summarizing the content of a webpage.
 *
 * - summarizeWebpage - A function that handles the webpage summarization.
 * - SummarizeWebpageInput - The input type for the summarizeWebpage function.
 * - SummarizeWebpageOutput - The return type for the summarizeWebpage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchUrlContentTool } from '@/ai/tools/fetch-url-content-tool';

const SummarizeWebpageInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to summarize.'),
});
export type SummarizeWebpageInput = z.infer<typeof SummarizeWebpageInputSchema>;

const SummarizeWebpageOutputSchema = z.object({
  summary: z.string().describe('The summarized content of the webpage.'),
  originalUrl: z.string().url().describe('The original URL that was summarized.'),
  error: z.string().optional().describe('An error message if summarization failed or content could not be fetched.'),
});
export type SummarizeWebpageOutput = z.infer<typeof SummarizeWebpageOutputSchema>;

export async function summarizeWebpage(input: SummarizeWebpageInput): Promise<SummarizeWebpageOutput> {
  return summarizeWebpageFlow(input);
}

const summarizePrompt = ai.definePrompt({
  name: 'summarizeWebpagePrompt',
  input: { schema: SummarizeWebpageInputSchema },
  output: { schema: SummarizeWebpageOutputSchema },
  tools: [fetchUrlContentTool],
  prompt: `You are a helpful AI assistant that summarizes webpages.
  1. Use the 'fetchUrlContentTool' to get the text content of the webpage at the given URL: {{{url}}}.
  2. If the tool returns an error or empty content, set the 'error' field in your output and provide a brief explanation. Do not attempt to summarize and ensure the 'summary' field is an empty string.
  3. If you receive content, provide a concise summary of the text.
  4. Ensure your output includes the original URL and the summary.
  `,
  // Example of how to set safety settings if needed, though often default is fine
  // config: {
  //   safetySettings: [
  //     {
  //       category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  //       threshold: 'BLOCK_NONE',
  //     },
  //   ],
  // },
});

const summarizeWebpageFlow = ai.defineFlow(
  {
    name: 'summarizeWebpageFlow',
    inputSchema: SummarizeWebpageInputSchema,
    outputSchema: SummarizeWebpageOutputSchema,
  },
  async (input) => {
    const llmResponse = await summarizePrompt(input);
    const output = llmResponse.output();

    if (!output) {
      // This case might happen if the LLM fails to adhere to the output schema or if there's a major processing error.
      // Or if the LLM response itself is blocked by safety settings.
      let errorMessage = "Failed to generate summary. The LLM did not produce valid output.";
      if (llmResponse.candidates && llmResponse.candidates.length > 0) {
        const firstCandidate = llmResponse.candidates[0];
        if (firstCandidate.finishReason !== 'STOP' && firstCandidate.finishMessage) {
            errorMessage = `LLM generation incomplete: ${firstCandidate.finishMessage} (Reason: ${firstCandidate.finishReason})`;
        } else if (firstCandidate.blocked && firstCandidate.blockedMessage) {
             errorMessage = `LLM response blocked by safety settings or other policy: ${firstCandidate.blockedMessage}`;
        }
      }
      return {
        summary: '',
        originalUrl: input.url,
        error: errorMessage,
      };
    }
    
    // If the tool call itself returned an error that the LLM decided to put in the 'error' field based on prompt instructions
    if (output.error) {
        return {
            summary: '', // Ensure summary is empty as per prompt instruction
            originalUrl: input.url,
            error: output.error,
        };
    }

    // Check if the summary is empty even if no explicit error was set by the LLM.
    // This can happen if the webpage had no summarizable content, or the LLM decided not to summarize.
    if (!output.summary && !output.error) {
        return {
            summary: '',
            originalUrl: input.url,
            error: 'The webpage might have no summarizable content, or the AI chose not to summarize.',
        };
    }
    
    return output; // Contains summary and originalUrl, error will be undefined if all went well.
  }
);

