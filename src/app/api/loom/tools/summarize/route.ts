
// src/app/api/loom/tools/summarize/route.ts
import {NextRequest, NextResponse} from 'next/server';
import { streamText } from '@ai-sdk/core';
import { getGroqModel } from '@/lib/ai-tools/groq';
import { toDataStreamResponse, type AIStreamCallbacksAndOptions } from '@ai-sdk/ui-utils';

export const runtime = 'edge'; // Prefer edge runtime for streaming APIs

// Basic HTML stripping function (naive, consider a library for production)
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    let textContent = '';
    try {
      const fetchResponse = await fetch(url, { headers: { 'User-Agent': 'LoomStudioSummarizer/1.0' }});
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch URL: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      const htmlContent = await fetchResponse.text();
      textContent = stripHtml(htmlContent);
      if (!textContent.trim()) {
        throw new Error('No text content found on the page after stripping HTML.');
      }
    } catch (fetchError: any) {
      console.error(`[API /loom/tools/summarize] Fetch error for ${url}:`, fetchError);
      return NextResponse.json({ error: `Failed to retrieve content from URL: ${fetchError.message}` }, { status: 500 });
    }
    
    const groqModel = getGroqModel(); // Gets model, respecting environment or fallback

    const streamCallbacks: AIStreamCallbacksAndOptions = {
      onStart: async () => {
        console.log(`[API /loom/tools/summarize] Stream started for URL summary: "${url}"`);
      },
      onCompletion: async (completion) => {
        console.log(`[API /loom/tools/summarize] Stream completed for URL summary: "${url}"`);
      },
      onFinal: async (completion) => {
         console.log(`[API /loom/tools/summarize] Stream finalized for URL summary: "${url}"`);
      }
    };
    
    const { textStream } = await streamText({
      model: groqModel,
      prompt: `Please provide a concise summary of the following text extracted from the webpage ${url}:\n\n---\n${textContent.substring(0, 15000)}\n---\n\nSummary:`, // Limit context window
    });
    
    return toDataStreamResponse(textStream, streamCallbacks);

  } catch (error: any) {
    console.error('[API /loom/tools/summarize] Error:', error);
    const errorMessage = error.message || 'Failed to process summarization request.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
