
'use server';
/**
 * @fileOverview A task for executing a given prompt by calling the backend /api/loom/direct endpoint.
 *
 * - executePromptTask - A function that handles the LLM call via the backend.
 * - ExecutePromptInput - The input type for the executePromptTask function.
 * - ExecutePromptOutput - The return type for the executePromptTask function.
 */

export interface ExecutePromptInput {
  promptText: string;
  modelName?: string; 
}

export interface ExecutePromptOutput {
  responseText?: string;
  error?: string;
}

export async function executePromptTask(input: ExecutePromptInput): Promise<ExecutePromptOutput> {
  console.log(`[TASK_EXECUTE_PROMPT] Calling backend API /api/loom/direct. Prompt: "${input.promptText.substring(0, 50)}..." Model: ${input.modelName || 'default'}`);

  if (!input.promptText.trim()) {
    return { error: "Prompt text cannot be empty." };
  }

  try {
    const response = await fetch('/api/loom/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: input.promptText,
        modelName: input.modelName 
      }),
    });

    if (!response.ok) {
      // Try to parse error from response body
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        // Ignore if response body is not JSON or empty
      }
      const errorMessage = errorBody?.error || `API request failed with status ${response.status}. Full response: ${await response.text()}`;
      console.error(`[TASK_EXECUTE_PROMPT] API error: ${errorMessage}`);
      return { error: errorMessage };
    }

    if (!response.body) {
      return { error: "Response body is empty from API /api/loom/direct." };
    }

    // Handle the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = "";
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        accumulatedText += decoder.decode(value, { stream: true });
      }
    }
    // The stream from toDataStreamResponse might include other data if not careful.
    // For a simple text stream like this, the accumulated text should be the direct LLM output.

    return { responseText: accumulatedText.trim() };

  } catch (e: any) {
    console.error("[TASK_EXECUTE_PROMPT] Fetch error:", e);
    return { error: e.message || "An unexpected error occurred while fetching from /api/loom/direct." };
  }
}
