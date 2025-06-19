
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
    *   Initiates a new AI workflow swarm.
    *   **Request Body** (JSON):
        *   `topic` (string, optional but recommended): The main subject or goal for the swarm.
        *   `initialContent` (string, optional): Initial data or context for the swarm to process.
        *   `prompt` (string, optional): If `topic` and `initialContent` are not provided, `prompt` can be used as a general input, which will then be used as both topic and initial content for the basic swarm.
    *   **Response**: A streaming response (`text/event-stream` or similar via `toDataStreamResponse`) containing the real-time output from the agent swarm. This includes logs from initial agents and the final streamed output from the last agent in the chain.
    *   **Example Usage (curl)**:
        ```bash
        curl -X POST http://localhost:9002/api/loom/start \
        -H "Content-Type: application/json" \
        -d '{
              "topic": "The Future of AI in Software Development",
              "initialContent": "Recent advancements in large language models have shown significant potential for automating various aspects of the software development lifecycle, including code generation, testing, and documentation. However, challenges remain in areas such as complex reasoning, maintainability of AI-generated code, and ensuring ethical considerations are met."
            }' \
        --no-buffer
        ```
        Or using a general prompt:
        ```bash
        curl -X POST http://localhost:9002/api/loom/start \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Tell me about quantum computing."}' \
        --no-buffer
        ```

*   **`GET /api/loom/status`**:
    *   Returns the current status of the Loom API service and (conceptually) active swarms.
    *   **Current Implementation**: This is a placeholder. Full status tracking requires persistent state management for swarms.
    *   **Response** (JSON):
        ```json
        {
          "service": "Loom API",
          "swarmEngine": "Online (Simulated)",
          "activeSwarms": 0,
          "message": "Status endpoint is a placeholder. Full implementation requires swarm state management.",
          "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ"
        }
        ```

*   **`POST /api/loom/step`**:
    *   Sends a follow-up message or prompt to an ongoing workflow swarm.
    *   **Request Body** (JSON):
        *   `swarmId` (string, required): The ID of the active swarm to interact with.
        *   `message` (string, optional): The message/data to send to the swarm.
        *   `prompt` (string, optional): Alternative to `message`.
    *   **Current Implementation**: This is a placeholder. True stepping functionality requires robust session and state management for swarms.
    *   **Response** (JSON, Simulated):
        ```json
        {
          "message": "Step processed for swarm <swarmId> (Simulated). Further interaction with specific swarms requires persistent state management.",
          "nextExpectedAction": "Wait for results or provide further input if prompted by an agent.",
          "swarmId": "<swarmId>",
          "received": "<message_or_prompt_content>"
        }
        ```

*   **`GET /api/loom/logs`**:
    *   Streams detailed step-by-step debug output for a specific swarm or general recent activity.
    *   **Query Parameters**:
        *   `swarmId` (string, optional): The ID of the swarm to retrieve logs for. If omitted, might return recent general logs.
    *   **Current Implementation**: This is a placeholder and streams simulated log data. Real log streaming needs persistent log storage.
    *   **Response**: A streaming response (`text/plain`) with log entries.

### Architecture Notes

*   **Agents**: Defined in `src/lib/loom/agents.ts`. These are functions that perform specific tasks using the Groq LLM.
*   **Orchestrator**: Basic orchestration logic is in `src/lib/loom/orchestrator.ts`. This "queen" function (`startSimpleSwarm`) currently chains agents sequentially.
*   **LLM Provider**: Groq integration is managed via `@ai-sdk/provider-groq` and configured in `src/lib/ai-tools/groq.ts`.
*   **Modularity**: The structure allows for adding new agents, modifying orchestration flows, and potentially integrating different LLM providers or tools in the future.

This API is the backend foundation for Loom™ Studio's AI capabilities.
