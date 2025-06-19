'use server';
/**
 * @fileOverview A tool for fetching the plain text content of a given URL.
 */
import { tool } from '@ai-sdk/core';
import { z } from 'zod';

// Naive HTML stripper
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

export const fetchUrlTool = tool({
  name: 'fetchUrlContent',
  description: 'Fetches the main plain text content from a given web URL. Use this to get information from a webpage before summarizing or analyzing it.',
  parameters: z.object({
    url: z.string().url().describe('The URL of the webpage to fetch content from.'),
  }),
  execute: async ({ url }) => {
    try {
      console.log(`[fetchUrlTool] Attempting to fetch content from: ${url}`);
      const response = await fetch(url, { headers: { 'User-Agent': 'LoomStudioBot/1.0' } });
      if (!response.ok) {
        console.error(`[fetchUrlTool] HTTP error! status: ${response.status} for URL: ${url}`);
        throw new Error(`HTTP error ${response.status} while fetching the URL.`);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain')) {
        console.warn(`[fetchUrlTool] Content type for ${url} is ${contentType}, may not be ideal for text extraction.`);
      }
      const rawHtml = await response.text();
      const textContent = stripHtml(rawHtml);
      console.log(`[fetchUrlTool] Successfully fetched and stripped HTML from ${url}. Content length: ${textContent.length}`);
      return { success: true, textContent, originalUrl: url };
    } catch (error: any) {
      console.error(`[fetchUrlTool] Error fetching or processing URL ${url}:`, error);
      return { success: false, error: error.message || 'Failed to fetch or process content from URL.', textContent: null, originalUrl: url };
    }
  },
});
