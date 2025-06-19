
// src/app/api/loom/direct/route.ts
import {NextRequest, NextResponse} from 'next/server';
import { streamText } from '@ai-sdk/core';
import { getGroqModel } from '@/lib/ai-tools/groq';
import { toDataStreamResponse, type AIStreamCallbacksAndOptions } from '@ai-sdk/ui-utils';

export const runtime = 'edge'; // Prefer edge runtime for streaming APIs

export async function POST(req: NextRequest) {
  try {
    const { prompt, modelName } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 },
      );
    }
    
    const groqModel = getGroqModel(modelName); // Gets model, respecting environment or fallback

    const streamCallbacks: AIStreamCallbacksAndOptions = {
      onStart: async () => {
        console.log(`[API /loom/direct] Stream started for prompt: "${prompt.substring(0,30)}..."`);
      },
      onCompletion: async (completion) => {
        console.log(`[API /loom/direct] Stream completed for prompt: "${prompt.substring(0,30)}..."`);
      },
      onFinal: async (completion) => {
         console.log(`[API /loom/direct] Stream finalized for prompt: "${prompt.substring(0,30)}..."`);
      }
    };
    
    const { textStream } = await streamText({
      model: groqModel,
      prompt: prompt,
    });
    
    return toDataStreamResponse(textStream, streamCallbacks);

  } catch (error: any) {
    console.error('[API /loom/direct] Error:', error);
    const errorMessage = error.message || 'Failed to process direct prompt.';
     // Return a non-streaming error response
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
