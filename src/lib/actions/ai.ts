// src/lib/actions/ai.ts
'use server';
import { generateDataCleanupFlow, type GenerateDataCleanupFlowInput } from '@/ai/flows/generate-data-cleanup-flow';
import type { WorkflowNodeData } from '@/components/workflow/workflow-node';
import { z } from 'zod';

const GenerateFlowSchema = z.object({
  userInput: z.string().min(5, "Please provide a more detailed description for the flow."),
});

export interface GenerateFlowFormState {
  message: string | null;
  workflowName?: string; // Renamed from workflowDescription
  promptSequence?: string[]; // AI-generated simple prompts
  manualNodes?: WorkflowNodeData[]; // User-dragged nodes
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
      manualNodes: prevState.manualNodes, // Preserve manual nodes on validation error
    };
  }

  try {
    const input: GenerateDataCleanupFlowInput = { userInput: validatedFields.data.userInput };
    // The AI flow currently returns workflowDescription and promptSequence
    const result = await generateDataCleanupFlow(input); 
    return {
      message: "Flow generated successfully!",
      workflowName: result.workflowDescription, // Adapt to new name
      promptSequence: result.promptSequence,
      manualNodes: [], // Clear manual nodes when AI generates a new flow
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
      manualNodes: prevState.manualNodes, // Preserve manual nodes on API error
    };
  }
}
