"use client"

import { memo, useState } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Edit3, Grip } from "lucide-react"

export const StepNode = memo(({ data, selected }: NodeProps) => {
  const { step_id, instruction, answer_options } = data
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className={`min-w-[280px] max-w-[320px] shadow-lg transition-all duration-200 cursor-pointer relative z-0 ${
        selected ? "ring-2 ring-primary ring-offset-2 shadow-xl" : ""
      } ${isHovered ? "shadow-xl scale-[1.02]" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-[0]">
        <CardTitle className="flex items-center justify-between text-sm">
          <Badge variant="secondary" className="font-mono">
            Step {step_id}
          </Badge>
          <div className="flex items-center gap-1">
            {selected && (
              <Badge variant="default" className="text-xs px-2 py-0.5">
                <Edit3 className="w-3 h-3 mr-1" />
                Editing
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Instruction:</p>
          <p className={`text-sm font-medium text-balance ${isExpanded ? "" : "line-clamp-2"}`}>{instruction}</p>
        </div>

        {isExpanded && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Answer Options:</p>
              <Badge variant="outline" className="text-xs">
                {Object.keys(answer_options).length} options
              </Badge>
            </div>
            <div className="space-y-2 relative">
              {Object.entries(answer_options).map(([key, value], index) => (
                <div key={key} className="flex items-center gap-2 group relative">
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={key}
                    className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-white !shadow-md transition-all duration-200 hover:!w-5 hover:!h-5 hover:!bg-emerald-600 !z-10"
                    style={{
                      right: "-8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      position: "absolute",
                    }}
                  />
                  <div className="flex-1 p-2 bg-muted rounded text-xs transition-all duration-200 group-hover:bg-accent/20 group-hover:border group-hover:border-accent pr-4">
                    <div className="flex items-center gap-1">
                      <Grip className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="font-mono text-emerald-600 font-medium">{key}:</span>
                    </div>
                    <span className="ml-1 text-foreground">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="text-xs text-muted-foreground">
            {Object.keys(answer_options).length} answer options • Click to expand
          </div>
        )}
      </CardContent>

      {/* Input handle for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-white !shadow-md transition-all duration-200 hover:!w-5 hover:!h-5 hover:!bg-emerald-600"
      />

      {isHovered && (
        <div className="absolute top-2 right-2 opacity-50">
          <Grip className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  )
})

StepNode.displayName = "StepNode"
