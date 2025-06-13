
// src/lib/actions/ai.ts
'use server';
import { generateDataCleanupFlow, type GenerateDataCleanupFlowInput } from '@/ai/flows/generate-data-cleanup-flow';
import type { WorkflowNodeData } from '@/components/workflow/workflow-node';
import { z } from 'zod';

const GenerateFlowSchema = z.object({
  userInput: z.string().min(5, "Please provide a more detailed description for the flow."),
});

// Helper to generate safe IDs
const generateNodeId = (type: 'ai' | 'manual', workflowName: string, index: number | string): string => {
  const safeWorkflowName = workflowName.replace(/\s+/g, '-').toLowerCase();
  return `${type}-node-${safeWorkflowName}-${index}`;
};

export interface GenerateFlowFormState {
  message: string | null;
  workflowName?: string;
  nodes?: WorkflowNodeData[]; // Unified list of all nodes
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
      nodes: prevState.nodes, // Preserve existing nodes on validation error
    };
  }

  try {
    const input: GenerateDataCleanupFlowInput = { userInput: validatedFields.data.userInput };
    const aiResult = await generateDataCleanupFlow(input);

    const workflowName = aiResult.workflowDescription;
    const aiNodes: WorkflowNodeData[] = (aiResult.promptSequence || []).map((promptText, index) => ({
      id: generateNodeId('ai', workflowName, index),
      title: `${workflowName} Step ${index + 1}`,
      description: promptText,
      type: 'prompt', // Default type for AI-generated steps
      status: 'queued', // Initial status
    }));

    return {
      message: "Flow generated successfully!",
      workflowName: workflowName,
      nodes: aiNodes, // AI generation creates a new set of nodes
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
      nodes: prevState.nodes, // Preserve existing nodes on API error
    };
  }
}
