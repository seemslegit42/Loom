
import {NextRequest, NextResponse} from 'next/server';
import { startGenericPromptSwarm, startWebSummarizationSwarm } from '@/lib/loom/orchestrator';
import { toDataStreamResponse, type AIStreamCallbacksAndOptions } from '@ai-sdk/ui-utils';

export const runtime = 'edge'; // Prefer edge runtime for streaming APIs

export async function POST(req: NextRequest) {
  try {
    const { workflowType, inputData, prompt } = await req.json();

    // Fallback for older requests that might only send `prompt`
    if (!workflowType && prompt) {
      const streamCallbacks: AIStreamCallbacksAndOptions = {
        onStart: async () => console.log('[API /loom/start] Generic prompt stream started (legacy path).'),
        onCompletion: async () => console.log('[API /loom/start] Generic prompt stream completed (legacy path).'),
        onFinal: async () => console.log('[API /loom/start] Generic prompt stream finalized (legacy path).'),
      };
      const aiStream = await startGenericPromptSwarm(prompt, prompt, streamCallbacks);
      return toDataStreamResponse(aiStream);
    }

    if (!workflowType || !inputData) {
      return NextResponse.json(
        { error: '"workflowType" and "inputData" must be provided.' },
        { status: 400 },
      );
    }
    
    const streamCallbacks: AIStreamCallbacksAndOptions = {
      onStart: async () => {
        console.log(`[API /loom/start] Stream started for workflow: ${workflowType}.`);
      },
      onCompletion: async () => {
        console.log(`[API /loom/start] Stream completed for workflow: ${workflowType}.`);
      },
      onFinal: async () => {
         console.log(`[API /loom/start] Stream finalized for workflow: ${workflowType}.`);
      }
    };

    let aiStream;

    switch (workflowType) {
      case 'genericPrompt':
        if (typeof inputData !== 'string') {
          return NextResponse.json({ error: 'For "genericPrompt", inputData must be a string.' }, { status: 400 });
        }
        aiStream = await startGenericPromptSwarm(inputData, inputData, streamCallbacks);
        break;
      case 'webSummarization':
        if (typeof inputData !== 'object' || !inputData.url || typeof inputData.url !== 'string') {
          return NextResponse.json({ error: 'For "webSummarization", inputData must be an object with a "url" string property.' }, { status: 400 });
        }
        aiStream = await startWebSummarizationSwarm(inputData.url, streamCallbacks);
        break;
      default:
        return NextResponse.json({ error: `Unsupported workflowType: ${workflowType}` }, { status: 400 });
    }
    
    return toDataStreamResponse(aiStream);

  } catch (error: any) {
    console.error('[API /loom/start] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to start Loom swarm.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
