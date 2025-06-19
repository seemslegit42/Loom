
import { generateText, streamText, type CoreTool } from '@ai-sdk/core';
import { getGroqModel } from '@/lib/ai-tools/groq';

export interface AgentInput {
  topic: string;
  context?: string; // Context from previous agent
  config?: Record<string, any>; // For future use, e.g. agent-specific settings
  tools?: CoreTool[];
}

export interface AgentOutput {
  result: string;
  logs?: string[]; // For simple logging
  error?: string; // To indicate an error from the agent
}

// Summarizer Agent
export async function summarizerAgent(input: AgentInput): Promise<AgentOutput> {
  const model = getGroqModel(); // Use default or configured Groq model
  const { topic, context } = input;

  const prompt = `Summarize the following text related to "${topic}":\n\n${context || 'No previous context provided.'}\n\nProvide a concise summary.`;

  try {
    const { text } = await generateText({
      model,
      prompt,
      tools: input.tools,
    });
    return { result: text, logs: [`SummarizerAgent: Successfully summarized topic "${topic}".`] };
  } catch (error: any) {
    console.error('SummarizerAgent Error:', error);
    return { result: '', logs: [`SummarizerAgent: Error - ${error.message}`], error: error.message };
  }
}

// Reviewer Agent
export async function reviewerAgent(input: AgentInput): Promise<AgentOutput> {
  const model = getGroqModel();
  const { topic, context } = input; // Context here is the summary from SummarizerAgent

  const prompt = `Review the following summary on the topic "${topic}". Identify any potential issues or areas for improvement. If it looks good, approve it. If not, suggest changes concisely:\n\nSummary:\n${context}\n\nReview:`;

  try {
    const { text } = await generateText({
      model,
      prompt,
      tools: input.tools,
    });
    return { result: text, logs: [`ReviewerAgent: Successfully reviewed summary for "${topic}". Review: ${text}`] };
  } catch (error: any) {
    console.error('ReviewerAgent Error:', error);
    return { result: '', logs: [`ReviewerAgent: Error - ${error.message}`], error: error.message };
  }
}

// Example of a streaming agent (could be used by the "queen" or final step)
export async function streamingFinalizerAgent(input: AgentInput) {
  const model = getGroqModel();
  const { topic, context } = input; // Context here is the reviewed summary

  const prompt = `The following text about "${topic}" has been summarized and reviewed. Format it as a final output. \n\nReviewed Text:\n${context}\n\nFinal Output:`;
  
  try {
    // streamText returns an object with a textStream property
    const { textStream } = await streamText({
      model,
      prompt,
      tools: input.tools,
    });
    return textStream; // Return the ReadableStream directly
  } catch (error: any) {
    console.error('StreamingFinalizerAgent Error:', error);
    // For stream, error handling might be different or wrapped by the caller
    throw error; 
  }
}
