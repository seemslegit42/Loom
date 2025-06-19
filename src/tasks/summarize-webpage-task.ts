
'use server';
/**
 * @fileOverview A task for summarizing the content of a webpage by calling the backend /api/loom/start endpoint.
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
  logs?: string[];
}

export async function summarizeWebpageTask(input: SummarizeWebpageInput): Promise<SummarizeWebpageOutput> {
  console.log(`[TASK_SUMMARIZE_WEBPAGE] Calling backend API /api/loom/start for URL: "${input.url}"`);

  if (!input.url || !(input.url.startsWith('http://') || input.url.startsWith('https://'))) {
    return {
      originalUrl: input.url || 'invalid_url',
      error: 'Invalid URL provided for summarization.',
    };
  }

  let accumulatedResponse = "";
  const logs: string[] = [];

  try {
    const response = await fetch('/api/loom/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: `Summarize content from URL: ${input.url.substring(0, 50)}...`,
        initialContent: input.url, // The URL itself is the initial content for the summarizer agent
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response from API." }));
      const errorMessage = errorData.error || `API request failed with status ${response.status}`;
      console.error(`[TASK_SUMMARIZE_WEBPAGE] API error: ${errorMessage}`);
      return { originalUrl: input.url, error: errorMessage, logs };
    }

    if (!response.body) {
      return { originalUrl: input.url, error: "Response body is empty from API /api/loom/start.", logs };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let finalOutputStarted = false;
    let finalSummary = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        
        // Process line by line for logs and final output marker
        const lines = accumulatedResponse.split('\n');
        accumulatedResponse = lines.pop() || ""; // Keep incomplete line for next chunk

        for (const line of lines) {
          if (line.startsWith("[LOG]")) {
            logs.push(line.substring(5).trim());
          } else if (line.startsWith("[STREAMING_OUTPUT_START]")) {
            finalOutputStarted = true;
            const contentAfterMarker = line.substring("[STREAMING_OUTPUT_START]".length);
            if(contentAfterMarker.trim()) finalSummary += contentAfterMarker + '\n';
          } else if (line.startsWith("[ERROR]")) {
            const apiError = line.substring("[ERROR]".length).trim();
            console.error(`[TASK_SUMMARIZE_WEBPAGE] API returned an error in stream: ${apiError}`);
            return { originalUrl: input.url, error: `API Error: ${apiError}`, logs };
          } else if (finalOutputStarted) {
            finalSummary += line + '\n';
          }
        }
      }
    }
     // Process any remaining accumulatedResponse
    if (accumulatedResponse.trim()) {
        if (accumulatedResponse.startsWith("[LOG]")) {
            logs.push(accumulatedResponse.substring(5).trim());
        } else if (accumulatedResponse.startsWith("[STREAMING_OUTPUT_START]")) {
            finalOutputStarted = true;
             const contentAfterMarker = accumulatedResponse.substring("[STREAMING_OUTPUT_START]".length);
            if(contentAfterMarker.trim()) finalSummary += contentAfterMarker + '\n';
        } else if (finalOutputStarted) {
            finalSummary += accumulatedResponse + '\n';
        }
    }


    if (!finalSummary.trim() && !logs.some(l => l.toLowerCase().includes('error'))) {
       return { originalUrl: input.url, error: "No summary content received from the API, but no explicit error.", logs };
    }
    
    console.log(`[TASK_SUMMARIZE_WEBPAGE] Successfully processed stream. Summary length: ${finalSummary.trim().length}. Logs collected: ${logs.length}`);
    return { summary: finalSummary.trim(), originalUrl: input.url, logs };

  } catch (e: any) {
    console.error("[TASK_SUMMARIZE_WEBPAGE] Fetch/stream processing error:", e);
    return { originalUrl: input.url, error: e.message || "An unexpected error occurred while summarizing the webpage.", logs };
  }
}
