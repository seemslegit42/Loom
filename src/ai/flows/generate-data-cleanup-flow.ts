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

const GenerateDataCleanupFlowOutputSchema = z.object({
  workflowDescription: z
    .string()
    .describe('A description of the generated data cleanup workflow.'),
  promptSequence: z
    .array(z.string())
    .describe('A sequence of prompts to achieve the data cleanup goal.'),
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

  Based on the user input, generate a data cleanup workflow by creating a sequence of prompts and a description of the workflow.

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
