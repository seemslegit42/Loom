
import { summarizerAgent, reviewerAgent, streamingFinalizerAgent, type AgentInput } from './agents';
import { AIStream, type AIStreamCallbacksAndOptions } from '@ai-sdk/ui-utils';
import { fetchUrlContentTool } from './tools/fetch-url-content-tool'; // Import the tool

export async function startSimpleSwarm(topic: string, initialContent: string, streamCallbacks?: AIStreamCallbacksAndOptions) {
  console.log(`[LoomOrchestrator] Starting simple swarm for topic: "${topic}"`);
  const currentLogs: string[] = [`Orchestrator: Initiating swarm for topic "${topic}".`];

  const sendLog = (logMessage: string) => {
    currentLogs.push(logMessage);
    if (streamCallbacks?.onToken) {
      // Ensure newlines for proper client-side parsing if each log is a distinct "chunk"
      streamCallbacks.onToken(`[LOG] ${logMessage}\n`);
    }
  };

  try {
    if (streamCallbacks?.onStart) await streamCallbacks.onStart();

    // Step 1: Summarizer Agent
    sendLog(`SummarizerAgent: Processing initial content for topic "${topic}".`);
    // Provide the fetchUrlContentTool to the summarizerAgent
    const summarizerInput: AgentInput = { 
      topic, 
      context: initialContent,
      tools: [fetchUrlContentTool] 
    };
    const summaryOutput = await summarizerAgent(summarizerInput);
    (summaryOutput.logs || []).forEach(log => sendLog(log)); // Agent logs are already prefixed
    if (summaryOutput.error) throw new Error(`Summarization failed: ${summaryOutput.error}`);
    sendLog(`SummarizerAgent: Successfully summarized. Output length: ${summaryOutput.result.length}`);
    console.log('[LoomOrchestrator] Summary obtained.');
    
    // Step 2: Reviewer Agent
    sendLog(`ReviewerAgent: Processing summary for topic "${topic}".`);
    // Reviewer might not need tools, but pass them along for consistency or future use
    const reviewerInput: AgentInput = { 
      topic, 
      context: summaryOutput.result,
      tools: [fetchUrlContentTool] // Or an empty array if reviewer definitely doesn't need tools
    };
    const reviewOutput = await reviewerAgent(reviewerInput);
    (reviewOutput.logs || []).forEach(log => sendLog(log));
    if (reviewOutput.error) throw new Error(`Review failed: ${reviewOutput.error}`);
    sendLog(`ReviewerAgent: Successfully reviewed. Review: ${reviewOutput.result.substring(0,50)}...`);
    console.log('[LoomOrchestrator] Review obtained.');
    
    // Step 3: Finalizer Agent (Streaming)
    sendLog(`StreamingFinalizerAgent: Preparing to stream final output for topic "${topic}".`);
    const finalizerInput: AgentInput = { 
      topic, 
      context: reviewOutput.result,
      tools: [fetchUrlContentTool] // Or an empty array
    }; 
    const textStream = await streamingFinalizerAgent(finalizerInput);
    
    if (streamCallbacks?.onToken) {
      // Add a newline before starting the main output for client parsing
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
    if (streamCallbacks?.onFinal) { 
        await streamCallbacks.onFinal(currentLogs.join('\n')); 
    }
    throw new Error(errorMessage);
  }
}
