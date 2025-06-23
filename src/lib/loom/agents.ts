
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
      agentLogs.push(`Warning: Content-Type for ${urlToSummarize} is not text/html (${contentType}). Attempting to parse as text.`);
    }
    webContent = await response.text();
    agentLogs.push(`Successfully fetched content. Length: ${webContent.length} characters.`);

    const plainText = webContent.replace(/<style[^>]*>.*?<\/style>/gs, ' ')
                               .replace(/<script[^>]*>.*?<\/script>/gs, ' ')
                               .replace(/<[^>]*>?/gm, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();
    agentLogs.push(`Stripped HTML to plain text. Length: ${plainText.length} characters.`);
    
    if (!plainText.trim()) {
        throw new Error("After stripping HTML, no text content remained from the URL.");
    }

    const prompt = `Your task is to provide a concise summary of the following text extracted from the webpage "${urlToSummarize}". The overall goal is related to the topic: "${topic}".\n\n---BEGIN CONTENT---\n${plainText.substring(0, 25000)}...\n---END CONTENT---\n\nSummary:`;
    
    agentLogs.push(`Sending content to LLM for summarization.`);
    const { text: summary } = await generateText({
      model,
      prompt,
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
  const { topic, context } = input;
  const agentLogs: string[] = [];

  const prompt = `Your task is to review the following summary on the topic "${topic}". Constructively critique it. Identify potential issues, missing information, or areas for improvement. If the summary is good, confirm its quality. Provide a concise review.\n\n---BEGIN SUMMARY---\n${context}\n---END SUMMARY---\n\nReview:`;
  
  agentLogs.push(`Sending summary to LLM for review.`);
  try {
    const { text } = await generateText({
      model,
      prompt,
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
  const { topic, context } = input;

  // The prompt is now more adaptable.
  const prompt = `You are an AI assistant. Your goal is to provide a final, polished response based on the provided context and topic.
  
Topic/Goal: "${topic}"

Context:
${context}

Based on the above, provide a comprehensive and well-formatted final response.`;
  
  try {
    const { textStream } = await streamText({
      model,
      prompt,
    });
    return textStream; 
  } catch (error: any)
  {
    console.error('StreamingFinalizerAgent Error:', error);
    throw error; 
  }
}
