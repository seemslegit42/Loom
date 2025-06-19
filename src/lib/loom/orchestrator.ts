
import { summarizerAgent, reviewerAgent, streamingFinalizerAgent, type AgentInput } from './agents';
import { AIStream, type AIStreamCallbacksAndOptions } from '@ai-sdk/ui-utils';

// This is a simplified "Queen" agent or orchestrator logic

export async function startSimpleSwarm(topic: string, initialContent: string, streamCallbacks?: AIStreamCallbacksAndOptions) {
  console.log(`[LoomOrchestrator] Starting simple swarm for topic: "${topic}"`);
  const currentLogs: string[] = [`Orchestrator: Initiating swarm for topic "${topic}".`];

  const sendLog = (logMessage: string) => {
    currentLogs.push(logMessage);
    if (streamCallbacks?.onToken) {
      streamCallbacks.onToken(`[LOG] ${logMessage}\n`);
    }
  };

  try {
    if (streamCallbacks?.onStart) await streamCallbacks.onStart();

    // Step 1: Summarizer Agent
    sendLog(`SummarizerAgent: Processing initial content for topic "${topic}".`);
    const summarizerInput: AgentInput = { topic, context: initialContent };
    const summaryOutput = await summarizerAgent(summarizerInput);
    (summaryOutput.logs || []).forEach(log => sendLog(`SummarizerAgent: ${log}`));
    if (summaryOutput.error) throw new Error(`Summarization failed: ${summaryOutput.error}`);
    sendLog(`SummarizerAgent: Successfully summarized. Output length: ${summaryOutput.result.length}`);
    console.log('[LoomOrchestrator] Summary obtained.');
    
    // Step 2: Reviewer Agent
    sendLog(`ReviewerAgent: Processing summary for topic "${topic}".`);
    const reviewerInput: AgentInput = { topic, context: summaryOutput.result };
    const reviewOutput = await reviewerAgent(reviewerInput);
    (reviewOutput.logs || []).forEach(log => sendLog(`ReviewerAgent: ${log}`));
    if (reviewOutput.error) throw new Error(`Review failed: ${reviewOutput.error}`);
    sendLog(`ReviewerAgent: Successfully reviewed. Review: ${reviewOutput.result.substring(0,50)}...`);
    console.log('[LoomOrchestrator] Review obtained.');
    
    // Step 3: Finalizer Agent (Streaming)
    sendLog(`StreamingFinalizerAgent: Preparing to stream final output for topic "${topic}".`);
    const finalizerInput: AgentInput = { topic, context: reviewOutput.result }; 
    const textStream = await streamingFinalizerAgent(finalizerInput);
    
    if (streamCallbacks?.onToken) {
      streamCallbacks.onToken(`\n[STREAMING_OUTPUT_START]\n`);
    }
    console.log('[LoomOrchestrator] Streaming final output...');
    
    return AIStream(textStream, undefined, streamCallbacks);

  } catch (error: any) {
    console.error('[LoomOrchestrator] Swarm Error:', error);
    const errorMessage = `Swarm orchestration failed: ${error.message}.`;
    sendLog(`Orchestrator: Error - ${errorMessage}`);
    
    if (streamCallbacks?.onToken) {
      streamCallbacks.onToken(`\n[ERROR] ${errorMessage}\n`);
    }
    if (streamCallbacks?.onFinal) { // Use onFinal for cleanup on error too
        await streamCallbacks.onFinal(currentLogs.join('\n')); 
    }
    // This error will be caught by the API route and returned as a 500
    throw new Error(errorMessage);
  }
}
