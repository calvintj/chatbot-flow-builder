// custom-edge.tsx

"use client"

import { memo } from "react"
import {
  type EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  useReactFlow,
  BaseEdge,
} from "@xyflow/react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

// ✨ NEW: Helper function to get a C-shaped path for self-looping edges ✨
const getLoopPath = (sourceX: number, sourceY: number, targetX: number, targetY: number) => {
  const xOffset = 80
  const yOffset = 20

  // Control points are pushed out to the right to create the C-shape
  const controlPointX1 = sourceX + xOffset
  const controlPointY1 = sourceY - yOffset
  const controlPointX2 = targetX + xOffset
  const controlPointY2 = targetY + yOffset

  const path = `M ${sourceX} ${sourceY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${targetX} ${targetY}`
  
  // Calculate label position to be at the peak of the C-curve
  const labelX = sourceX + xOffset + 10
  const labelY = (sourceY + targetY) / 2

  return [path, labelX, labelY]
}


export const CustomEdge = memo(
  ({
    id,
    source, // Add source node id
    target, // Add target node id
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
  }: EdgeProps) => {
    const { deleteElements } = useReactFlow()
    const isSelfLooping = source === target

    let edgePath: string
    let labelX: number
    let labelY: number

    // ✨ UPDATED: Logic to choose path type ✨
    if (isSelfLooping) {
      // Use our new loop path function for self-connections
      ;[edgePath, labelX, labelY] = getLoopPath(sourceX, sourceY, targetX, targetY) as [string, number, number]
    } else {
      // Keep the original logic for all other edges
      ;[edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.3,
      })
    }
    
    return (
      <>
        {/* Define the arrow marker. This is reusable for all edges. */}
        <defs>
          <marker
            id={`arrow-${id}`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M2,2 L2,10 L10,6 z" fill="#10b981" />
          </marker>
        </defs>
        
        {/* Use BaseEdge for the path itself and handle the label separately */}
        <BaseEdge 
          id={id} 
          path={edgePath} 
          markerEnd={`url(#arrow-${id})`} 
          style={{
            ...style, 
            strokeWidth: 3, 
            stroke: "#10b981", 
            zIndex: 1001 
          }} 
        />
        
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: "all",
              zIndex: 1003,
            }}
            className="nodrag nopan"
          >
            <div className="flex items-center gap-1 bg-background border border-border rounded px-2 py-1 shadow-md">
              <span className="text-xs font-mono text-emerald-600 font-medium">
                {data?.sourceHandle && typeof data.sourceHandle === 'string' ? data.sourceHandle : "connection"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(event) => {
                  event.stopPropagation()
                  deleteElements({ edges: [{ id }] })
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    )
  },
)

CustomEdge.displayName = "CustomEdge"