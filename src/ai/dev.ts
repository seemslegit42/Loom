
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-data-cleanup-flow.ts';
import '@/ai/flows/summarize-webpage-flow.ts'; // Added new flow
import '@/ai/flows/execute-prompt-flow.ts'; // Added new flow for prompt execution

