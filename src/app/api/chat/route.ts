
// src/app/api/chat/route.ts
import { Groq } from 'groq-sdk';
import { StreamingTextResponse, LangchainStream, Message as VercelChatMessage } from 'ai';
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { BytesOutputParser } from "@langchain/core/output_parsers";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: VercelChatMessage[] = body.messages ?? [];
    const currentMessageContent = messages[messages.length - 1]?.content;
    const requestedModelName = body.modelName;

    if (!currentMessageContent) {
      return new Response(JSON.stringify({ error: 'Prompt is required in messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY is not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resolvedModelName = requestedModelName || process.env.GROQ_MODEL_NAME || "mixtral-8x7b-32768";

    const model = new ChatGroq({
      apiKey: groqApiKey,
      modelName: resolvedModelName,
      temperature: 0.7,
    });

    const promptTemplate = PromptTemplate.fromTemplate(
      "You are a helpful AI assistant. Respond to the following user message: {userMessage}"
    );
    
    const outputParser = new BytesOutputParser();
    const chain = promptTemplate.pipe(model).pipe(outputParser);
    
    const { stream, handlers } = LangchainStream();

    chain.invoke(
      { userMessage: currentMessageContent },
      { callbacks: [handlers] }
    );
    
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error('[API CHAT ROUTE] Error:', error);
    let errorMessage = 'An unknown error occurred processing your request.';
    if (error.message) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
