"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
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
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { StepNode } from "@/components/step-node"
import { EditingPanel } from "@/components/editing-panel"
import { ExportModal } from "@/components/export-modal"
import { CustomEdge } from "@/components/custom-edge"

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
      states_frequency: [{ bot_prompt: "How often do you travel?", user_answer: "Twice a year." }],
    },
  },
]

const initialNodes: Node[] = [
  {
    id: "1",
    type: "stepNode",
    position: { x: 250, y: 100 },
    data: initialSteps[0],
  },
]

const initialEdges: Edge[] = []

const nodeTypes = {
  stepNode: StepNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

export default function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [nextStepId, setNextStepId] = useState(2)

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Process edge deletions to update node transitions
      const deletedEdges = changes
        .filter((change) => change.type === "remove")
        .map((change) => edges.find((edge) => edge.id === change.id))
        .filter(Boolean) as Edge[]

      if (deletedEdges.length > 0) {
        // Update node transitions for deleted edges
        setNodes((nds) =>
          nds.map((node) => {
            const edgesToRemove = deletedEdges.filter((edge) => edge.source === node.id)
            if (edgesToRemove.length > 0) {
              const updatedTransitions = { ...node.data.transitions }
              edgesToRemove.forEach((edge) => {
                if (edge.data?.sourceHandle) {
                  delete updatedTransitions[edge.data.sourceHandle]
                }
              })
              return {
                ...node,
                data: { ...node.data, transitions: updatedTransitions },
              }
            }
            return node
          }),
        )
      }

      // Let React Flow handle the edge changes
      onEdgesChange(changes)
    },
    [edges, onEdgesChange, setNodes],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle) return

      // Check if target is an answer option handle (source handles are answer options)
      const targetNode = nodes.find((n) => n.id === params.target)
      if (!targetNode) return

      // If target handle exists, it means we're trying to connect to an answer option
      // Only allow connections to the main node (no targetHandle)
      if (params.targetHandle) {
        console.log("[v0] Blocked connection: Cannot connect answer option to answer option")
        return
      }

      setEdges((eds) => {
        // Remove existing edge from the same source handle
        const filteredEdges = eds.filter(
          (edge) => !(edge.source === params.source && edge.sourceHandle === params.sourceHandle),
        )

        // Create the new edge
        const newEdge: Edge = {
          ...params,
          id: `${params.source}-${params.sourceHandle}-${params.target}`,
          type: "custom",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "hsl(var(--primary))",
          },
          style: {
            stroke: "hsl(var(--primary))",
            strokeWidth: 2,
          },
          data: {
            sourceHandle: params.sourceHandle,
          },
        }

        return [...filteredEdges, newEdge]
      })

      // Update the source node's transitions data
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === params.source) {
            const updatedTransitions = {
              ...node.data.transitions,
              [params.sourceHandle]: Number.parseInt(params.target),
            }
            return {
              ...node,
              data: {
                ...node.data,
                transitions: updatedTransitions,
              },
            }
          }
          return node
        }),
      )
    },
    [setEdges, setNodes, nodes],
  )

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      setEdges((eds) => eds.filter((edge) => !edgesToDelete.some((deleteEdge) => deleteEdge.id === edge.id)))

      // Update node transitions to remove deleted connections
      edgesToDelete.forEach((edge) => {
        if (edge?.source && edge?.data?.sourceHandle) {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === edge.source) {
                const updatedTransitions = { ...node.data.transitions }
                delete updatedTransitions[edge.data.sourceHandle]
                return {
                  ...node,
                  data: {
                    ...node.data,
                    transitions: updatedTransitions,
                  },
                }
              }
              return node
            }),
          )
        }
      })
    },
    [setEdges, setNodes],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const addNewStep = useCallback(() => {
    const newStep = {
      step_id: nextStepId,
      instruction: "Enter your instruction here...",
      answer_options: {
        option_1: "First option",
      },
      transitions: {},
      few_shot_examples: {},
    }

    const newNode: Node = {
      id: nextStepId.toString(),
      type: "stepNode",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: newStep,
    }

    setNodes((nds) => [...nds, newNode])
    setNextStepId((prev) => prev + 1)
  }, [nextStepId, setNodes])

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) => nds.map((node) => (node.id === nodeId ? { ...node, data: newData } : node)))
      if (selectedNode?.id === nodeId) {
        setSelectedNode({ ...selectedNode, data: newData })
      }

      // Update edges if answer options changed
      const oldNode = nodes.find((n) => n.id === nodeId)
      if (oldNode) {
        const oldOptions = Object.keys(oldNode.data.answer_options)
        const newOptions = Object.keys(newData.answer_options)

        // Remove edges for deleted options
        const deletedOptions = oldOptions.filter((opt) => !newOptions.includes(opt))
        if (deletedOptions.length > 0) {
          setEdges((eds) =>
            eds.filter((edge) => !(edge.source === nodeId && deletedOptions.includes(edge.sourceHandle || ""))),
          )
        }
      }
    },
    [setNodes, selectedNode, nodes, setEdges],
  )

  const exportData = useMemo(() => {
    return nodes.map((node) => {
      const { step_id, instruction, answer_options, few_shot_examples } = node.data

      // Build transitions from current edges
      const transitions: Record<string, number> = {}
      edges.forEach((edge) => {
        if (edge.source === node.id && edge.sourceHandle && edge.target) {
          transitions[edge.sourceHandle] = Number.parseInt(edge.target)
        }
      })

      return {
        step_id,
        instruction,
        answer_options,
        transitions,
        few_shot_examples,
      }
    })
  }, [nodes, edges])

  const handleImportData = useCallback(
    (importedData: any[]) => {
      // Clear existing nodes and edges
      setNodes([])
      setEdges([])

      // Create nodes from imported data
      const newNodes: Node[] = importedData.map((step, index) => ({
        id: step.step_id.toString(),
        type: "stepNode",
        position: { x: 100 + (index % 3) * 350, y: 100 + Math.floor(index / 3) * 200 },
        data: step,
      }))

      // Create edges from transitions
      const newEdges: Edge[] = []
      importedData.forEach((step) => {
        if (step.transitions) {
          Object.entries(step.transitions).forEach(([sourceHandle, targetStepId]) => {
            const edgeId = `${step.step_id}-${sourceHandle}-${targetStepId}`
            newEdges.push({
              id: edgeId,
              source: step.step_id.toString(),
              target: targetStepId.toString(),
              sourceHandle,
              type: "custom",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "hsl(var(--primary))",
              },
              style: {
                stroke: "hsl(var(--primary))",
                strokeWidth: 2,
              },
              data: {
                sourceHandle,
              },
            })
          })
        }
      })

      setNodes(newNodes)
      setEdges(newEdges)

      // Update next step ID
      const maxStepId = Math.max(...importedData.map((step) => step.step_id))
      setNextStepId(maxStepId + 1)
    },
    [setNodes, setEdges],
  )

  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      if (!nodesToDelete || nodesToDelete.length === 0) return

      const nodeIdsToDelete = nodesToDelete.map((node) => node?.id).filter(Boolean)
      if (nodeIdsToDelete.length === 0) return

      // Remove edges connected to deleted nodes
      setEdges((eds) =>
        eds.filter((edge) => !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target)),
      )

      // Clear selected node if it's being deleted
      if (selectedNode && nodeIdsToDelete.includes(selectedNode.id)) {
        setSelectedNode(null)
      }

      // Update transitions in remaining nodes that referenced deleted nodes
      setNodes((nds) =>
        nds
          .filter((node) => !nodeIdsToDelete.includes(node.id))
          .map((node) => {
            const updatedTransitions = { ...node.data.transitions }
            let hasChanges = false

            Object.entries(updatedTransitions).forEach(([key, targetId]) => {
              if (nodeIdsToDelete.includes(targetId.toString())) {
                delete updatedTransitions[key]
                hasChanges = true
              }
            })

            return hasChanges
              ? {
                  ...node,
                  data: { ...node.data, transitions: updatedTransitions },
                }
              : node
          }),
      )
    },
    [setEdges, setNodes, selectedNode],
  )

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
          <Button variant="outline" onClick={() => setShowExportModal(true)} className="shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            Manage Data
          </Button>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
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
          <MiniMap className="bg-card border-border" nodeColor="#10b981" maskColor="rgba(0, 0, 0, 0.1)" />
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
          onDeleteNode={onNodesDelete ? (nodeId: string) => onNodesDelete([{ id: nodeId } as Node]) : undefined}
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
  )
}
