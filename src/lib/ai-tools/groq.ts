
import { createGroq } from '@ai-sdk/groq';

// Ensure GROQ_API_KEY is available in your environment variables
const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  // In a real application, you might want to throw an error or handle this case more gracefully.
  // For development, this warning helps. For production, ensure the key is set.
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'GROQ_API_KEY is not set. API calls to Groq will fail. Please set it in your .env file.',
    );
  }
}

export const groq = createGroq({
  apiKey: groqApiKey,
  // You can add other default configurations here if needed
  // such as baseURL, defaultHeaders, etc.
});

// Function to get a specific model instance
// It defaults to environment variables or a fallback model.
export const getGroqModel = (modelName?: string) => {
  const defaultModel = process.env.LOOM_SWARM_DEFAULT_MODEL || process.env.GROQ_MODEL_NAME || 'mixtral-8x7b-32768';
  return groq(modelName || defaultModel);
};
