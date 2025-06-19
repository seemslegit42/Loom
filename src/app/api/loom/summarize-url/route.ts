
// src/app/api/loom/summarize-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@ai-sdk/core';
import { getGroqModel } from '@/lib/ai-tools/groq';

export const runtime = 'edge';

// Basic function to strip HTML, very naive, consider a library for production
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    // 1. Fetch content from the URL
    let pageContent: string;
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'LoomStudioBot/1.0' } }); // Basic user-agent
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && (contentType.includes('text/html') || contentType.includes('text/plain'))) {
        pageContent = await response.text();
      } else {
        // For now, only attempt to summarize text-based content
        // In a real scenario, might handle PDFs, etc., or return a more specific error
        throw new Error(`Unsupported content type: ${contentType}. Only text/html or text/plain can be summarized.`);
      }
    } catch (fetchError: any) {
      console.error(`[API /loom/summarize-url] Error fetching URL ${url}:`, fetchError);
      return NextResponse.json({ error: `Failed to fetch content from URL: ${fetchError.message}` }, { status: 500 });
    }

    // 2. Basic content cleaning (e.g., strip HTML)
    const plainTextContent = stripHtml(pageContent);
    const maxContentLengthForPrompt = 15000; // Truncate content to avoid overly long prompts for Groq
    const truncatedContent = plainTextContent.substring(0, maxContentLengthForPrompt);


    // 3. Summarize using Groq
    const groqModel = getGroqModel(); // Use default or configured Groq model
    const prompt = `Please provide a concise summary of the following web page content obtained from ${url}:\n\n---BEGIN CONTENT---\n${truncatedContent}\n---END CONTENT---\n\nSummary:`;

    const { text: summary } = await generateText({
      model: groqModel,
      prompt: prompt,
    });

    return NextResponse.json({ summary, originalUrl: url });

  } catch (error: any) {
    console.error('[API /loom/summarize-url] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to summarize URL.' }, { status: 500 });
  }
}
