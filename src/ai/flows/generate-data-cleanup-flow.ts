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
      'The user input describing the desired data cleanup workflow. Example: Generate a new data cleanup flow'
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
    .describe('A concise name or high-level description for the generated data cleanup workflow. e.g., "Customer Address Normalization"'),
  promptSequence: z
    .array(z.string())
    .describe('A sequence of textual prompts or steps to achieve the data cleanup goal. Each string is one step. e.g., ["Identify missing street numbers", "Standardize city names to uppercase"]'),
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
  prompt: `You are an AI workflow generator specializing in data cleanup.

  Based on the user input, generate a data cleanup workflow.
  Provide a concise 'workflowDescription' which will serve as the name of the flow.
  Provide a 'promptSequence' which is an array of strings, where each string represents a textual description of a step or prompt in the workflow.

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
