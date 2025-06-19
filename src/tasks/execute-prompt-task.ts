
'use server';
/**
 * @fileOverview A task for executing a given prompt by calling a backend API.
 *
 * - executePromptTask - A function that handles the LLM call via the backend API.
 * - ExecutePromptInput - The input type for the executePromptTask function.
 * - ExecutePromptOutput - The return type for the executePromptTask function.
 */

export interface ExecutePromptInput {
  promptText: string;
  modelName?: string; // This can be used by the backend API if needed
}

export interface ExecutePromptOutput {
  responseText?: string;
  error?: string;
}

export async function executePromptTask(input: ExecutePromptInput): Promise<ExecutePromptOutput> {
  console.log(`[TASK] executePromptTask calling backend API. Prompt: "${input.promptText.substring(0, 50)}..."`);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Vercel AI SDK typically expects a 'messages' array.
      // We adapt our simple prompt to this structure for the API call.
      body: JSON.stringify({
        messages: [{ role: 'user', content: input.promptText }],
        // You could also pass input.modelName here if your API route is designed to use it
        // model: input.modelName,
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON or other error
        errorData = { error: `API request failed with status ${response.status}. Response not JSON.` };
      }
      console.error("[TASK] API Error Response:", errorData);
      return { error: errorData.error || `API request failed: ${response.status} ${response.statusText}` };
    }

    // The /api/chat route returns a stream. We need to read it and accumulate the text.
    const reader = response.body?.getReader();
    if (!reader) {
      return { error: 'Failed to get response reader from API.' };
    }

    const decoder = new TextDecoder();
    let accumulatedResponse = "";
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulatedResponse += decoder.decode(value, { stream: true });
    }
    // Append any final part of a multi-byte character
    accumulatedResponse += decoder.decode(undefined, { stream: false });

    return { responseText: accumulatedResponse };

  } catch (error: any) {
    console.error("[TASK] Error in executePromptTask calling API:", error);
    return { error: error.message || "An unexpected error occurred calling the backend API." };
  }
}
