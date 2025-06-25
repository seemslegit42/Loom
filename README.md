
# Firebase Studio / Loom™ Studio

This is a NextJS starter in Firebase Studio, evolving into Loom™ Studio.

To get started, take a look at src/app/page.tsx for the frontend.
The backend API is being developed under `src/app/api/loom/`.

## Loom™ Studio API

The Loom Studio API provides endpoints for orchestrating AI workflows using a multi-agent swarm architecture, powered by the Vercel AI SDK and Groq LLMs.

### Setup

1.  **Environment Variables**:
    Create a `.env.local` file in the root of your project with the following variables. Replace the placeholder values with your actual service credentials.
    ```env
    # Groq LLM Configuration
    GROQ_API_KEY=your_groq_api_key_here
    GROQ_MODEL_NAME=mixtral-8x7b-32768 # Or your preferred default Groq model

    # Firebase Configuration (for client-side features like the console log)
    # Get these from your Firebase project's settings.
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    ```

2.  **Install Dependencies**:
    If you haven't already, or if `package.json` was updated, run:
    ```bash
    npm install
    ```

### API Endpoints

The API is designed to be modular and extensible.

*   **`POST /api/loom/start`**:
    *   Initiates a new AI workflow swarm or a specific agent task.
    *   **Request Body** (JSON):
        *   `workflowType` (string, required): Specifies the type of workflow. Examples: `"genericPrompt"`, `"webSummarization"`.
        *   `inputData` (string or object, required): Data for the specified `workflowType`. For `"webSummarization"`, this would be `{ "url": "http://example.com" }`. For `"genericPrompt"`, this is the prompt string.
    *   **Response**: A streaming response (`text/event-stream` or similar via `toDataStreamResponse`) containing logs and the final output from the agent swarm or task.
    *   **Example Usages (curl)**:
        Generic Prompt (full agent chain):
        ```bash
        curl -X POST http://localhost:3000/api/loom/start \
        -H "Content-Type: application/json" \
        -d '{
              "workflowType": "genericPrompt", 
              "inputData": "Tell me about quantum computing."
            }' \
        --no-buffer
        ```
        Web Summarization (full agent chain):
        ```bash
        curl -X POST http://localhost:3000/api/loom/start \
        -H "Content-Type: application/json" \
        -d '{
              "workflowType": "webSummarization",
              "inputData": { "url": "https://example.com/article" }
            }' \
        --no-buffer 
        ```

*   **`POST /api/loom/direct`**:
    *   Sends a prompt directly to the configured Groq LLM.
    *   **Request Body** (JSON):
        *   `prompt` (string, required): The prompt to send to the LLM.
        *   `modelName` (string, optional): Specific Groq model to use (e.g., `llama3-8b-8192`). If omitted, backend default is used.
    *   **Response**: A streaming response (`text/event-stream`) with the LLM's direct output.
    *   **Example Usage (curl)**:
        ```bash
        curl -X POST http://localhost:3000/api/loom/direct \
        -H "Content-Type: application/json" \
        -d '{"prompt": "What is the capital of France?"}' \
        --no-buffer
        ```

*   **`POST /api/loom/summarize-url`**:
    *   Fetches content from a given URL and summarizes it using the Groq LLM. This is a non-streaming, direct utility endpoint.
    *   **Request Body** (JSON):
        *   `url` (string, required): The URL of the webpage to summarize.
    *   **Response** (JSON, non-streaming):
        ```json
        {
          "summary": "The summarized content...",
          "originalUrl": "http://example.com/article",
          "error": "Optional error message if something went wrong"
        }
        ```
    *   **Example Usage (curl)**:
        ```bash
        curl -X POST http://localhost:3000/api/loom/summarize-url \
        -H "Content-Type: application/json" \
        -d '{"url": "https://example.com/article"}'
        ```
*   **Other Endpoints**: `status`, `step`, and `logs` are available but are mostly placeholders for future, more advanced state management and monitoring.

### Architecture Notes

*   **Agents**: Defined in `src/lib/loom/agents.ts`. These are functions that perform specific tasks using the Groq LLM and Vercel AI SDK tools.
*   **Orchestrator**: Orchestration logic is in `src/lib/loom/orchestrator.ts`. The `startGenericPromptSwarm` and `startWebSummarizationSwarm` functions manage the workflow sequences.
*   **LLM Provider**: Groq integration is managed via `@ai-sdk/provider-groq` and configured in `src/lib/ai-tools/groq.ts`.
*   **Modularity**: The structure allows for adding new agents, modifying orchestration flows, and potentially integrating different LLM providers or tools.

This API is the backend foundation for Loom™ Studio's AI capabilities.
