
import { summarizerAgent, reviewerAgent, streamingFinalizerAgent, type AgentInput } from './agents';
import { AIStream, type AIStreamCallbacksAndOptions } from '@ai-sdk/ui-utils';

const sendLog = (logMessage: string, streamCallbacks?: AIStreamCallbacksAndOptions) => {
    if (streamCallbacks?.onToken) {
      streamCallbacks.onToken(`[LOG] ${logMessage}\n`);
    }
    console.log(`[LoomOrchestrator] ${logMessage}`);
};

const sendError = (errorMessage: string, streamCallbacks?: AIStreamCallbacksAndOptions) => {
    const message = `[ERROR] ${errorMessage}\n`;
    if (streamCallbacks?.onToken) {
        streamCallbacks.onToken(message);
    }
    console.error(`[LoomOrchestrator] ${message}`);
};

// Orchestrator for generic prompts
export async function startGenericPromptSwarm(prompt: string, streamCallbacks?: AIStreamCallbacksAndOptions) {
  sendLog(`Generic Swarm: Initiating for prompt: "${prompt.substring(0, 50)}..."`, streamCallbacks);
  try {
    if (streamCallbacks?.onStart) await streamCallbacks.onStart();

    const finalizerInput: AgentInput = {
      topic: prompt,
      context: prompt, // For generic prompts, context is the prompt itself
    };

    sendLog('Generic Swarm: Passing prompt directly to StreamingFinalizerAgent.', streamCallbacks);
    const textStream = await streamingFinalizerAgent(finalizerInput);

    if (streamCallbacks?.onToken) {
      streamCallbacks.onToken('\n[STREAMING_OUTPUT_START]\n');
    }
    sendLog('Generic Swarm: Streaming final output.', streamCallbacks);

    return AIStream(textStream, undefined, streamCallbacks);

  } catch (error: any) {
    const errorMessage = `Generic Swarm orchestration failed: ${error.message}.`;
    sendError(errorMessage, streamCallbacks);
    if (streamCallbacks?.onFinal) {
      await streamCallbacks.onFinal(prompt); // pass original prompt on final
    }
    // We re-throw the error to ensure the API route returns a proper 500 status
    throw new Error(errorMessage);
  }
}

// Orchestrator for web summarization
export async function startWebSummarizationSwarm(url: string, streamCallbacks?: AIStreamCallbacksAndOptions) {
  sendLog(`Web Summarization Swarm: Initiating for URL: "${url}"`, streamCallbacks);

  try {
    if (streamCallbacks?.onStart) await streamCallbacks.onStart();

    // Step 1: Summarizer Agent
    sendLog(`Web Summarization Swarm: Calling SummarizerAgent for URL.`, streamCallbacks);
    const summarizerInput: AgentInput = { topic: `Summarize webpage at ${url}`, context: url };
    const summaryOutput = await summarizerAgent(summarizerInput);
    (summaryOutput.logs || []).forEach(log => sendLog(`SummarizerAgent: ${log}`, streamCallbacks));
    if (summaryOutput.error) throw new Error(`Summarization failed: ${summaryOutput.error}`);
    sendLog(`Web Summarization Swarm: SummarizerAgent completed. Output length: ${summaryOutput.result.length}`, streamCallbacks);

    // Step 2: Reviewer Agent
    sendLog(`Web Summarization Swarm: Calling ReviewerAgent with summary.`, streamCallbacks);
    const reviewerInput: AgentInput = { topic: `Review of summary for ${url}`, context: summaryOutput.result };
    const reviewOutput = await reviewerAgent(reviewerInput);
    (reviewOutput.logs || []).forEach(log => sendLog(`ReviewerAgent: ${log}`, streamCallbacks));
    if (reviewOutput.error) throw new Error(`Review failed: ${reviewOutput.error}`);
    sendLog(`Web Summarization Swarm: ReviewerAgent completed. Review: ${reviewOutput.result.substring(0, 50)}...`, streamCallbacks);

    // Step 3: Finalizer Agent (Streaming)
    sendLog(`Web Summarization Swarm: Calling StreamingFinalizerAgent with reviewed summary.`, streamCallbacks);
    const finalizerInput: AgentInput = { topic: `Final summary for ${url}`, context: reviewOutput.result };
    const textStream = await streamingFinalizerAgent(finalizerInput);

    if (streamCallbacks?.onToken) {
      streamCallbacks.onToken('\n[STREAMING_OUTPUT_START]\n');
    }
    sendLog('Web Summarization Swarm: Streaming final output.', streamCallbacks);

    return AIStream(textStream, undefined, streamCallbacks);

  } catch (error: any) {
    const errorMessage = `Web Summarization Swarm orchestration failed: ${error.message}.`;
    sendError(errorMessage, streamCallbacks);
    if (streamCallbacks?.onFinal) {
      await streamCallbacks.onFinal(url); // pass original url on final
    }
    // We re-throw the error to ensure the API route returns a proper 500 status
    throw new Error(errorMessage);
  }
}
