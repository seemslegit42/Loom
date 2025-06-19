
import { generateText, streamText, type CoreTool } from '@ai-sdk/core';
import { getGroqModel } from '@/lib/ai-tools/groq';

export interface AgentInput {
  topic: string;
  context?: string; // Context from previous agent, or initial input (e.g., URL)
  config?: Record<string, any>;
  tools?: CoreTool[];
}

export interface AgentOutput {
  result: string;
  logs?: string[]; 
  error?: string;
}

// Summarizer Agent
export async function summarizerAgent(input: AgentInput): Promise<AgentOutput> {
  const model = getGroqModel();
  const { topic, context: urlToSummarize } = input;
  const agentLogs: string[] = [];

  if (!urlToSummarize || !(urlToSummarize.startsWith('http://') || urlToSummarize.startsWith('https://'))) {
    const errorMsg = `Invalid or missing URL provided to SummarizerAgent: ${urlToSummarize}`;
    agentLogs.push(`Error: ${errorMsg}`);
    return { result: '', logs: agentLogs, error: errorMsg };
  }

  agentLogs.push(`Attempting to fetch content from URL: ${urlToSummarize}`);
  let webContent = '';
  try {
    const response = await fetch(urlToSummarize, { headers: { 'User-Agent': 'LoomStudio-SummarizerAgent/1.0' } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} for URL: ${urlToSummarize}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      // Attempt to read as text anyway, but log a warning
      agentLogs.push(`Warning: Content-Type for ${urlToSummarize} is not text/html (${contentType}). Attempting to parse as text.`);
    }
    webContent = await response.text();
    agentLogs.push(`Successfully fetched content. Length: ${webContent.length} characters.`);

    // Basic HTML stripping (naive, for more complex scenarios a library is better)
    const plainText = webContent.replace(/<style[^>]*>.*?<\/style>/gs, ' ') // Remove style blocks
                               .replace(/<script[^>]*>.*?<\/script>/gs, ' ') // Remove script blocks
                               .replace(/<[^>]*>?/gm, ' ') // Remove all other tags
                               .replace(/\s+/g, ' ') // Collapse multiple spaces
                               .trim();
    agentLogs.push(`Stripped HTML to plain text. Length: ${plainText.length} characters.`);
    
    if (!plainText.trim()) {
        throw new Error("After stripping HTML, no text content remained from the URL.");
    }

    const prompt = `Summarize the following text extracted from the webpage "${urlToSummarize}", which is related to the topic "${topic}":\n\n${plainText.substring(0, 25000)}...\n\nProvide a concise summary.`; // Limit input size

    agentLogs.push(`Sending content to LLM for summarization.`);
    const { text: summary } = await generateText({
      model,
      prompt,
      // tools: input.tools, // Not using tools in this agent directly
    });
    agentLogs.push(`LLM summarization successful.`);
    return { result: summary, logs: agentLogs };

  } catch (error: any) {
    console.error('SummarizerAgent Error:', error);
    agentLogs.push(`Error during summarization: ${error.message}`);
    return { result: '', logs: agentLogs, error: error.message };
  }
}

// Reviewer Agent
export async function reviewerAgent(input: AgentInput): Promise<AgentOutput> {
  const model = getGroqModel();
  const { topic, context } = input; // Context here is the summary from SummarizerAgent
  const agentLogs: string[] = [];

  const prompt = `Review the following summary on the topic "${topic}". Identify any potential issues or areas for improvement. If it looks good, approve it by stating it's a good summary. If not, suggest changes concisely and constructively:\n\nSummary:\n${context}\n\nReview:`;
  
  agentLogs.push(`Sending summary to LLM for review.`);
  try {
    const { text } = await generateText({
      model,
      prompt,
      // tools: input.tools,
    });
    agentLogs.push(`LLM review successful.`);
    return { result: text, logs: agentLogs };
  } catch (error: any) {
    console.error('ReviewerAgent Error:', error);
    agentLogs.push(`Error during review: ${error.message}`);
    return { result: '', logs: agentLogs, error: error.message };
  }
}

// Streaming Finalizer Agent
export async function streamingFinalizerAgent(input: AgentInput) {
  const model = getGroqModel();
  const { topic, context } = input; // Context here is the reviewed summary

  const prompt = `The following text about "${topic}" has been summarized and reviewed. Format it as a final, polished output, ready for presentation. Ensure it is coherent and directly addresses the core topic. \n\nReviewed Text:\n${context}\n\nFinal Output:`;
  
  try {
    const { textStream } = await streamText({
      model,
      prompt,
      // tools: input.tools,
    });
    return textStream; 
  } catch (error: any) {
    console.error('StreamingFinalizerAgent Error:', error);
    throw error; 
  }
}
