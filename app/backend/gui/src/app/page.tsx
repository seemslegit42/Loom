
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
import type { WorkflowNodeData, NodeStatus } from '@/components/workflow/workflow-node';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { generateNodeId } from '@/lib/utils';

// Placeholder types for backend interactions (to be defined based on FastAPI SuperAGI)
export interface BackendSummarizeOutput {
  summary?: string;
  originalUrl?: string;
  error?: string;
}
export interface BackendExecutePromptOutput {
  responseText?: string;
  error?: string;
}
export interface AiGeneratedFlowData {
  message: string | null;
  workflowName?: string;
  nodes?: WorkflowNodeData[];
  error?: boolean;
  userInput?: string;
}


import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export interface PanelVisibility {
  palette: boolean;
  inspector: boolean;
  timeline: boolean;
  console: boolean;
  agentHub: boolean;
}

export interface ConnectingState {
  fromNodeId: string;
  fromPortElement: HTMLDivElement | null; // Store the element for position
}

export default function LoomStudioPage() {
  const [generatedFlow, setGeneratedFlow] = useState<AiGeneratedFlowData & { nodes: WorkflowNodeData[] } | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectingState, setConnectingState] = useState<ConnectingState | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    palette: true,
    inspector: true,
    timeline: true,
    console: true,
    agentHub: true,
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

  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    const fetchConsoleMessages = async () => {
      try {
        const messagesCol = collection(db, 'console_logs');
        const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedMessages: ConsoleMessage[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedMessages.push({
            type: data.type as ConsoleMessage['type'],
            text: data.text,
            timestamp: (data.timestamp as Timestamp).toDate(),
          });
        });
        setConsoleMessages(prev => [...fetchedMessages.reverse(), ...prev.filter(pm => !fetchedMessages.find(fm => fm.text === pm.text && fm.timestamp.getTime() === pm.timestamp.getTime()))]);
      } catch (error) {
        console.error("Error fetching console messages from Firestore:", error);
        const errorMsgText = 'Failed to load console history from Firestore.';
        const errorMsg: ConsoleMessage = {type: 'error', text: errorMsgText, timestamp: new Date()};
        setConsoleMessages(prev => {
           if (!prev.find(pm => pm.text === errorMsgText)) { // Avoid duplicate error messages
            return [errorMsg, ...prev];
          }
          return prev;
        });
      }
    };
    fetchConsoleMessages();
  }, []);

  const addConsoleMessage = useCallback(async (type: ConsoleMessage['type'], text: string) => {
    const newMessage: ConsoleMessage = { type, text, timestamp: new Date() };
    setConsoleMessages(prev => [newMessage, ...prev.slice(0, 199)]);
    try {
      await addDoc(collection(db, 'console_logs'), {
        type: newMessage.type,
        text: newMessage.text,
        timestamp: Timestamp.fromDate(newMessage.timestamp),
      });
    } catch (error) {
      console.error("Error adding console message to Firestore:", error);
      const errorMsgText = 'Failed to save message to cloud console.';
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

  useEffect(() => {
    if (isMobile === undefined) return;
    if (isMobile) {
      setPanelVisibility({ palette: false, inspector: false, timeline: false, console: false, agentHub: false });
    } else {
      setPanelVisibility({ palette: true, inspector: true, timeline: true, console: true, agentHub: true });
    }
  }, [isMobile]);

  const visualizeWorkflowExecution = useCallback(async () => {
    if (!generatedFlow || !generatedFlow.nodes || generatedFlow.nodes.length === 0 || !generatedFlow.workflowName) {
        addConsoleMessage('warn', 'No workflow or nodes available to visualize.');
        return;
    }
    
    const currentNodes = generatedFlow.nodes;
    const currentConnections = connections;
    const workflowName = generatedFlow.workflowName;

    addConsoleMessage('info', `Visualizing workflow: "${workflowName}" based on connections.`);
    addTimelineEvent({ type: 'workflow_start', message: `Workflow "${workflowName}" visualization started.` });

    const initialStatuses: Record<string, NodeStatus> = {};
    currentNodes.forEach(node => initialStatuses[node.id] = 'pending');
    setNodeExecutionStatus(initialStatuses);

    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    const nodeLookup: Record<string, WorkflowNodeData> = {};

    currentNodes.forEach(node => {
        adj[node.id] = [];
        inDegree[node.id] = 0;
        nodeLookup[node.id] = node;
    });

    currentConnections.forEach(conn => {
        if (adj[conn.from] && nodeLookup[conn.to]) {
            adj[conn.from].push(conn.to);
            inDegree[conn.to]++;
        }
    });

    const queue: string[] = currentNodes.filter(node => inDegree[node.id] === 0).map(node => node.id);
    let executionOrderIndex = 0;
    let activeSimulations = 0;
    const completedNodes = new Set<string>();
    const failedNodes = new Set<string>();

    const processNode = async (nodeId: string) => {
      if (failedNodes.has(nodeId) || completedNodes.has(nodeId)) return;

      activeSimulations++;
      const node = nodeLookup[nodeId];
      if (!node) {
        addConsoleMessage('error', `Node ID ${nodeId} not found during visualization.`);
        activeSimulations--;
        failedNodes.add(nodeId);
        return;
      }
      const nodeTitle = node.title;

      await new Promise(resolve => setTimeout(resolve, 300 * executionOrderIndex++));
      setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'queued' }));
      addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) queued for visualization.`);
      addTimelineEvent({ nodeId, nodeTitle, type: 'node_queued', message: `Node "${nodeTitle}" queued (visualization).` });

      await new Promise(resolve => setTimeout(resolve, 700));
      setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
      addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) running (visualization).`);
      addTimelineEvent({ nodeId, nodeTitle, type: 'node_running', message: `Node "${nodeTitle}" running (visualization).` });
      
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 800)); 
      const success = Math.random() > 0.1; // Simulate success/failure

      if (success) {
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'completed' }));
        addConsoleMessage('log', `Node "${nodeTitle}" (ID: ${nodeId}) completed (visualization).`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_completed', message: `Node "${nodeTitle}" completed (visualization).` });
        completedNodes.add(nodeId);

        adj[nodeId]?.forEach(neighborId => {
          if (nodeLookup[neighborId]) {
            inDegree[neighborId]--;
            if (inDegree[neighborId] === 0 && !failedNodes.has(neighborId)) {
              queue.push(neighborId);
            }
          }
        });
      } else {
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'failed' }));
        addConsoleMessage('error', `Node "${nodeTitle}" (ID: ${nodeId}) failed (visualization).`);
        addTimelineEvent({ nodeId, nodeTitle, type: 'node_failed', message: `Node "${nodeTitle}" failed (visualization).` });
        failedNodes.add(nodeId);
      }
      activeSimulations--;

      if (queue.length > 0) {
          const nextNodeId = queue.shift();
          if (nextNodeId) processNode(nextNodeId);
      } else if (activeSimulations === 0) {
          if (failedNodes.size > 0) {
              addConsoleMessage('error', `Workflow "${workflowName}" visualization finished with errors.`);
              addTimelineEvent({ type: 'workflow_failed', message: `Workflow "${workflowName}" visualization finished with errors.` });
          } else if (completedNodes.size === currentNodes.length) {
              addConsoleMessage('info', `Workflow "${workflowName}" visualization completed successfully.`);
              addTimelineEvent({ type: 'workflow_completed', message: `Workflow "${workflowName}" visualization completed.` });
          } else {
              addConsoleMessage('warn', `Workflow "${workflowName}" visualization completed with some nodes not reached.`);
              addTimelineEvent({ type: 'info', message: `Workflow "${workflowName}" visualization completed with some nodes not reached.` });
          }
      }
    };

    if (queue.length === 0 && currentNodes.length > 0) {
        addConsoleMessage('error', `Workflow "${workflowName}" has no starting nodes for visualization (check connections).`);
        addTimelineEvent({ type: 'workflow_failed', message: `Workflow "${workflowName}" visualization errors (e.g., no start nodes).` });
        currentNodes.forEach(node => setNodeExecutionStatus(prev => ({...prev, [node.id]: 'failed'})));
        return;
    }
    
    while(queue.length > 0 && activeSimulations < 3) { // Limit concurrent simulations for clarity
        const nodeIdToProcess = queue.shift();
        if (nodeIdToProcess) processNode(nodeIdToProcess);
    }
  }, [generatedFlow, connections, addConsoleMessage, addTimelineEvent, setNodeExecutionStatus]);


  const handleFlowGenerated = useCallback((data: AiGeneratedFlowData) => {
    const newFlowData = data as AiGeneratedFlowData & { nodes: WorkflowNodeData[] };
    
    if (!newFlowData.nodes) { // Ensure nodes array exists
      newFlowData.nodes = [];
    }

    setGeneratedFlow(newFlowData); 
    setSelectedNode(null);
    
    if (data.error) {
      addConsoleMessage('error', `Failed to generate flow: ${data.message}`);
      setTimelineEvents([]);
      setNodeExecutionStatus({});
      setConnections([]); 
    } else {
      if (newFlowData.nodes && newFlowData.nodes.length > 0 && newFlowData.workflowName) {
        addConsoleMessage('info', `Flow "${newFlowData.workflowName}" generated with ${newFlowData.nodes.length} steps. Preparing visualization...`);

        const newConnections: Connection[] = [];
        for (let i = 0; i < newFlowData.nodes.length - 1; i++) {
          newConnections.push({
            id: `conn-${newFlowData.nodes[i].id}-to-${newFlowData.nodes[i+1].id}-${Date.now()}`,
            from: newFlowData.nodes[i].id,
            to: newFlowData.nodes[i+1].id,
          });
        }
        setConnections(newConnections);
        addConsoleMessage('info', `Auto-created ${newConnections.length} connections for the generated flow.`);
        
        // Delay visualization slightly to allow state updates to propagate
        Promise.resolve().then(() => visualizeWorkflowExecution());

      } else {
         addConsoleMessage('info', `Flow "${newFlowData.workflowName || 'Untitled Flow'}" generated but contained no actionable steps.`);
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
      status: newNodeData.status || 'queued',
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
        ...(prevFlow || { message: "Node added to canvas.", userInput: "Custom flow", error: false }),
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
    setSelectedNode(node);
    if (node) {
      setConnectingState(null);
      addConsoleMessage('log', `Node "${node.title}" (ID: ${node.id}) selected.`);
    } else {
      if (!connectingState) { 
        addConsoleMessage('log', `Canvas selected (no node).`);
      }
    }
  };

  const handleNodeUpdate = (updatedNode: WorkflowNodeData) => {
     setGeneratedFlow(prevFlow => {
      if (!prevFlow || !prevFlow.nodes) return prevFlow;
      const newNodes = prevFlow.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n));
      return { ...prevFlow, nodes: newNodes };
    });
    setSelectedNode(updatedNode); 
    toast({ title: "Node Updated", description: `Node "${updatedNode.title}" has been saved.` });
    addConsoleMessage('info', `Node "${updatedNode.title}" (ID: ${updatedNode.id}) updated.`);
    const oldStatus = nodeExecutionStatus[updatedNode.id];
    if (updatedNode.status && oldStatus !== updatedNode.status) {
      setNodeExecutionStatus(prev => ({...prev, [updatedNode.id]: updatedNode.status! }));
      let eventType: TimelineEvent['type'] = 'info';
      switch(updatedNode.status) {
        case 'completed': eventType = 'node_completed'; break;
        case 'running': eventType = 'node_running'; break;
        case 'failed': eventType = 'node_failed'; break;
        case 'queued': eventType = 'node_queued'; break;
        default: eventType = 'info'; break;
      }
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
      if (!prevFlow || !prevFlow.nodes) return prevFlow;
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
    let nodeOutput: BackendSummarizeOutput | BackendExecutePromptOutput | Record<string, any> | null = null;
    let nodeError: string | undefined = undefined;
    let finalStatus: NodeStatus = 'failed';
    
    const runType = nodeToRun.type === 'web-summarizer' ? 'Web Summarizer' 
                  : nodeToRun.type === 'prompt' ? 'Prompt Node' 
                  : nodeToRun.type === 'conditional' ? 'Conditional Node'
                  : nodeToRun.type === 'data-transform' ? 'Data Transform Node'
                  : 'Node';
    addConsoleMessage('info', `Executing individual ${runType}: "${nodeToRun.title}" (ID: ${nodeId}) - Simulating backend call.`);
    addTimelineEvent({ nodeId, nodeTitle: nodeToRun.title, type: 'node_running', message: `Executing individual ${runType}: ${nodeToRun.title} (simulation)` });
    setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
    if (selectedNode?.id === nodeId) setSelectedNode(prev => prev ? {...prev, status: 'running'} : null);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    try {
      if (nodeToRun.type === 'web-summarizer') {
        const url = nodeToRun.config?.url;
        if (!url) {
          nodeError = "URL is missing for Web Summarizer.";
          toast({ title: "Missing Configuration", description: nodeError, variant: "destructive" });
        } else {
          if (Math.random() > 0.2) {
            nodeOutput = { summary: `This is a simulated summary for ${url}. The real summary would come from the SuperAGI backend.`, originalUrl: url };
          } else {
            nodeError = "Simulated API error: Failed to summarize webpage.";
            nodeOutput = { error: nodeError, originalUrl: url };
          }
        }
      } else if (nodeToRun.type === 'prompt') {
        const promptText = nodeToRun.config?.promptText;
        const modelName = nodeToRun.config?.modelName; 
        if (!promptText) {
          nodeError = "Prompt text is missing for Prompt Node.";
          toast({ title: "Missing Configuration", description: nodeError, variant: "destructive" });
        } else {
          if (Math.random() > 0.2) {
            nodeOutput = { responseText: `Simulated LLM response to: "${promptText}". Model: ${modelName || 'default'}. This would come from SuperAGI.` };
          } else {
            nodeError = "Simulated API error: LLM failed to respond.";
            nodeOutput = { error: nodeError };
          }
        }
      } else if (nodeToRun.type === 'conditional') {
        const condition = nodeToRun.config?.condition;
        if(!condition) {
            nodeError = "Condition expression is missing for Conditional Node.";
            toast({ title: "Missing Configuration", description: nodeError, variant: "destructive"});
        } else {
            // Simulate condition evaluation
            const result = Math.random() > 0.5; // Simulate true/false
            nodeOutput = { conditionResult: result, conditionChecked: condition, nextStep: result ? "Path A (True)" : "Path B (False)"};
        }
      } else if (nodeToRun.type === 'data-transform') {
        const logic = nodeToRun.config?.transformationLogic;
        if(!logic) {
            nodeError = "Transformation logic is missing for Data Transform Node.";
            toast({ title: "Missing Configuration", description: nodeError, variant: "destructive"});
        } else {
            // Simulate data transformation
            nodeOutput = { transformedData: { input: "some_data", output: "transformed_data_based_on_logic" }, logicApplied: logic };
        }
      } else { // For 'agent-call', 'custom', etc.
        nodeError = `Node type "${nodeToRun.type}" individual execution is simulated.`;
        nodeOutput = { simulatedOutput: `Output from simulated ${nodeToRun.type} node.` };
      }
      finalStatus = nodeError ? 'failed' : 'completed';
    } catch (e: any) {
      nodeError = e.message || `An unexpected error occurred during ${runType} execution simulation.`;
      finalStatus = 'failed';
    }

    const updatedNodeData: WorkflowNodeData = {
      ...nodeToRun,
      config: { ...nodeToRun.config, output: nodeOutput || { error: nodeError || "Unknown error during simulation" } },
      status: finalStatus,
    };

    setGeneratedFlow(prevFlow => {
      if (!prevFlow || !prevFlow.nodes) return null; 
      return {
        ...(prevFlow),
        nodes: prevFlow.nodes.map(n => n.id === nodeId ? updatedNodeData : n),
      }
    });
    setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: updatedNodeData.status! }));
    if (selectedNode?.id === nodeId) setSelectedNode(updatedNodeData);

    if (nodeError) {
      addConsoleMessage('error', `Individual ${runType} "${updatedNodeData.title}" (simulation) failed: ${nodeError}`);
      addTimelineEvent({ nodeId, nodeTitle: updatedNodeData.title, type: 'node_failed', message: `Individual execution (simulation) failed: ${nodeError.substring(0,100)}...` });
    } else {
      addConsoleMessage('info', `Individual ${runType} "${updatedNodeData.title}" (simulation) completed.`);
      addTimelineEvent({ nodeId, nodeTitle: updatedNodeData.title, type: 'node_completed', message: `Individual ${runType} execution (simulation) completed.` });
      toast({ title: "Node Executed (Simulated)", description: `${updatedNodeData.title} (${runType}) completed its simulation.` });
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
      setPanelVisibility({ palette: false, inspector: false, timeline: false, console: false, agentHub: false });
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
    // No need to call addConsoleMessage for this specific action as it adds to Firestore
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

  const anyMobilePanelOpen = isMobile && Object.values(panelVisibility).some(v => v);
  if (isMobile === undefined) {
    return <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center text-lg">Loading UI...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar
        onFlowGenerated={handleFlowGenerated}
        panelVisibility={panelVisibility}
        togglePanel={togglePanel}
        isMobile={isMobile}
        anyMobilePanelOpen={anyMobilePanelOpen}
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
            {panelVisibility.inspector && (
              <InspectorPanel
                key={selectedNode ? `inspector-desktop-${selectedNode.id}` : 'inspector-desktop-no-node'}
                className="absolute top-4 right-4 z-10 max-h-[calc(100vh_-_theme(spacing.16)_-_theme(spacing.8))]"
                onClose={() => togglePanel('inspector')}
                selectedNode={selectedNode}
                onNodeUpdate={handleNodeUpdate}
                onNodeDelete={handleDeleteNode}
                isMobile={isMobile}
                onRunNode={handleRunNode}
                isNodeRunning={isNodeRunning}
              />
            )}
            <div className="absolute bottom-4 left-4 right-4 flex gap-4 z-10">
              {panelVisibility.timeline && (
                <TimelinePanel
                  className="flex-1 min-w-[300px]"
                  onClose={() => togglePanel('timeline')}
                  events={timelineEvents}
                  isMobile={isMobile}
                />
              )}
              {panelVisibility.console && (
                <ConsolePanel
                  className="flex-1 min-w-[300px]"
                  onClose={() => togglePanel('console')}
                  messages={consoleMessages.filter(msg => consoleFilters[msg.type])}
                  filters={consoleFilters}
                  onToggleFilter={toggleConsoleFilter}
                  onClearConsole={handleClearConsole}
                  isMobile={isMobile}
                />
              )}
            </div>
            {panelVisibility.agentHub && (
              <AgentHubPanel
                className="absolute bottom-[calc(250px+2rem)] right-4 z-10 max-h-[calc(100vh_-_theme(spacing.16)_-_250px_-_theme(spacing.12))]"
                onClose={() => togglePanel('agentHub')}
                isMobile={isMobile}
                addConsoleMessage={addConsoleMessage}
                addTimelineEvent={addTimelineEvent}
              />
            )}
          </>
        ) : (
          <>
            <div className={`fixed inset-y-0 left-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.palette ? 'translate-x-0' : '-translate-x-full'}`}>
              {panelVisibility.palette && <PalettePanel className="h-full" onClose={() => togglePanel('palette')} isMobile={isMobile} />}
            </div>
            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.inspector ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.inspector &&
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
                />}
            </div>
            <div className={`fixed inset-y-0 right-0 z-40 w-4/5 max-w-sm bg-card/90 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ease-in-out ${panelVisibility.agentHub ? 'translate-x-0' : 'translate-x-full'}`}>
              {panelVisibility.agentHub && <AgentHubPanel className="h-full" onClose={() => togglePanel('agentHub')} isMobile={isMobile} addConsoleMessage={addConsoleMessage} addTimelineEvent={addTimelineEvent} />}
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
      </main>
      {isMobile && <BottomBar panelVisibility={panelVisibility} togglePanel={togglePanel} />}
    </div>
  );
}
