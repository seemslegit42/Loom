
// src/components/panels/template-selector-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WorkflowNodeData, NodeType } from '@/components/workflow/workflow-node'; // Assuming Connection is defined in page.tsx or similar
import { BookMarked, LayoutTemplate } from 'lucide-react';

// This defines the structure of a template *before* it's loaded (no final IDs)
export interface WorkflowTemplateNode {
  localId: string; // Temporary ID for linking connections within the template
  title: string;
  type: NodeType;
  description: string;
  position?: { x: number; y: number };
  config?: Record<string, any>;
}

export interface WorkflowTemplateConnection {
  fromLocalId: string;
  toLocalId: string;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  nodes: WorkflowTemplateNode[];
  connections: WorkflowTemplateConnection[];
}

interface TemplateSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templates: WorkflowTemplate[];
  onLoadTemplate: (template: WorkflowTemplate) => void;
}

export function TemplateSelectorDialog({
  isOpen,
  onClose,
  templates,
  onLoadTemplate,
}: TemplateSelectorDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" />
            Select a Workflow Template
          </DialogTitle>
          <DialogDescription>
            Choose a pre-defined workflow to get started quickly.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6"> {/* Offset padding for scrollbar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {templates.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">No templates available yet.</p>
            )}
            {templates.map((template) => (
              <div
                key={template.name}
                className="p-4 border rounded-lg bg-card/50 hover:border-primary transition-colors flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-md font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <LayoutTemplate className="h-4 w-4 text-primary/80"/>
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                    {template.description}
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside mb-2">
                    <li>Nodes: {template.nodes.length}</li>
                    <li>Connections: {template.connections.length}</li>
                  </ul>
                </div>
                <Button
                  onClick={() => onLoadTemplate(template)}
                  size="sm"
                  className="w-full mt-auto"
                >
                  Load Template
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    