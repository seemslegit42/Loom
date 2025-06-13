
'use server';

/**
 * @fileOverview A flow to generate a data cleanup workflow based on natural language input.
 *
 * - generateDataCleanupFlow - A function that generates a data cleanup workflow.
 * - GenerateDataCleanupFlowInput - The input type for the generateDataCleanupFlow function.
 * - GenerateDataCleanupFlowOutput - The return type for the generateDataCleanupFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDataCleanupFlowInputSchema = z.object({
  userInput: z
    .string()
    .describe(
      'The user input describing the desired agent workflow or task. Example: "Summarize recent customer feedback emails and identify common themes."'
    ),
});
export type GenerateDataCleanupFlowInput = z.infer<typeof GenerateDataCleanupFlowInputSchema>;

// Note: This output schema is kept simple for now. 
// AI will generate a `workflowDescription` (which becomes workflowName)
// and `promptSequence` (which are simple strings).
// The CanvasZone will adapt these strings into more structured WorkflowNodeData for display if needed.
// Manually dragged nodes will directly use WorkflowNodeData.
const GenerateDataCleanupFlowOutputSchema = z.object({
  workflowDescription: z 
    .string()
    .describe('A concise name or high-level description for the generated workflow. e.g., "Customer Feedback Summarizer" or "Daily News Digest Agent"'),
  promptSequence: z
    .array(z.string())
    .describe('A sequence of textual prompts or steps to achieve the workflow goal. Each string is one step. e.g., ["Fetch unread emails with label \'feedback\'", "For each email, extract key points", "Categorize points and count occurrences"]'),
});
export type GenerateDataCleanupFlowOutput = z.infer<typeof GenerateDataCleanupFlowOutputSchema>;

export async function generateDataCleanupFlow(
  input: GenerateDataCleanupFlowInput
): Promise<GenerateDataCleanupFlowOutput> {
  return generateDataCleanupFlowFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDataCleanupPrompt',
  input: {schema: GenerateDataCleanupFlowInputSchema},
  output: {schema: GenerateDataCleanupFlowOutputSchema},
  prompt: `You are an AI workflow generator. Your task is to design an agentic workflow based on the user's request.

  Based on the user input, generate an agent workflow.
  Provide a concise 'workflowDescription' which will serve as the name/title of the workflow.
  Provide a 'promptSequence' which is an array of strings, where each string represents a high-level step or prompt in the agent's workflow.

  User Input: {{{userInput}}}
  `,
});

const generateDataCleanupFlowFlow = ai.defineFlow(
  {
    name: 'generateDataCleanupFlow',
    inputSchema: GenerateDataCleanupFlowInputSchema,
    outputSchema: GenerateDataCleanupFlowOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
