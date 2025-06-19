
import { summarizerAgent, reviewerAgent, streamingFinalizerAgent, type AgentInput } from './agents';
import { AIStream, type AIStreamCallbacksAndOptions } from '@ai-sdk/ui-utils';

// This is a simplified "Queen" agent or orchestrator logic
// In a true swarm, this would be more dynamic and potentially an agent itself.

export async function startSimpleSwarm(topic: string, initialContent: string, streamCallbacks?: AIStreamCallbacksAndOptions) {
  console.log(`[LoomOrchestrator] Starting simple swarm for topic: "${topic}"`);
  let currentLogs: string[] = [`Orchestrator: Initiating swarm for topic "${topic}".`];

  try {
    // Step 1: Summarizer Agent
    const summarizerInput: AgentInput = { topic, context: initialContent };
    const summaryOutput = await summarizerAgent(summarizerInput);
    currentLogs = currentLogs.concat(summaryOutput.logs || []);
    if (summaryOutput.error) throw new Error(`Summarization failed: ${summaryOutput.error}`);
    console.log('[LoomOrchestrator] Summary:', summaryOutput.result);
    
    // Optional: Stream intermediate log back to client if callbacks are provided
    streamCallbacks?.onToken?.(`\n[LOG] Summarizer: ${summaryOutput.result.substring(0,100)}...\n`);


    // Step 2: Reviewer Agent
    const reviewerInput: AgentInput = { topic, context: summaryOutput.result };
    const reviewOutput = await reviewerAgent(reviewerInput);
    currentLogs = currentLogs.concat(reviewOutput.logs || []);
    if (reviewOutput.error) throw new Error(`Review failed: ${reviewOutput.error}`);
    console.log('[LoomOrchestrator] Review:', reviewOutput.result);

    // Optional: Stream intermediate log back
    streamCallbacks?.onToken?.(`\n[LOG] Reviewer: ${reviewOutput.result.substring(0,100)}...\n`);
    

    // Step 3: Finalizer Agent (Streaming)
    // The context for the finalizer is the output of the reviewer
    const finalizerInput: AgentInput = { topic, context: reviewOutput.result }; 
    
    const textStream = await streamingFinalizerAgent(finalizerInput); // This now directly returns the ReadableStream
    
    const logPrefix = currentLogs.map(log => `[LOG] ${log}`).join('\n') + '\n\n[STREAMING_OUTPUT_START]\n';
    
    if (streamCallbacks?.onStart) streamCallbacks.onStart();
    // It's tricky to inject prefix into a raw ReadableStream like this.
    // AIStream expects the stream directly.
    // For now, we'll rely on the client to potentially prepend if needed, or use onToken for initial logs.
    // A more robust solution would be a multi-part stream or a separate logging channel.
    currentLogs.forEach(log => {
        if(streamCallbacks?.onToken) streamCallbacks.onToken(`[LOG] ${log}\n`);
    });
     if(streamCallbacks?.onToken) streamCallbacks.onToken(`\n[STREAMING_OUTPUT_START]\n`);
    
    return AIStream(textStream, undefined, streamCallbacks); // Pass textStream directly

  } catch (error: any) {
    console.error('[LoomOrchestrator] Swarm Error:', error);
    currentLogs.push(`Orchestrator: Error - ${error.message}`);
    
     if (streamCallbacks?.onToken) {
      streamCallbacks.onToken(`\n[ERROR] Swarm failed: ${error.message}\n`);
    }
    if (streamCallbacks?.onCompletion) {
        streamCallbacks.onCompletion(""); 
    }
    // This error will be caught by the API route
    throw new Error(`Swarm orchestration failed: ${error.message}. Logs: ${currentLogs.join('; ')}`);
  }
}
