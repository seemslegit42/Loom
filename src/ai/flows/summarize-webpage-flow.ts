'use server';
/**
 * @fileOverview A Genkit flow for summarizing webpage content.
 *
 * - summarizeWebpage - A function that handles the webpage summarization process.
 * - SummarizeWebpageInput - The input type for the summarizeWebpage function.
 * - SummarizeWebpageOutput - The return type for the summarizeWebpage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define input schema
const SummarizeWebpageInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to summarize.'),
});
export type SummarizeWebpageInput = z.infer<typeof SummarizeWebpageInputSchema>;

// Define output schema
const SummarizeWebpageOutputSchema = z.object({
  summary: z.string().describe('The generated summary of the webpage content.'),
  originalUrl: z.string().url().describe('The original URL that was summarized.'),
  error: z.string().optional().describe('An error message if summarization failed.'),
});
export type SummarizeWebpageOutput = z.infer<typeof SummarizeWebpageOutputSchema>;

// Exported wrapper function
export async function summarizeWebpage(input: SummarizeWebpageInput): Promise<SummarizeWebpageOutput> {
  return summarizeWebpageFlow(input);
}

const summarizationPrompt = ai.definePrompt({
  name: 'summarizeWebpagePrompt',
  input: { schema: z.object({ textContent: z.string(), originalUrl: z.string().url() }) },
  output: { schema: SummarizeWebpageOutputSchema.pick({ summary: true }).merge(z.object({ originalUrl: z.string().url() })) },
  prompt: `Please provide a concise summary of the following web content from the URL {{{originalUrl}}}:

Content:
{{{textContent}}}

Summary:`,
});

const summarizeWebpageFlow = ai.defineFlow(
  {
    name: 'summarizeWebpageFlow',
    inputSchema: SummarizeWebpageInputSchema,
    outputSchema: SummarizeWebpageOutputSchema,
  },
  async (input) => {
    try {
      const response = await fetch(input.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for URL: ${input.url}`);
      }
      let textContent = await response.text();
      
      // Basic HTML stripping
      textContent = textContent.replace(/<style[^>]*>.*<\/style>/gs, '') 
                               .replace(/<script[^>]*>.*<\/script>/gs, '')
                               .replace(/<nav[^>]*>.*<\/nav>/gis, '') // Remove nav sections
                               .replace(/<footer[^>]*>.*<\/footer>/gis, '') // Remove footer sections
                               .replace(/<header[^>]*>.*<\/header>/gis, '') // Remove header sections
                               .replace(/<aside[^>]*>.*<\/aside>/gis, '') // Remove aside sections
                               .replace(/<[^>]*>?/gm, ' ') 
                               .replace(/\s+/g, ' ') 
                               .trim();

      if (!textContent) {
        return { summary: "Could not extract meaningful content from the page.", originalUrl: input.url, error: "No meaningful content found after stripping HTML." };
      }

      const maxContentLength = 15000; // Increased slightly for potentially richer summaries
      if (textContent.length > maxContentLength) {
        textContent = textContent.substring(0, maxContentLength) + "... (content truncated)";
      }

      const llmResponse = await summarizationPrompt({ textContent, originalUrl: input.url });
      
      if (!llmResponse.output || !llmResponse.output.summary) {
        return { summary: "", originalUrl: input.url, error: "Failed to generate summary from LLM." };
      }
      // Ensure the final output adheres to SummarizeWebpageOutputSchema
      return { summary: llmResponse.output.summary, originalUrl: input.url };

    } catch (error: any) {
      console.error(`Error in summarizeWebpageFlow for ${input.url}:`, error);
      return { summary: "", originalUrl: input.url, error: error.message || 'Failed to summarize webpage.' };
    }
  }
);
