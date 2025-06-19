
// src/app/api/loom/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@ai-sdk/core';
import { getGroqModel } from '@/lib/ai-tools/groq';

export const runtime = 'edge'; // Prefer edge runtime for API routes

async function fetchAndCleanText(url: string): Promise<{ textContent: string; error?: string }> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'LoomStudioBot/1.0' } }); // Add User-Agent
    if (!response.ok) {
      return { textContent: '', error: `HTTP error! status: ${response.status} for ${url}` };
    }
    const htmlContent = await response.text();
    // Basic HTML stripping (very naive, for real-world use a library is better)
    const plainText = htmlContent
      .replace(/<style[^>]*>.*<\/style>/gs, ' ') // Remove style blocks
      .replace(/<script[^>]*>.*<\/script>/gs, ' ') // Remove script blocks
      .replace(/<[^>]*>?/gm, ' ') // Remove all other tags
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
    return { textContent: plainText };
  } catch (error: any) {
    console.error(`Error fetching URL content for ${url}:`, error);
    return { textContent: '', error: error.message || `Failed to fetch content from ${url}.` };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string.', originalUrl: url || '' }, { status: 400 });
    }

    const { textContent, error: fetchError } = await fetchAndCleanText(url);

    if (fetchError) {
      console.error(`[API /loom/summarize] Fetch Error for ${url}: ${fetchError}`);
      return NextResponse.json({ error: fetchError, originalUrl: url }, { status: 500 });
    }

    if (!textContent.trim()) {
        return NextResponse.json({ error: 'Could not extract meaningful text content from the URL.', originalUrl: url }, { status: 422 }); // Unprocessable Entity
    }

    const groqModel = getGroqModel(); // Use default or configured Groq model

    const prompt = `Please provide a concise summary of the following text extracted from the webpage ${url}:\n\n"${textContent.substring(0, 15000)}"`; // Limit input length

    const { text: summaryText } = await generateText({
      model: groqModel,
      prompt: prompt,
    });
    
    console.log(`[API /loom/summarize] Successfully summarized URL: ${url}`);
    return NextResponse.json({ summary: summaryText, originalUrl: url });

  } catch (error: any) {
    console.error('[API /loom/summarize] Error:', error);
    const errorMessage = error.message || 'Failed to process summarization request.';
    return NextResponse.json({ error: errorMessage, originalUrl: (await req.json().catch(() => ({})))?.url || '' }, { status: 500 });
  }
}
