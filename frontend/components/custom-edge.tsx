"use client"

import { memo } from "react"
import { type EdgeProps, getBezierPath, EdgeLabelRenderer } from "@xyflow/react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export const CustomEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
  }: EdgeProps) => {
    const calculateSmartPath = () => {
      const dx = targetX - sourceX
      const dy = targetY - sourceY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // If nodes are close, create a curved path that goes around
      if (distance < 200) {
        const midX = (sourceX + targetX) / 2
        const midY = (sourceY + targetY) / 2

        // Add offset to curve around nodes
        const offsetX = dy > 0 ? 100 : -100
        const offsetY = dx > 0 ? -50 : 50

        return `M ${sourceX} ${sourceY} Q ${midX + offsetX} ${midY + offsetY} ${targetX} ${targetY}`
      }

      // For longer distances, use standard bezier with enhanced control points
      const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.3, // Increased curvature for better routing
      })

      return edgePath
    }

    const [, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    const smartPath = calculateSmartPath()

    return (
      <>
        <defs>
          <marker
            id={`arrow-${id}`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
            style={{ zIndex: 1002 }}
          >
            <path d="M2,2 L2,10 L10,6 z" fill="#10b981" />
          </marker>
        </defs>
        <path
          id={id}
          style={{
            ...style,
            strokeWidth: 3,
            stroke: "#10b981",
            strokeDasharray: "none",
            zIndex: 1002,
            position: "relative",
          }}
          className="react-flow__edge-path transition-all duration-200 hover:stroke-[4px] drop-shadow-lg !z-[1002] relative"
          d={smartPath}
          markerEnd={`url(#arrow-${id})`}
          fill="none"
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
            className="nodrag nopan !z-[1003]"
          >
            <div className="flex items-center gap-1 bg-background border border-border rounded px-2 py-1 shadow-md">
              <span className="text-xs font-mono text-emerald-600 font-medium">
                {data?.sourceHandle || "connection"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(event) => {
                  event.stopPropagation()
                  // The edge deletion is handled by React Flow's built-in delete functionality
                  const deleteEvent = new KeyboardEvent("keydown", { key: "Delete" })
                  document.dispatchEvent(deleteEvent)
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
