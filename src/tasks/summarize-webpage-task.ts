
'use server';
/**
 * @fileOverview A task for summarizing the content of a webpage by calling the backend /api/loom/summarize-url endpoint.
 *
 * - summarizeWebpageTask - A function that handles the webpage summarization via the backend.
 * - SummarizeWebpageInput - The input type for the summarizeWebpageTask function.
 * - SummarizeWebpageOutput - The return type for the summarizeWebpageTask function.
 */

export interface SummarizeWebpageInput {
  url: string;
}

export interface SummarizeWebpageOutput {
  summary?: string;
  originalUrl: string;
  error?: string;
  logs?: string[]; // Logs from the task itself, e.g., API call status
}

export async function summarizeWebpageTask(input: SummarizeWebpageInput): Promise<SummarizeWebpageOutput> {
  const logs: string[] = [];
  const log = (message: string) => {
    console.log(`[TASK_SUMMARIZE_WEBPAGE] ${message}`);
    logs.push(message);
  };

  log(`Calling backend API /api/loom/summarize-url for URL: "${input.url}"`);

  if (!input.url || !(input.url.startsWith('http://') || input.url.startsWith('https://'))) {
    const errorMsg = 'Invalid URL provided for summarization.';
    log(`Error: ${errorMsg}`);
    return {
      originalUrl: input.url || 'invalid_url',
      error: errorMsg,
      logs,
    };
  }

  try {
    const response = await fetch('/api/loom/summarize-url', { // Changed from /api/loom/start
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: input.url }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.error || `API request failed with status ${response.status}`;
      log(`API Error: ${errorMessage}`);
      return { originalUrl: input.url, error: errorMessage, logs };
    }
    
    log(`Successfully received summary from API for URL: ${input.url}. Summary length: ${responseData.summary?.length || 0}`);
    return { 
      summary: responseData.summary, 
      originalUrl: responseData.originalUrl || input.url, 
      error: responseData.error, // Pass through error if API explicitly returned one with 200 OK
      logs 
    };

  } catch (e: any) {
    const errorMsg = e.message || "An unexpected error occurred while calling the summarization API.";
    log(`Fetch/Processing Error: ${errorMsg}`);
    return { originalUrl: input.url, error: errorMsg, logs };
  }
}

