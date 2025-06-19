
# Firebase Studio / Loom™ Studio

This is a NextJS starter in Firebase Studio, evolving into Loom™ Studio.

To get started, take a look at src/app/page.tsx for the frontend.
The backend API is being developed under `src/app/api/loom/`.

## Loom™ Studio API

The Loom Studio API provides endpoints for orchestrating AI workflows using a multi-agent swarm architecture, powered by the Vercel AI SDK and Groq LLMs.

### Setup

1.  **Environment Variables**:
    Ensure you have a `.env` file in the root of your project with the following variables:
    ```env
    # Groq LLM Configuration
    GROQ_API_KEY=your_groq_api_key_here
    GROQ_MODEL_NAME=mixtral-8x7b-32768 # Or your preferred default Groq model

    # For server-side API calls to itself (e.g., tasks calling API routes)
    NEXT_PUBLIC_APP_URL=http://localhost:9002

    # Loom API Configuration (Examples for future, more advanced integrations)
    # SUPERAGI_API_ENDPOINT=https://your_superagi_instance/api
    # CREWAI_API_ENDPOINT=https://your_crewai_service/api

    # Swarm Settings (Examples)
    LOOM_SWARM_DEFAULT_MODEL=mixtral-8x7b-32768 # Overrides GROQ_MODEL_NAME for swarm agents if set
    LOOM_SWARM_MAX_ITERATIONS=5 # Example: for controlling agent loops
    ```
    Replace `your_groq_api_key_here` with your actual Groq API key.

2.  **Install Dependencies**:
    If you haven't already, or if `package.json` was updated, run:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### API Endpoints

The API is designed to be modular and extensible.

*   **`POST /api/loom/start`**:
    *   Initiates a new AI workflow swarm or a specific agent task.
    *   **Request Body** (JSON):
        *   `workflowType` (string, optional): Specifies the type of workflow. Examples: `"genericPrompt"`, `"webSummarization"`. If omitted or for basic prompts, `prompt` field is primary.
        *   `inputData` (string or object, optional): Data for the specified `workflowType`. For `"webSummarization"`, this would be `{ "url": "http://example.com" }`. For `"genericPrompt"`, this is the prompt string.
        *   `prompt` (string, optional): A general input prompt. If `workflowType` and `inputData` are not provided, `prompt` can be used. For simple flows, it might be treated as both `topic` and `initialContent`.
        *   `topic` (string, optional, legacy): The main subject or goal for the swarm.
        *   `initialContent` (string or object, optional, legacy): Initial data or context for the swarm.
    *   **Response**: A streaming response (`text/event-stream` or similar via `toDataStreamResponse`) containing logs and the final output from the agent swarm or task.
    *   **Example Usages (curl)**:
        General Prompt (full agent chain):
        ```bash
        curl -X POST http://localhost:9002/api/loom/start \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Tell me about quantum computing."}' \
        --no-buffer
        ```
        Web Summarization (full agent chain):
        ```bash
        curl -X POST http://localhost:9002/api/loom/start \
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
        curl -X POST http://localhost:9002/api/loom/direct \
        -H "Content-Type: application/json" \
        -d '{"prompt": "What is the capital of France?"}' \
        --no-buffer
        ```

*   **`POST /api/loom/summarize-url`**:
    *   Fetches content from a given URL and summarizes it using the Groq LLM.
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
        curl -X POST http://localhost:9002/api/loom/summarize-url \
        -H "Content-Type: application/json" \
        -d '{"url": "https://example.com/article"}'
        ```

*   **`GET /api/loom/status`**:
    *   Returns the current status of the Loom API service, including Groq provider configuration.
    *   **Current Implementation**: Provides API service status and LLM config status. Full swarm state tracking is a future enhancement.
    *   **Response** (JSON):
        ```json
        {
          "serviceName": "Loom API",
          "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "groqProviderStatus": "Configured" / "API Key Missing",
          "defaultGroqModel": "mixtral-8x7b-32768",
          "swarmFeatureStatus": "Detailed swarm status tracking requires persistent state management."
        }
        ```

*   **`POST /api/loom/step`**: (Placeholder)
    *   Conceptually sends a follow-up message to an ongoing workflow swarm.
    *   **Request Body** (JSON):
        *   `swarmId` (string, required): The ID of the active swarm.
        *   `message` (string, optional) or `prompt` (string, optional).
    *   **Current Implementation**: Placeholder. Returns a message indicating that true stepping functionality requires robust session and state management.

*   **`GET /api/loom/logs`**:
    *   Streams detailed step-by-step debug output for a specific swarm (`swarmId`) or general recent activity.
    *   **Query Parameters**:
        *   `swarmId` (string, optional): The ID of the swarm to retrieve logs for. If omitted, will attempt to retrieve general logs.
    *   **Current Implementation**: Fetches logs from Firestore for the given `swarmId` (if provided) or general `console_logs` (if no `swarmId`).
    *   **Response**: A streaming response (`text/plain`) with log entries.

### Architecture Notes

*   **Agents**: Defined in `src/lib/loom/agents.ts`. These are functions that perform specific tasks using the Groq LLM and Vercel AI SDK tools.
*   **Orchestrator**: Orchestration logic is in `src/lib/loom/orchestrator.ts`. The `startSimpleSwarm` function chains agents sequentially for the generic prompt flow.
*   **LLM Provider**: Groq integration is managed via `@ai-sdk/provider-groq` and configured in `src/lib/ai-tools/groq.ts`.
*   **Tools**: Reusable functions for agents (e.g., fetching URL content) are in `src/lib/loom/tools/`.
*   **Modularity**: The structure allows for adding new agents, modifying orchestration flows, and potentially integrating different LLM providers or tools.

This API is the backend foundation for Loom™ Studio's AI capabilities.
