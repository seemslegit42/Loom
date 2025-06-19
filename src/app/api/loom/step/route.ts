
import {NextRequest, NextResponse} from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { swarmId, message, prompt } = await req.json();

    if (!swarmId) {
      return NextResponse.json({ error: 'swarmId is required to step an existing workflow.' }, { status: 400 });
    }
    if (!message && !prompt) {
      return NextResponse.json({ error: 'A message or prompt is required for the step.' }, { status: 400 });
    }

    console.log(`[API /loom/step] Received step request for swarmId: ${swarmId}. Message: "${message || prompt}"`);
    
    // Return 501 Not Implemented as this functionality is not really implemented
    return NextResponse.json({ 
      error: "Not Implemented: Stepping functionality with persistent swarm state is not yet available.",
      message: "This endpoint acknowledges the request but cannot process it further at this time.",
      swarmId,
      received: message || prompt,
    }, { status: 501 });

  } catch (error: any) {
    console.error('[API /loom/step] Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process step request due to an internal error.', details: error.message }, { status: 500 });
  }
}

