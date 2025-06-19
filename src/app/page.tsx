
// src/app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { BottomBar } from '@/components/layout/bottom-bar';
import { CanvasZone, type Connection } from '@/components/canvas/canvas-zone';
import { PalettePanel } from '@/components/panels/palette-panel';
import { InspectorPanel } from '@/components/panels/inspector-panel';
import { TimelinePanel, type TimelineEvent } from '@/components/panels/timeline-panel';
import { ConsolePanel, type ConsoleMessage } from '@/components/panels/console-panel';
import { AgentHubPanel } from '@/components/panels/agent-hub-panel';
import { ActionConsolePanel, type ActionRequest } from '@/components/panels/action-console-panel';
import { TemplateSelectorDialog, type WorkflowTemplate } from '@/components/panels/template-selector-dialog';
import type { WorkflowNodeData, NodeStatus, NodeType } from '@/components/workflow/workflow-node';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { generateNodeId } from '@/lib/utils';
import { ResizableHorizontalPanes } from '@/components/layout/resizable-horizontal-panes';
import { ResizableVerticalPanes } from '@/components/layout/resizable-vertical-panes'; 
import { TooltipProvider } from '@/components/ui/tooltip';


// Import task functions and their types
import { summarizeWebpageTask, type SummarizeWebpageOutput, type SummarizeWebpageInput } from '@/tasks/summarize-webpage-task';
import { executePromptTask, type ExecutePromptOutput, type ExecutePromptInput } from '@/tasks/execute-prompt-task';

export interface BackendSummarizeOutput extends SummarizeWebpageOutput {}
export interface BackendExecutePromptOutput extends ExecutePromptOutput {}

export interface AiGeneratedFlowData {
  message: string | null;
  workflowName?: string;
  nodes: WorkflowNodeData[]; 
  error?: boolean;
  userInput?: string;
  swarmId?: string; 
}


import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp, where, writeBatch, getDoc, doc } from 'firebase/firestore';

export interface PanelVisibility {
  palette: boolean;
  inspector: boolean;
  timeline: boolean;
  console: boolean;
  agentHub: boolean;
  actionConsole: boolean;
}

export interface ConnectingState {
  fromNodeId: string;
  fromPortElement: HTMLDivElement | null; 
}

const exampleTemplates: WorkflowTemplate[] = [];
const initialActionRequests: ActionRequest[] = [];


