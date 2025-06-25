
'use server';
/**
 * @fileOverview A Vercel AI SDK tool for fetching text content from a given URL.
 */

import { tool } from 'ai';
import { z } from 'zod'; // Using zod from 'zod' as ai-sdk doesn't re-export it.

const FetchWebpageToolInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to fetch content from.'),
});

const FetchWebpageToolOutputSchema = z.object({
  textContent: z.string().describe('The extracted text content of the webpage.'),
  error: z.string().optional().describe('An error message if fetching failed.'),
  originalUrl: z.string().url().describe('The original URL that was fetched.')
});

export const fetchWebpageContentTool = tool({
  description: 'Fetches the main text content from a given URL. Use this to get information from a webpage for summarization or analysis.',
  parameters: FetchWebpageToolInputSchema,
  execute: async ({ url }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Attempt to get more specific error message from response if possible
        let errorText = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.text(); // Or .json() if API returns structured errors
            errorText += ` - ${errorData.substring(0, 200)}`; // Limit error length
        } catch (e) { /* ignore if can't read body */ }
        throw new Error(errorText);
      }
      const htmlContent = await response.text();
      // Very naive HTML stripping. For robust parsing, a library like cheerio (server-side) would be better.
      // This basic version might be insufficient for complex pages.
      const plainText = htmlContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ') // Remove style tags and content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ') // Remove script tags and content
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ') // Remove nav tags
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ') // Remove header tags
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ') // Remove footer tags
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, ' ') // Remove aside tags
        .replace(/<[^>]+>/gm, ' ') // Strip all other tags
        .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
        .trim();

      if (!plainText) {
        return { textContent: '', error: 'Extracted text content was empty. The page might be JavaScript-heavy or have no significant text.', originalUrl: url };
      }
      return { textContent: plainText, originalUrl: url };
    } catch (error: any) {
      console.error(`Error fetching URL content for ${url}:`, error);
      return { textContent: '', error: error.message || 'Failed to fetch content due to an unexpected error.', originalUrl: url };
    }
  },
  // Optional: schema for the output if you want to enforce it stringently, 
  // but execute already returns a compatible structure.
  // output: FetchWebpageToolOutputSchema, 
});
