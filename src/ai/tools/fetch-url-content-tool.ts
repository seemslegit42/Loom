
'use server';
/**
 * @fileOverview A Genkit tool for fetching text content from a given URL.
 *
 * - fetchUrlContentTool - The Genkit tool definition.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FetchUrlContentToolInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to fetch content from.'),
});

const FetchUrlContentToolOutputSchema = z.object({
  textContent: z.string().describe('The extracted text content of the webpage.'),
  error: z.string().optional().describe('An error message if fetching failed.'),
});

export const fetchUrlContentTool = ai.defineTool(
  {
    name: 'fetchUrlContentTool',
    description: 'Fetches the main text content from a given URL. Use this to get information from a webpage.',
    inputSchema: FetchUrlContentToolInputSchema,
    outputSchema: FetchUrlContentToolOutputSchema,
  },
  async (input) => {
    try {
      const response = await fetch(input.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const textContent = await response.text();
      // Basic HTML stripping (very naive, for real-world use a library is better)
      const plainText = textContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      return { textContent: plainText };
    } catch (error: any) {
      console.error(`Error fetching URL content for ${input.url}:`, error);
      return { textContent: '', error: error.message || 'Failed to fetch content.' };
    }
  }
);