export default function LoomStudioPage() {
  const [generatedFlow, setGeneratedFlow] = useState<AiGeneratedFlowData | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectingState, setConnectingState] = useState<ConnectingState | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    palette: true,
    inspector: true,
    timeline: true,
    console: true,
    agentHub: true,
    actionConsole: true, 
  });
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [nodeExecutionStatus, setNodeExecutionStatus] = useState<Record<string, NodeStatus>>({});
  const [consoleFilters, setConsoleFilters] = useState<Record<ConsoleMessage['type'], boolean>>({
    info: true,
    log: true,
    warn: true,
    error: true,
  });
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [actionRequests, setActionRequests] = useState<ActionRequest[]>(initialActionRequests);


  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    const fetchConsoleMessages = async () => {
      try {
        const generalMessagesCol = collection(db, 'console_logs');
        const generalQuery = query(generalMessagesCol, orderBy('timestamp', 'desc'), limit(25)); 
        const generalSnapshot = await getDocs(generalQuery);
        let fetchedMessages: ConsoleMessage[] = [];
        generalSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedMessages.push({
            type: data.type as ConsoleMessage['type'],
            text: data.text,
            timestamp: (data.timestamp as Timestamp).toDate(),
          });
        });

        if (generatedFlow?.swarmId) {
          const swarmDocRef = doc(db, 'loom_swarms', generatedFlow.swarmId);
          const swarmDocSnap = await getDoc(swarmDocRef);
          if (swarmDocSnap.exists()) {
             const swarmData = swarmDocSnap.data();
             if (swarmData && swarmData.logStream && Array.isArray(swarmData.logStream)) {
                 swarmData.logStream.forEach((logEntry: any) => {
                    if (logEntry.message && logEntry.timestamp) {
                        fetchedMessages.push({
                            type: 'log', 
                            text: `[Swarm: ${generatedFlow.swarmId?.substring(0,8)}] ${logEntry.message}`,
                            timestamp: (logEntry.timestamp as Timestamp).toDate(),
                        });
                    }
                 });
             }
          }
          
          const swarmSubLogsCol = collection(db, 'loom_swarms', generatedFlow.swarmId, 'logs');
          const swarmSubQuery = query(swarmSubLogsCol, orderBy('timestamp', 'asc'), limit(25)); 
          const swarmSubSnapshot = await getDocs(swarmSubQuery);
          swarmSubSnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedMessages.push({
              type: data.type as ConsoleMessage['type'] || 'log',
              text: `[Swarm: ${generatedFlow.swarmId?.substring(0,8)}] ${data.message || data.text}`,
              timestamp: (data.timestamp as Timestamp).toDate(),
            });
          });
        }
        
        fetchedMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        fetchedMessages = fetchedMessages.slice(0, 50); 

        setConsoleMessages(prev => [...fetchedMessages.reverse(), ...prev.filter(pm => !fetchedMessages.find(fm => fm.text === pm.text && fm.timestamp.getTime() === pm.timestamp.getTime()))]);

      } catch (error) {
        console.error("Error fetching console messages from Firestore:", error);
        const errorMsgText = 'Failed to load console history from Firestore.';
        const errorMsg: ConsoleMessage = {type: 'error', text: errorMsgText, timestamp: new Date()};
        setConsoleMessages(prev => {
           if (!prev.find(pm => pm.text === errorMsgText)) { 
            return [errorMsg, ...prev];
          }
          return prev;
        });
      }
    };
    fetchConsoleMessages();
  }, [generatedFlow?.swarmId]);

  const addConsoleMessage = useCallback(async (type: ConsoleMessage['type'], text: string, swarmIdForLog?: string) => {
    const newMessage: ConsoleMessage = { type, text, timestamp: new Date() };
    setConsoleMessages(prev => [newMessage, ...prev.slice(0, 199)]);

    try {
      if (swarmIdForLog) {
        await addDoc(collection(db, 'loom_swarms', swarmIdForLog, 'logs'), {
          type: newMessage.type,
          text: newMessage.text, 
          timestamp: Timestamp.fromDate(newMessage.timestamp),
        });
      } else {
        await addDoc(collection(db, 'console_logs'), {
          type: newMessage.type,
          text: newMessage.text,
          timestamp: Timestamp.fromDate(newMessage.timestamp),
        });
      }
    } catch (error) {
      console.error("Error adding console message to Firestore:", error);
      const errorMsgText = `Failed to save message to cloud console (${swarmIdForLog ? `swarm ${swarmIdForLog}` : 'console_logs'}).`;
      const errorMsg: ConsoleMessage = {type: 'error', text: errorMsgText, timestamp: new Date()};
      setConsoleMessages(prev => {
        if (!prev.find(pm => pm.text === errorMsgText)) {
          return [errorMsg, ...prev];
        }
        return prev;
      });
    }
  }, []);


  const addTimelineEvent = useCallback((event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    setTimelineEvents(prev => [{ ...event, id: crypto.randomUUID(), timestamp: new Date() }, ...prev.slice(0, 49)]);
  }, []);

  const handleAgentActionResponse = useCallback((requestId: string, responseStatus: 'approved' | 'denied' | 'responded', details?: string) => {
    const request = actionRequests.find(r => r.id === requestId);
    if (!request) return;

    setActionRequests(prev => prev.filter(r => r.id !== requestId)); 
    
    const logMessage = `Agent Action: Request ID ${requestId} (${request.requestType} from ${request.agentName}) was ${responseStatus}. ${details ? `Details: "${details}"` : ''}`;
    addConsoleMessage('info', logMessage);
    addTimelineEvent({ type: 'info', message: `User ${responseStatus} agent action: ${request.agentName}.` });
    
    toast({
      title: `Agent Action ${responseStatus.charAt(0).toUpperCase() + responseStatus.slice(1)}`,
      description: `Request from ${request.agentName} has been ${responseStatus}. ${details ? `Input: "${details.substring(0, 50)}${details.length > 50 ? "..." : ""}"` : ""}`,
    });
  }, [actionRequests, addConsoleMessage, addTimelineEvent, toast]);


  useEffect(() => {
    // No longer check for isMobile === undefined
    if (isMobile) {
      setPanelVisibility({ palette: false, inspector: false, timeline: false, console: false, agentHub: false, actionConsole: false });
    } else {
      setPanelVisibility({ palette: true, inspector: true, timeline: true, console: true, agentHub: true, actionConsole: true });
    }
  }, [isMobile]);

  const visualizeWorkflowExecution = useCallback(async () => {
    if (!generatedFlow || generatedFlow.nodes.length === 0 || !generatedFlow.workflowName) {
        addConsoleMessage('warn', 'No workflow or nodes available to visualize (or visualization simplified).');
        return;
    }
    
    const currentNodes = generatedFlow.nodes;
    const workflowName = generatedFlow.workflowName;

    addConsoleMessage('info', `Initializing node statuses for workflow: "${workflowName}".`);
    addTimelineEvent({ type: 'workflow_start', message: `Workflow "${workflowName}" initialized on canvas.` });

    const initialStatuses: Record<string, NodeStatus> = {};
    currentNodes.forEach(node => {
      initialStatuses[node.id] = 'queued'; 
      addTimelineEvent({ nodeId: node.id, nodeTitle: node.title, type: 'node_queued', message: `Node "${node.title}" initialized to queued.` });
    });
    setNodeExecutionStatus(initialStatuses);

    addConsoleMessage('info', `Workflow "${workflowName}" node statuses set to 'queued'. Awaiting user action or full workflow execution.`);

  }, [generatedFlow, addConsoleMessage, addTimelineEvent, setNodeExecutionStatus]);


  const handleFlowGenerated = useCallback((data: AiGeneratedFlowData) => {
    setGeneratedFlow(data); 
    setSelectedNode(null);
    
    if (data.swarmId) {
      addConsoleMessage('info', `Backend Swarm ID for this flow: ${data.swarmId}`);
    }

    if (data.error) {
      addConsoleMessage('error', `Failed to generate flow: ${data.message || 'Unknown error'}`);
      setTimelineEvents([]);
      setNodeExecutionStatus({});
      setConnections([]); 
    } else {
      if (data.nodes.length > 0 && data.workflowName) {
        addConsoleMessage('info', `Flow "${data.workflowName}" generated with ${data.nodes.length} steps. Preparing for display...`);

        const newConnections: Connection[] = [];
        for (let i = 0; i < data.nodes.length - 1; i++) {
          newConnections.push({
            id: `conn-${data.nodes[i].id}-to-${data.nodes[i+1].id}-${Date.now()}`,
            from: data.nodes[i].id,
            to: data.nodes[i+1].id,
          });
        }
        setConnections(newConnections);
        addConsoleMessage('info', `Auto-created ${newConnections.length} connections for the generated flow.`);
        
        Promise.resolve().then(() => visualizeWorkflowExecution());

      } else {
         addConsoleMessage('info', `Flow "${data.workflowName || 'Untitled Flow'}" generated but contained no actionable steps.`);
         setTimelineEvents([]);
         setNodeExecutionStatus({});
         setConnections([]); 
      }
    }
  }, [addConsoleMessage, visualizeWorkflowExecution]);

  const handleNodeDropped = (newNodeData: Omit<WorkflowNodeData, 'id' | 'status'> & { status?: NodeStatus }) => {
    const uniqueIndex = Date.now();
    const nodeTitleBase = newNodeData.title || 'Manual Node';
    const nodeId = generateNodeId('manual', nodeTitleBase, uniqueIndex);

    const nodeWithIdAndStatus: WorkflowNodeData = {
      ...newNodeData,
      id: nodeId,
      title: nodeTitleBase,
      description: newNodeData.description || `Manually added ${nodeTitleBase} node. Configure in Inspector.`,
      status: 'queued', 
      config: newNodeData.config || {},
    };

    setGeneratedFlow(prevFlow => {
      const currentNodes = prevFlow?.nodes || [];
      const isFirstNodeForNewWorkflow = !prevFlow || currentNodes.length === 0;
      const newWorkflowName = prevFlow?.workflowName || "My Custom Flow";

      if (isFirstNodeForNewWorkflow && !prevFlow?.workflowName) {
        addConsoleMessage('info', `New custom workflow "${newWorkflowName}" started by user adding node: "${nodeWithIdAndStatus.title}".`);
        addTimelineEvent({ type: 'workflow_start', message: `Custom workflow "${newWorkflowName}" started.`});
      }

      const updatedNodes = [...currentNodes, nodeWithIdAndStatus];
      return {
        message: prevFlow?.message || "Node added to canvas.", 
        userInput: prevFlow?.userInput || "Custom flow", 
        error: prevFlow?.error || false, 
        nodes: updatedNodes,
        workflowName: newWorkflowName,
      };
    });

    setSelectedNode(nodeWithIdAndStatus);
    addConsoleMessage('log', `Node "${nodeWithIdAndStatus.title}" (ID: ${nodeWithIdAndStatus.id}) added to canvas.`);
    setNodeExecutionStatus(prev => ({...prev, [nodeWithIdAndStatus.id]: nodeWithIdAndStatus.status! }));
    addTimelineEvent({
      nodeId: nodeWithIdAndStatus.id,
      nodeTitle: nodeWithIdAndStatus.title,
      type: 'node_queued',
      message: `Manual Node "${nodeWithIdAndStatus.title}" added and queued.`
    });
  };

  const handleNodeSelected = (node: WorkflowNodeData | null) => {
    if (node) {
      setSelectedNode(node);
      setConnectingState(null); 
      addConsoleMessage('log', `Node "${node.title}" (ID: ${node.id}) selected.`);
    } else {
      if (connectingState) {
        addConsoleMessage('info', `Connection attempt cancelled by clicking canvas background.`);
      }
      setSelectedNode(null);
      setConnectingState(null); 
      addConsoleMessage('log', `Canvas selected (no node).`);
    }
  };

  const handleNodeUpdate = (updatedNode: WorkflowNodeData) => {
     setGeneratedFlow(prevFlow => {
      if (!prevFlow) return prevFlow; 
      const newNodes = prevFlow.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n));
      return { ...prevFlow, nodes: newNodes };
    });
    setSelectedNode(updatedNode); 
    toast({ title: "Node Updated", description: `Node "${updatedNode.title}" has been saved.` });
    addConsoleMessage('info', `Node "${updatedNode.title}" (ID: ${updatedNode.id}) updated.`);
    
    const oldStatus = nodeExecutionStatus[updatedNode.id];
    if (updatedNode.status && oldStatus !== updatedNode.status) {
      setNodeExecutionStatus(prev => ({...prev, [updatedNode.id]: updatedNode.status! }));
      
      const statusToEventTypeMap: Partial<Record<NodeStatus, TimelineEvent['type']>> = {
        completed: 'node_completed',
        running: 'node_running',
        failed: 'node_failed',
        queued: 'node_queued',
      };
      const eventType: TimelineEvent['type'] = statusToEventTypeMap[updatedNode.status!] || 'info';
      
      addTimelineEvent({
        nodeId: updatedNode.id,
        nodeTitle: updatedNode.title,
        type: eventType,
        message: `Node "${updatedNode.title}" status manually updated to ${updatedNode.status}.`
      });
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    const nodeToDelete = generatedFlow?.nodes?.find(n => n.id === nodeId);
    if (!nodeToDelete) {
        addConsoleMessage('warn', `Attempted to delete non-existent node ID: ${nodeId}`);
        return;
    }

    setGeneratedFlow(prevFlow => {
      if (!prevFlow) return prevFlow; 
      const newNodes = prevFlow.nodes.filter(n => n.id !== nodeId);
      return { ...prevFlow, nodes: newNodes };
    });

    setConnections(prevConns => prevConns.filter(c => c.from !== nodeId && c.to !== nodeId));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    setNodeExecutionStatus(prevStatus => {
      const newStatus = { ...prevStatus };
      delete newStatus[nodeId];
      return newStatus;
    });
    addConsoleMessage('info', `Node "${nodeToDelete.title}" (ID: ${nodeId}) and its connections deleted.`);
    addTimelineEvent({ type: 'info', message: `Node "${nodeToDelete.title}" deleted.`});
    toast({ title: "Node Deleted", description: `Node "${nodeToDelete.title}" has been removed.`});
  };


  const handleRunNode = async (nodeId: string) => {
    const nodeToRun = generatedFlow?.nodes?.find(n => n.id === nodeId);
    if (!nodeToRun) {
      addConsoleMessage('error', `Attempted to run non-existent node ID: ${nodeId}`);
      return;
    }
    
    let nodeOutput: SummarizeWebpageOutput | ExecutePromptOutput | Record<string, any> | null = null;
    let nodeError: string | undefined = undefined;
    
    const runType = nodeToRun.type === 'web-summarizer' ? 'Web Summarizer' : nodeToRun.type === 'prompt' ? 'Prompt Node' : 'Node';
    
    setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? {...prev, status: 'running'} : null);
    }
    addConsoleMessage('info', `Executing individual ${runType}: "${nodeToRun.title}" (ID: ${nodeId}) - Calling task.`);
    addTimelineEvent({ nodeId, nodeTitle: nodeToRun.title, type: 'node_running', message: `Executing individual ${runType}: ${nodeToRun.title} (task)` });

    try {
      if (nodeToRun.type === 'web-summarizer') {
        const url = nodeToRun.config?.url;
        if (!url) {
          nodeError = "URL is missing for Web Summarizer.";
          nodeOutput = { error: nodeError, originalUrl: url || '' };
        } else {
          const taskInput: SummarizeWebpageInput = { url };
          nodeOutput = await summarizeWebpageTask(taskInput);
          if (nodeOutput.error) nodeError = nodeOutput.error;
          
          if (nodeOutput.logs && nodeOutput.logs.length > 0) {
             nodeOutput.logs.forEach(log => addConsoleMessage('log', `[Task: ${nodeToRun.title}] ${log}`, generatedFlow?.swarmId));
          }
        }
      } else if (nodeToRun.type === 'prompt') {
        const promptText = nodeToRun.config?.promptText;
        const modelName = nodeToRun.config?.modelName; 
        if (!promptText) {
          nodeError = "Prompt text is missing for Prompt Node.";
          nodeOutput = { error: nodeError };
        } else {
          const taskInput: ExecutePromptInput = { promptText, modelName };
          nodeOutput = await executePromptTask(taskInput);
          if (nodeOutput.error) nodeError = nodeOutput.error;
        }
      } else {
        nodeError = `Execution for node type '${nodeToRun.type}' (${nodeToRun.title}) is not implemented with a real backend task.`;
        nodeOutput = { error: nodeError };
        addConsoleMessage('warn', nodeError);
      }
    } catch (e: any) {
      nodeError = e.message || `An unexpected error occurred during ${runType} task execution.`;
      nodeOutput = { error: nodeError }; 
    }

    const finalStatus: NodeStatus = nodeError ? 'failed' : 'completed';
    const updatedNodeData: WorkflowNodeData = {
      ...nodeToRun,
      config: { ...nodeToRun.config, output: nodeOutput || { error: nodeError || "Unknown error during task execution" } },
      status: finalStatus,
    };

    setGeneratedFlow(prevFlow => {
      if (!prevFlow) return null; 
      return {
        ...(prevFlow),
        nodes: prevFlow.nodes.map(n => n.id === nodeId ? updatedNodeData : n),
      }
    });
    setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: updatedNodeData.status! }));
    if (selectedNode?.id === nodeId) setSelectedNode(updatedNodeData);

    if (nodeError) {
      addConsoleMessage('error', `Individual ${runType} "${updatedNodeData.title}" (task) failed: ${nodeError}`);
      addTimelineEvent({ nodeId, nodeTitle: updatedNodeData.title, type: 'node_failed', message: `Individual execution (task) failed: ${nodeError.substring(0,100)}...` });
      toast({ 
        title: "Node Execution Failed", 
        description: `Task for "${updatedNodeData.title}" (${runType}) failed: ${nodeError}`,
        variant: "destructive"
      });
    } else {
      addConsoleMessage('info', `Individual ${runType} "${updatedNodeData.title}" (task) completed.`);
      addTimelineEvent({ nodeId, nodeTitle: updatedNodeData.title, type: 'node_completed', message: `Individual ${runType} execution (task) completed.` });
      toast({ 
        title: "Node Executed", 
        description: `Task for "${updatedNodeData.title}" (${runType}) completed successfully.`
      });
    }
  };

  const isNodeRunning = (nodeId: string): boolean => nodeExecutionStatus[nodeId] === 'running';

  const togglePanel = (panel: keyof PanelVisibility) => {
    setPanelVisibility(prev => {
      const newState = { ...prev };
      const currentlyOpening = !prev[panel];
      if (isMobile) {
        if (currentlyOpening) {
          (Object.keys(newState) as Array<keyof PanelVisibility>).forEach(key => {
            if (key !== panel) newState[key] = false;
          });
          newState[panel] = true;
        } else {
          newState[panel] = false;
        }
      } else {
        newState[panel] = !prev[panel];
      }
      return newState;
    });
  };

  const closeAllMobilePanels = () => {
    if (isMobile) {
      setPanelVisibility({ palette: false, inspector: false, timeline: false, console: false, agentHub: false, actionConsole: false });
    }
  };

  const toggleConsoleFilter = (type: ConsoleMessage['type']) => {
    const newFilterState = !consoleFilters[type];
    setConsoleFilters(prev => ({ ...prev, [type]: newFilterState }));
    addConsoleMessage('log', `Console filter for "${type.toUpperCase()}" messages ${newFilterState ? 'enabled' : 'disabled'}.`);
  };

  const handleClearConsole = () => {
    const clearMessageText = 'Local console view cleared. Firestore logs are not affected by this action.';
    const clearMessageEntry: ConsoleMessage = { type: 'info', text: clearMessageText, timestamp: new Date() };
    setConsoleMessages([clearMessageEntry]);
    toast({ title: "Console Cleared", description: "Local console messages have been cleared." });
  };


  const handleOutputPortClick = (nodeId: string, portElement: HTMLDivElement) => {
    addConsoleMessage('log', `Output port clicked on node ${nodeId}. Waiting for input port selection.`);
    setConnectingState({ fromNodeId: nodeId, fromPortElement: portElement });
    setSelectedNode(generatedFlow?.nodes.find(n => n.id === nodeId) || null);
  };

  const handleInputPortClick = (nodeId: string) => {
    if (connectingState) {
      if (connectingState.fromNodeId === nodeId) {
        addConsoleMessage('warn', "Cannot connect a node to itself.");
        toast({title: "Connection Error", description: "Cannot connect a node to itself.", variant: "destructive"});
        setConnectingState(null);
        return;
      }
      if (connections.some(c => c.from === connectingState.fromNodeId && c.to === nodeId)) {
        addConsoleMessage('warn', `Connection from ${connectingState.fromNodeId} to ${nodeId} already exists.`);
        toast({title: "Connection Error", description: "This connection already exists.", variant: "secondary"});
        setConnectingState(null);
        return;
      }

      const newConnection: Connection = {
        id: `conn-${connectingState.fromNodeId}-to-${nodeId}-${Date.now()}`,
        from: connectingState.fromNodeId,
        to: nodeId,
      };
      setConnections(prev => [...prev, newConnection]);
      const fromNode = generatedFlow?.nodes.find(n=>n.id===connectingState.fromNodeId)?.title || 'source node';
      const toNode = generatedFlow?.nodes.find(n=>n.id===nodeId)?.title || 'target node';
      addConsoleMessage('info', `Connected node ${fromNode} to ${toNode}.`);
      toast({title: "Connection Created", description: `Connected ${fromNode} to ${toNode}.`});
      setConnectingState(null);
    }
  };

  const handleOpenTemplateSelector = () => {
    setIsTemplateSelectorOpen(true);
    addConsoleMessage('log', 'Template selector opened.');
  };

  const handleCloseTemplateSelector = () => {
    setIsTemplateSelectorOpen(false);
  };

  const handleLoadTemplate = useCallback((template: WorkflowTemplate) => {
    addConsoleMessage('info', `Loading template: "${template.name}"`);
    const idMap: Record<string, string> = {};
    const newNodes: WorkflowNodeData[] = template.nodes.map((nodeDef, index) => {
      const newNodeId = generateNodeId('template', nodeDef.title.replace(/\s+/g, '-'), `${Date.now()}-${index}`);
      idMap[nodeDef.localId] = newNodeId;
      return {
        ...nodeDef,
        id: newNodeId,
        status: 'queued' as NodeStatus,
        position: nodeDef.position || { x: 50 + index * 50, y: 100 + index * 50 }, 
      };
    });

    const newConnections: Connection[] = template.connections.map((connDef, index) => ({
      id: `conn-template-${Date.now()}-${index}`,
      from: idMap[connDef.fromLocalId],
      to: idMap[connDef.toLocalId],
    }));

    setGeneratedFlow({
      workflowName: template.name,
      nodes: newNodes,
      message: `Template "${template.name}" loaded.`,
      error: false,
    });
    setConnections(newConnections);
    setSelectedNode(null);
    setConnectingState(null);

    toast({ title: "Template Loaded", description: `Workflow "${template.name}" is ready.` });
    addTimelineEvent({ type: 'info', message: `Workflow template "${template.name}" loaded onto canvas.` });
    
    Promise.resolve().then(() => visualizeWorkflowExecution());
    setIsTemplateSelectorOpen(false);
  }, [addConsoleMessage, addTimelineEvent, toast, visualizeWorkflowExecution]);


  const anyMobilePanelOpen = isMobile && Object.values(panelVisibility).some(v => v);
  
  // Removed: if (isMobile === undefined) { ... } block

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar
        onFlowGenerated={handleFlowGenerated}
        addConsoleMessage={addConsoleMessage} 
        panelVisibility={panelVisibility}
        togglePanel={togglePanel}
        isMobile={isMobile}
        anyMobilePanelOpen={anyMobilePanelOpen}
        onOpenTemplateSelector={handleOpenTemplateSelector}
        swarmId={generatedFlow?.swarmId}
      />
      <main className={`flex-1 relative flex overflow-hidden ${isMobile ? 'p-0' : 'p-4 gap-4'} ${isMobile ? 'pb-16' : ''}`}>
        <div className={`flex-1 h-full transition-opacity duration-300 ${anyMobilePanelOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <CanvasZone
            workflowName={generatedFlow?.workflowName}
            nodes={generatedFlow?.nodes || []}
            connections={connections}
            onNodeDropped={handleNodeDropped}
            selectedNode={selectedNode}
            onNodeSelected={handleNodeSelected}
            nodeExecutionStatus={nodeExecutionStatus}
            onInputPortClick={handleInputPortClick}
            onOutputPortClick={handleOutputPortClick}
            connectingState={connectingState}
          />
        </div>

        {!isMobile ? (
          <>
            {panelVisibility.palette && (
              <PalettePanel className="absolute top-4 left-4 z-10" onClose={() => togglePanel('palette')} isMobile={isMobile} />
            )}
            <div className="absolute top-4 right-4 bottom-4 w-[360px] z-10 flex flex-col gap-4">
               <ResizableVerticalPanes 
                  storageKey="right-panels-split-v1"
                  initialDividerPosition={60} 
                  minPaneHeight={150}
                >
                  {panelVisibility.inspector && (
                    <TooltipProvider delayDuration={300}>
                      <InspectorPanel
                        key={selectedNode ? `inspector-desktop-${selectedNode.id}` : 'inspector-desktop-no-node'}
                        className="h-full" 
                        onClose={() => togglePanel('inspector')}
                        selectedNode={selectedNode}
                        onNodeUpdate={handleNodeUpdate}
                        onNodeDelete={handleDeleteNode}
                        isMobile={isMobile}
                        onRunNode={handleRunNode}
                        isNodeRunning={isNodeRunning}
                        isResizable={true} 
                        initialSize={{ width: '100%', height: '100%' }} 
                      />
                    </TooltipProvider>
                  )}
                  <div className="flex flex-col gap-4 h-full overflow-hidden"> 
                    {panelVisibility.agentHub && (
                       <AgentHubPanel
                        className="flex-1 min-h-0" 
                        onClose={() => togglePanel('agentHub')}
                        isMobile={isMobile}
                        addConsoleMessage={addConsoleMessage}
                        addTimelineEvent={addTimelineEvent}
                        isResizable={true}
                        initialSize={{ width: '100%', height: 'auto' }} 
                      />
                    )}
                    {panelVisibility.actionConsole && (
                       <ActionConsolePanel
                        className="flex-1 min-h-0" 
                        onClose={() => togglePanel('actionConsole')}
                        requests={actionRequests}
                        onRespond={handleAgentActionResponse}
                        isMobile={isMobile}
                        addConsoleMessage={addConsoleMessage}
                        addTimelineEvent={addTimelineEvent}
                        isResizable={true}
                        initialSize={{ width: '100%', height: 'auto' }}
                      />
                    )}
                  </div>
              </ResizableVerticalPanes>
            </div>
            
            <div className="absolute bottom-4 left-4 right-[calc(360px+theme(spacing.4)+theme(spacing.4))] h-[240px] z-10"> 
              <ResizableHorizontalPanes storageKey="bottom-panels-split-v1" minPaneWidth={200}>
                {panelVisibility.timeline && (
                  <TimelinePanel
                    onClose={() => togglePanel('timeline')}
                    events={timelineEvents}
                    isMobile={isMobile}
                    isResizable={true}
                    initialSize={{ width: 'auto', height: 'auto' }}
                    className="h-full w-full"
                  />
                )}
                {panelVisibility.console && (
                  <ConsolePanel
                    onClose={() => togglePanel('console')}
                    messages={consoleMessages.filter(msg => consoleFilters[msg.type])}
                    filters={consoleFilters}
                    onToggleFilter={toggleConsoleFilter}
                    onClearConsole={handleClearConsole}
                    isMobile={isMobile}
                    isResizable={true}
                    initialSize={{ width: 'auto', height: 'auto' }}
                    className="h-full w-full"
                  />
                )}
              </ResizableHorizontalPanes>
            </div>
          </>
        ) : (
          <>
            <div className={`fixed inset-y-0 left-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.palette ? 'translate-x-0' : '-translate-x-full'}`}>
              {panelVisibility.palette && <PalettePanel className="h-full" onClose={() => togglePanel('palette')} isMobile={isMobile} />}
            </div>
            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.inspector ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.inspector &&
                <TooltipProvider delayDuration={300}>
                  <InspectorPanel
                    key={selectedNode ? `inspector-mobile-${selectedNode.id}` : 'inspector-mobile-no-node'}
                    className="h-full overflow-y-auto"
                    onClose={() => togglePanel('inspector')}
                    selectedNode={selectedNode}
                    onNodeUpdate={handleNodeUpdate}
                    onNodeDelete={handleDeleteNode}
                    isMobile={isMobile}
                    onRunNode={handleRunNode}
                    isNodeRunning={isNodeRunning}
                  />
                </TooltipProvider>
              }
            </div>
             <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.agentHub ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.agentHub && <AgentHubPanel className="h-full" onClose={() => togglePanel('agentHub')} isMobile={isMobile} addConsoleMessage={addConsoleMessage} addTimelineEvent={addTimelineEvent} />}
            </div>
             <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.actionConsole ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.actionConsole && <ActionConsolePanel className="h-full" requests={actionRequests} onRespond={handleAgentActionResponse} onClose={() => togglePanel('actionConsole')} isMobile={isMobile} addConsoleMessage={addConsoleMessage} addTimelineEvent={addTimelineEvent} />}
            </div>
            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.timeline ? 'translate-y-0' : 'translate-y-full'} mb-14`}>
              {panelVisibility.timeline && <TimelinePanel className="h-full" onClose={() => togglePanel('timeline')} events={timelineEvents} isMobile={isMobile} />}
            </div>
            <div className={`fixed inset-x-0 bottom-0 z-40 h-3/5 bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.console ? 'translate-y-0' : 'translate-y-full'} mb-14`}>
              {panelVisibility.console && <ConsolePanel className="h-full" onClose={() => togglePanel('console')} messages={consoleMessages.filter(msg => consoleFilters[msg.type])} filters={consoleFilters} onToggleFilter={toggleConsoleFilter} onClearConsole={handleClearConsole} isMobile={isMobile} />}
            </div>
            {anyMobilePanelOpen && (
              <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={closeAllMobilePanels} aria-label="Close panel" role="button" />
            )}
          </>
        )}
        <TemplateSelectorDialog
          isOpen={isTemplateSelectorOpen}
          onClose={handleCloseTemplateSelector}
          templates={exampleTemplates} 
          onLoadTemplate={handleLoadTemplate}
        />
      </main>
      {isMobile && <BottomBar panelVisibility={panelVisibility} togglePanel={togglePanel} />}
    </div>
  );
}

