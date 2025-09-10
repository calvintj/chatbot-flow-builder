// page.tsx

"use client";

import type React from "react";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Plus, Download, LayoutGrid } from "lucide-react";
import { StepNode } from "@/components/step-node";
import { EditingPanel, type NodeDataType } from "@/components/editing-panel";
import { ExportModal } from "@/components/export-modal";
import { CustomEdge } from "@/components/custom-edge";

// Sample initial data matching the provided structure
const initialSteps = [
  {
    step_id: 1,
    instruction: "Ask how often the user travels.",
    answer_options: {
      states_frequency: "States travel frequency.",
      irrelevant_answer: "Irrelevant answer.",
    },
    transitions: {
      states_frequency: 2,
      irrelevant_answer: 4,
    },
    few_shot_examples: {
      states_frequency: [
        {
          bot_prompt: "How often do you travel?",
          user_answer: "Twice a year.",
        },
      ],
    },
    nodeType: "first" as const, // Add default node type
  },
];

const initialNodes: Node<NodeDataType>[] = [
  {
    id: "1",
    type: "stepNode",
    position: { x: 250, y: 100 },
    data: initialSteps[0],
  },
];

const initialEdges: Edge[] = [];

const nodeTypes = {
  stepNode: StepNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Removed automatic first/last detection - now manually controlled

export default function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<NodeDataType>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeDataType> | null>(
    null
  );
  const [showExportModal, setShowExportModal] = useState(false);
  const [nextStepId, setNextStepId] = useState(2);

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const deletedEdges = changes
        .filter((change) => change.type === "remove")
        .map((change) => edges.find((edge) => edge.id === change.id))
        .filter(Boolean) as Edge[];

      if (deletedEdges.length > 0) {
        setNodes((nds) =>
          nds.map((node) => {
            const edgesToRemove = deletedEdges.filter(
              (edge) => edge.source === node.id
            );
            if (edgesToRemove.length > 0) {
              const updatedTransitions = { ...node.data.transitions };
              edgesToRemove.forEach((edge) => {
                if (edge.data?.sourceHandle) {
                  delete updatedTransitions[edge.data.sourceHandle as string];
                }
              });
              return {
                ...node,
                data: { ...node.data, transitions: updatedTransitions },
              };
            }
            return node;
          })
        );
      }
      onEdgesChange(changes);
    },
    [edges, onEdgesChange, setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle) return;

      // ✨ START: Self-looping and handle assignment logic ✨
      // If the source and target nodes are the same, it's a self-loop.
      if (params.source === params.target) {
        // Redirect the connection to our dedicated self-loop handle.
        params.targetHandle = "self-loop-target";
      } else if (params.targetHandle) {
        // This is a check to prevent connecting an answer option TO another answer option.
        // The only valid target handles are our special ones.
        // We allow 'self-loop-target' (handled above) and 'main-target'.
        // Any other target handle implies connecting to a source handle, which we block.
        if (params.targetHandle !== "main-target") {
          console.log(
            "Blocked connection: Cannot connect an output to another output."
          );
          return;
        }
      } else {
        // If no specific target handle is hit (i.e., user drops on node body),
        // connect to the main input handle on the left.
        params.targetHandle = "main-target";
      }
      // ✨ END: Self-looping and handle assignment logic ✨

      setEdges((eds) => {
        // Remove existing edge from the same source handle
        const filteredEdges = eds.filter(
          (edge) =>
            !(
              edge.source === params.source &&
              edge.sourceHandle === params.sourceHandle
            )
        );

        // Create the new edge
        const newEdge: Edge = {
          ...params,
          id: `${params.source}-${params.sourceHandle}-${params.target}`,
          type: "custom",
          // The visual styles are now handled inside CustomEdge, but we pass markerEnd
          markerEnd: {
            type: MarkerType.Arrow, // Using a generic type, CustomEdge will define the marker
          },
          data: {
            sourceHandle: params.sourceHandle,
          },
        };

        return [...filteredEdges, newEdge];
      });

      // Update the source node's transitions data
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === params.source) {
            const updatedTransitions = {
              ...node.data.transitions,
              [params.sourceHandle as string]: Number.parseInt(
                params.target as string
              ),
            };
            return {
              ...node,
              data: {
                ...node.data,
                transitions: updatedTransitions,
              },
            };
          }
          return node;
        })
      );
    },
    [setEdges, setNodes] // Removed `nodes` dependency to prevent stale closure issues
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !edgesToDelete.some((deleteEdge) => deleteEdge.id === edge.id)
        )
      );

      edgesToDelete.forEach((edge) => {
        if (edge?.source && edge?.data?.sourceHandle) {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === edge.source) {
                const updatedTransitions = { ...node.data.transitions };
                delete updatedTransitions[edge.data?.sourceHandle as string];
                return {
                  ...node,
                  data: {
                    ...node.data,
                    transitions: updatedTransitions,
                  },
                };
              }
              return node;
            })
          );
        }
      });
    },
    [setEdges, setNodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<NodeDataType>) => {
      setSelectedNode(node);
    },
    []
  );

  const updateNodeType = useCallback(
    (nodeId: string, newType: "first" | "last" | "none") => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, nodeType: newType } }
            : node
        )
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, nodeType: newType } } : null
        );
      }
    },
    [setNodes, selectedNode]
  );

  const rearrangeLayout = useCallback(() => {
    setNodes((nds) => {
      const sortedNodes = [...nds].sort(
        (a, b) => a.data.step_id - b.data.step_id
      );
      const GRID_SPACING_X = 450;
      const GRID_SPACING_Y = 400;
      const NODES_PER_ROW = 3;
      const START_X = 100;
      const START_Y = 150;

      return sortedNodes.map((node, index) => {
        const row = Math.floor(index / NODES_PER_ROW);
        const col = index % NODES_PER_ROW;

        return {
          ...node,
          position: {
            x: START_X + col * GRID_SPACING_X,
            y: START_Y + row * GRID_SPACING_Y,
          },
        };
      });
    });
  }, [setNodes]);

  const addNewStep = useCallback(() => {
    const newStep = {
      step_id: nextStepId,
      instruction: "Enter your instruction here...",
      answer_options: {
        option_1: "First option",
      },
      transitions: {},
      few_shot_examples: {},
      nodeType: "none" as const,
    };

    const newNode: Node<NodeDataType> = {
      id: nextStepId.toString(),
      type: "stepNode",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: newStep,
    };

    setNodes((nds) => [...nds, newNode]);
    setNextStepId((prev) => prev + 1);
  }, [nextStepId, setNodes]);

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: newData } : node
        )
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode({ ...selectedNode, data: newData });
      }

      const oldNode = nodes.find((n) => n.id === nodeId);
      if (oldNode) {
        const oldOptions = Object.keys(oldNode.data.answer_options);
        const newOptions = Object.keys(newData.answer_options);

        const deletedOptions = oldOptions.filter(
          (opt) => !newOptions.includes(opt)
        );
        if (deletedOptions.length > 0) {
          setEdges((eds) =>
            eds.filter(
              (edge) =>
                !(
                  edge.source === nodeId &&
                  deletedOptions.includes(edge.sourceHandle || "")
                )
            )
          );
        }
      }
    },
    [setNodes, selectedNode, nodes, setEdges]
  );

  const exportData = useMemo(() => {
    return nodes.map((node) => {
      const {
        step_id,
        instruction,
        answer_options,
        few_shot_examples,
        nodeType,
      } = node.data;
      const transitions: Record<string, number> = {};
      edges.forEach((edge) => {
        if (edge.source === node.id && edge.sourceHandle && edge.target) {
          transitions[edge.sourceHandle as string] = Number.parseInt(
            edge.target
          );
        }
      });
      return {
        step_id,
        instruction,
        answer_options,
        transitions,
        few_shot_examples,
        nodeType: nodeType || "none",
      };
    });
  }, [nodes, edges]);

  const handleImportData = useCallback(
    (importedData: NodeDataType[]) => {
      setNodes([]);
      setEdges([]);

      const sortedData = [...importedData].sort(
        (a, b) => a.step_id - b.step_id
      );
      const GRID_SPACING_X = 450;
      const GRID_SPACING_Y = 400;
      const NODES_PER_ROW = 3;
      const START_X = 100;
      const START_Y = 150;

      const newNodes: Node<NodeDataType>[] = sortedData.map((step, index) => {
        const row = Math.floor(index / NODES_PER_ROW);
        const col = index % NODES_PER_ROW;

        return {
          id: step.step_id.toString(),
          type: "stepNode",
          position: {
            x: START_X + col * GRID_SPACING_X,
            y: START_Y + row * GRID_SPACING_Y,
          },
          data: {
            ...step,
            nodeType: step.nodeType || "none", // Ensure nodeType is set
          },
        };
      });

      const newEdges: Edge[] = [];
      importedData.forEach((step) => {
        if (step.transitions) {
          Object.entries(step.transitions).forEach(
            ([sourceHandle, targetStepId]) => {
              const edgeId = `${step.step_id}-${sourceHandle}-${targetStepId}`;
              newEdges.push({
                id: edgeId,
                source: step.step_id.toString(),
                target: targetStepId.toString(),
                sourceHandle,
                type: "custom",
                markerEnd: { type: MarkerType.Arrow },
                data: { sourceHandle },
              });
            }
          );
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
      const maxStepId = Math.max(...importedData.map((step) => step.step_id));
      setNextStepId(maxStepId + 1);
    },
    [setNodes, setEdges]
  );

  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      if (!nodesToDelete || nodesToDelete.length === 0) return;

      const nodeIdsToDelete = nodesToDelete
        .map((node) => node?.id)
        .filter(Boolean);
      if (nodeIdsToDelete.length === 0) return;

      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !nodeIdsToDelete.includes(edge.source) &&
            !nodeIdsToDelete.includes(edge.target)
        )
      );

      if (selectedNode && nodeIdsToDelete.includes(selectedNode.id)) {
        setSelectedNode(null);
      }

      setNodes((nds) =>
        nds
          .filter((node) => !nodeIdsToDelete.includes(node.id))
          .map((node) => {
            const updatedTransitions = { ...node.data.transitions };
            let hasChanges = false;

            Object.entries(updatedTransitions).forEach(([key, targetId]) => {
              if (nodeIdsToDelete.includes(targetId.toString())) {
                delete updatedTransitions[key];
                hasChanges = true;
              }
            });

            return hasChanges
              ? {
                  ...node,
                  data: { ...node.data, transitions: updatedTransitions },
                }
              : node;
          })
      );
    },
    [setEdges, setNodes, selectedNode]
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button onClick={addNewStep} className="shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
          <Button
            variant="outline"
            onClick={rearrangeLayout}
            className="shadow-lg"
            title="Organize nodes in a clean grid layout"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Rearrange
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowExportModal(true)}
            className="shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Manage Data
          </Button>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              onUpdateNodeType: (newType: "first" | "last" | "none") =>
                updateNodeType(node.id, newType),
            },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-background"
          deleteKeyCode={["Backspace", "Delete"]}
        >
          <Controls className="bg-card border-border" />
          <MiniMap
                      className="bg-card border-border"
                      nodeColor="oklch(0.7 0 0)"
                      maskColor="rgba(0, 0, 0, 0.1)"
                    />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--muted-foreground))"
            style={{ opacity: 0.4 }}
          />
        </ReactFlow>
      </div>

      {/* Editing Panel */}
      {selectedNode && (
        <EditingPanel
          node={selectedNode}
          onUpdateNode={updateNodeData}
          onDeleteNode={
            onNodesDelete
              ? (nodeId: string) => onNodesDelete([{ id: nodeId } as Node])
              : undefined
          }
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={exportData}
        onImportData={handleImportData}
      />
    </div>
  );
}
