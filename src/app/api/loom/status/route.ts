
import {NextRequest, NextResponse} from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const status = {
      service: 'Loom API',
      status: 'Online', // Simplified status
      timestamp: new Date().toISOString(),
      message: 'Detailed swarm/agent status and monitoring require further backend implementation.',
      // Removed simulated activeSwarms and swarmEngine status
    };
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('[API /loom/status] Error:', error);
    return NextResponse.json({ 
      service: 'Loom API',
      status: 'Error',
      error: 'Failed to retrieve API status.', 
      message: error.message 
    }, { status: 500 });
  }
}

