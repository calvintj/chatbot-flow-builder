// step-node.tsx

"use client";

import React, { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Grip,
  MoreHorizontal,
} from "lucide-react";

export const StepNode = memo(({ data, selected }: NodeProps) => {
  const { step_id, instruction, answer_options, nodeType, onUpdateNodeType } =
    data;
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const handleNodeTypeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateNodeType && typeof onUpdateNodeType === "function") {
      const nextType =
        nodeType === "none" ? "first" : nodeType === "first" ? "last" : "none";
      onUpdateNodeType(nextType);
    }
  };

  return (
    <Card
      className={`min-w-[280px] max-w-[320px] shadow-lg transition-all duration-200 cursor-pointer relative z-0 ${
        selected ? "ring-2 ring-primary ring-offset-2 shadow-xl" : ""
      } ${isHovered ? "shadow-xl scale-[1.02]" : ""} ${
        nodeType === "first" ? "border-primary border-2" : ""
      } ${nodeType === "last" ? "border-destructive border-2" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-[0]">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-primary-foreground">
              Step {step_id as number}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 px-2 text-xs font-medium transition-colors ${
                nodeType === "first"
                  ? "bg-primary/20 hover:bg-primary/30 text-primary-foreground border border-primary/50"
                  : nodeType === "last"
                  ? "bg-destructive/20 hover:bg-destructive/30 text-destructive-foreground border border-destructive/50"
                  : "hover:bg-accent text-muted-foreground"
              }`}
              onClick={handleNodeTypeToggle}
              title={`Click to toggle: None → First → Last → None`}
            >
              {nodeType === "first" ? (
                <>
                  <MoreHorizontal className="w-3 h-3 mr-1" />S
                </>
              ) : nodeType === "last" ? (
                <>
                  <MoreHorizontal className="w-3 h-3 mr-1" />E
                </>
              ) : (
                <>
                  <MoreHorizontal className="w-3 h-3 mr-1" />
                </>
              )}
            </Button>
            <div className="flex items-center gap-2">
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
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Instruction:</p>
          <p
            className={`text-sm font-medium text-balance ${
              isExpanded ? "" : "line-clamp-2"
            }`}
          >
            {instruction as string}
          </p>
        </div>

        {isExpanded && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Answer Options:</p>
              <Badge variant="outline" className="text-xs">
                {Object.keys(answer_options as Record<string, string>).length}{" "}
                options
              </Badge>
            </div>
            <div className="space-y-2 relative">
              {Object.entries(answer_options as Record<string, string>).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 group relative"
                  >
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={key}
                      className="!w-4 !h-4 !bg-primary !border-2 !border-white !shadow-md transition-all duration-200 hover:!w-5 hover:!h-5 hover:!bg-primary/80 !z-10"
                      style={{
                        right: "-8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        position: "absolute",
                      }}
                    />
                    <div className="flex-1 p-2 bg-muted rounded text-xs transition-all duration-200 group-hover:bg-accent/20 group-hover:border group-hover:border-accent pr-4">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-primary font-medium">
                          {key}:
                        </span>
                      </div>
                      <span className="text-foreground">{value as string}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="text-xs text-muted-foreground">
            {Object.keys(answer_options as Record<string, string>).length}{" "}
            answer options • Click to expand
          </div>
        )}
      </CardContent>

      {/* ✨ UPDATED: Main Input handle with explicit ID ✨ */}
      <Handle
        type="target"
        position={Position.Left}
        id="main-target"
        className="!w-4 !h-4 !bg-primary !border-2 !border-white !shadow-md transition-all duration-200 hover:!w-5 hover:!h-5 hover:!bg-primary/80"
      />

      {/* ✨ NEW: Invisible handle for self-connections ✨ */}
      <Handle
        type="target"
        position={Position.Right}
        id="self-loop-target"
        style={{
          top: "25px", // Position it near the top right
          right: "-8px",
          background: "transparent", // Make it "invisible"
          border: "none",
          width: 16,
          height: 16,
          zIndex: -1, // Push it behind other elements
        }}
      />

      {isHovered && (
        <div className="absolute top-2 right-2 opacity-50">
          <Grip className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  );
});

StepNode.displayName = "StepNode";
