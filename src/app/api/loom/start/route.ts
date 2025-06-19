
import {NextRequest, NextResponse} from 'next/server';
import { startSimpleSwarm } from '@/lib/loom/orchestrator';
import { toDataStreamResponse, type AIStreamCallbacksAndOptions } from '@ai-sdk/ui-utils';

export const runtime = 'edge'; // Prefer edge runtime for streaming APIs

export async function POST(req: NextRequest) {
  try {
    const { topic, initialContent, prompt } = await req.json();

    if (!topic && !initialContent && !prompt) {
      return NextResponse.json(
        { error: 'Either "topic" and "initialContent", or "prompt" must be provided.' },
        { status: 400 },
      );
    }
    
    const currentTopic = topic || prompt;
    // Ensure initialContent has a fallback if only prompt is given, or if topic is given but initialContent is not.
    const currentInitialContent = initialContent || prompt || "Please process this request based on the topic.";


    const streamCallbacks: AIStreamCallbacksAndOptions = {
      onStart: async () => {
        console.log('[API /loom/start] Stream started via orchestrator.');
      },
      onToken: async (token) => {
        // console.log('[API /loom/start] Token received:', token); // Can be too verbose
      },
      onCompletion: async (completion) => {
        console.log('[API /loom/start] Stream completed.');
      },
      onFinal: async (completion) => {
        console.log('[API /loom/start] Stream finalized.');
      }
    };

    // startSimpleSwarm now returns an AIStream-compatible object
    const aiStream = await startSimpleSwarm(currentTopic, currentInitialContent, streamCallbacks);
    
    // Use toDataStreamResponse to correctly handle the AIStream for the client
    return toDataStreamResponse(aiStream);

  } catch (error: any) {
    console.error('[API /loom/start] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to start Loom swarm.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

