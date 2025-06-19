
'use server';
/**
 * @fileOverview A Vercel AI SDK tool for fetching text content from a given URL.
 *
 * - fetchUrlContentTool - The tool definition.
 */

import { tool } from '@ai-sdk/core';
import { z } from 'zod';

export const fetchUrlContentTool = tool({
  description: 'Fetches the main text content from a given URL. Use this to get information from a webpage if the input context looks like a URL.',
  parameters: z.object({
    url: z.string().url().describe('The URL of the webpage to fetch content from.'),
  }),
  execute: async ({ url }) => {
    try {
      console.log(`[fetchUrlContentTool] Fetching content from: ${url}`);
      const response = await fetch(url, { headers: { 'User-Agent': 'LoomStudio-Agent/1.0' } }); // Added User-Agent
      if (!response.ok) {
        console.error(`[fetchUrlContentTool] HTTP error for ${url}: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const textContent = await response.text();
      // Basic HTML stripping (very naive, for real-world use a library is better but this avoids new dependencies)
      const plainText = textContent
        .replace(/<style[^>]*>.*<\/style>/gs, ' ') // Remove style blocks
        .replace(/<script[^>]*>.*<\/script>/gs, ' ') // Remove script blocks
        .replace(/<[^>]+>/gm, ' ') // Remove all other HTML tags
        .replace(/\s+/g, ' ') // Replace multiple spaces with single
        .trim();
      console.log(`[fetchUrlContentTool] Successfully fetched and stripped content from: ${url}. Length: ${plainText.length}`);
      return { textContent: plainText, originalUrl: url };
    } catch (error: any) {
      console.error(`[fetchUrlContentTool] Error fetching URL content for ${url}:`, error);
      return { textContent: '', error: error.message || 'Failed to fetch content.', originalUrl: url };
    }
  },
});
