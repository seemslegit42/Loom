// src/lib/actions/ai.ts
'use server';
import { generateDataCleanupFlow, type GenerateDataCleanupFlowInput } from '@/ai/flows/generate-data-cleanup-flow';
import { z } from 'zod';

const GenerateFlowSchema = z.object({
  userInput: z.string().min(5, "Please provide a more detailed description for the flow."),
});

export interface GenerateFlowFormState {
  message: string | null;
  workflowDescription?: string;
  promptSequence?: string[];
  error?: boolean;
  userInput?: string;
}

export async function handleGenerateFlow(
  prevState: GenerateFlowFormState,
  formData: FormData
): Promise<GenerateFlowFormState> {
  const userInput = formData.get('userInput');
  const validatedFields = GenerateFlowSchema.safeParse({
    userInput: userInput,
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid input: " + validatedFields.error.flatten().fieldErrors.userInput?.join(", "),
      error: true,
      userInput: typeof userInput === 'string' ? userInput : '',
    };
  }

  try {
    const input: GenerateDataCleanupFlowInput = { userInput: validatedFields.data.userInput };
    const result = await generateDataCleanupFlow(input);
    return {
      message: "Flow generated successfully!",
      workflowDescription: result.workflowDescription,
      promptSequence: result.promptSequence,
      error: false,
      userInput: validatedFields.data.userInput,
    };
  } catch (e) {
    const error = e as Error;
    console.error("Error generating flow:", error);
    return {
      message: `Failed to generate flow. Please try again. Error: ${error.message}`,
      error: true,
      userInput: validatedFields.data.userInput,
    };
  }
}
