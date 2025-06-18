
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
import type { WorkflowNodeData, NodeType } from '@/components/workflow/workflow-node'; 
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
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-card/90 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" />
            Select a Workflow Template
          </DialogTitle>
          <DialogDescription>
            Choose a pre-defined workflow to get started quickly.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6"> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {templates.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">No templates available yet.</p>
            )}
            {templates.map((template) => (
              <div
                key={template.name}
                className="p-4 border rounded-lg bg-card/50 hover:border-primary/70 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-md font-semibold text-foreground mb-1.5 flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5 text-primary/90 shrink-0"/>
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-3 h-[3em] overflow-hidden">
                    {template.description}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mb-3 border-t border-border/50 pt-2">
                    <li className="flex items-center justify-between"><span>Nodes:</span> <span className="font-medium text-foreground/80">{template.nodes.length}</span></li>
                    <li className="flex items-center justify-between"><span>Connections:</span> <span className="font-medium text-foreground/80">{template.connections.length}</span></li>
                  </ul>
                </div>
                <Button
                  onClick={() => onLoadTemplate(template)}
                  size="sm"
                  className="w-full mt-auto"
                  variant="secondary"
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
    
