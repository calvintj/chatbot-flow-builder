"use client";

import { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2, Save, RotateCcw, Eye, Edit3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type NodeDataType = {
  step_id: number;
  instruction: string;
  answer_options: Record<string, string>;
  transitions: Record<string, number>;
  few_shot_examples: Record<
    string,
    { bot_prompt: string; user_answer: string }[]
  >;
  nodeType?: "first" | "last" | "none";
};

interface EditingPanelProps {
  node: Node<NodeDataType>;
  onUpdateNode: (nodeId: string, newData: NodeDataType) => void;
  onDeleteNode?: (nodeId: string) => void;
  onClose: () => void;
}

export function EditingPanel({
  node,
  onUpdateNode,
  onDeleteNode,
  onClose,
}: EditingPanelProps) {
  const [instruction, setInstruction] = useState(node.data.instruction);
  const [answerOptions, setAnswerOptions] = useState(node.data.answer_options);
  const [fewShotExamples, setFewShotExamples] = useState(
    node.data.few_shot_examples
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({});
  const [previewMode, setPreviewMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setInstruction(node.data.instruction);
    setAnswerOptions(node.data.answer_options);
    setFewShotExamples(node.data.few_shot_examples);
    setHasUnsavedChanges(false);
  }, [node]);

  useEffect(() => {
    const hasChanges =
      instruction !== node.data.instruction ||
      JSON.stringify(answerOptions) !==
        JSON.stringify(node.data.answer_options) ||
      JSON.stringify(fewShotExamples) !==
        JSON.stringify(node.data.few_shot_examples);
    setHasUnsavedChanges(hasChanges);
  }, [instruction, answerOptions, fewShotExamples, node.data]);

  const handleSave = () => {
    // Check for blank keys
    const hasBlank = Object.keys(answerOptions).some(key => key.trim() === '');
    if (hasBlank) {
      alert("Blank keys are not allowed, please fix or delete options with empty keys.");
      return;
    }
    const updatedData = {
      ...node.data,
      instruction,
      answer_options: answerOptions,
      few_shot_examples: fewShotExamples,
    };
    onUpdateNode(node.id, updatedData);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    setInstruction(node.data.instruction);
    setAnswerOptions(node.data.answer_options);
    setFewShotExamples(node.data.few_shot_examples);
    setHasUnsavedChanges(false);
  };

  // --- FIX START: Improved new key generation ---
  const addAnswerOption = () => {
    const existingKeys = Object.keys(answerOptions);
    // Find the highest number in keys like "option_1", "option_2", etc.
    const maxOptionNum = existingKeys
      .filter((key) => key.startsWith("option_"))
      .map((key) => parseInt(key.substring(7), 10))
      .filter((num) => !isNaN(num))
      .reduce((max, num) => Math.max(max, num), 0);

    const newKey = `option_${maxOptionNum + 1}`;

    setAnswerOptions((prev) => ({
      ...prev,
      [newKey]: "New option description",
    }));
  };
  // --- FIX END ---

  // --- FIX START: Robust update logic for keys and values ---
  const updateAnswerOption = (
    oldKey: string,
    newKey: string,
    value: string
  ) => {
    const trimmedNewKey = newKey.trim();

    // Case 1: Only the description (value) is being updated.
    if (oldKey === trimmedNewKey) {
      setAnswerOptions((prev) => ({ ...prev, [oldKey]: value }));
      return;
    }

    // Case 2: The key is being renamed.
    // Prevent creating a key that already exists.
    if (answerOptions[trimmedNewKey] && trimmedNewKey !== oldKey) {
      // You could add user feedback here, e.g., a toast notification.
      return;
    }

    // Rebuild the answerOptions object to rename the key while preserving order.
    const newAnswerOptions = Object.entries(answerOptions).reduce(
      (acc, [key, val]) => {
        // When the `onChange` for the key input is fired, the `value` param
        // will be the original description, so we use that.
        acc[key === oldKey ? trimmedNewKey : key] =
          key === oldKey ? value : val;
        return acc;
      },
      {} as Record<string, string>
    );
    setAnswerOptions(newAnswerOptions);

    // Also, rename the corresponding key in fewShotExamples to keep data in sync.
    setFewShotExamples((prevExamples) => {
      const newExamples = { ...prevExamples };
      if (newExamples[oldKey]) {
        newExamples[trimmedNewKey] = newExamples[oldKey];
        delete newExamples[oldKey];
      }
      return newExamples;
    });
  };
  // --- FIX END ---

  const removeAnswerOption = (key: string) => {
    setAnswerOptions((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    // This part was already correct, but it's important that it stays.
    setFewShotExamples((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const addFewShotExample = (optionKey: string) => {
    setFewShotExamples((prev) => ({
      ...prev,
      [optionKey]: [
        ...(prev[optionKey] || []),
        { bot_prompt: "", user_answer: "" },
      ],
    }));
  };

  const updateFewShotExample = (
    optionKey: string,
    index: number,
    field: "bot_prompt" | "user_answer",
    value: string
  ) => {
    setFewShotExamples((prev) => ({
      ...prev,
      [optionKey]:
        prev[optionKey]?.map((example, i) =>
          i === index ? { ...example, [field]: value } : example
        ) || [],
    }));
  };

  const removeFewShotExample = (optionKey: string, index: number) => {
    setFewShotExamples((prev) => ({
      ...prev,
      [optionKey]: prev[optionKey]?.filter((_, i) => i !== index) || [],
    }));
  };

  const toggleSection = (sectionIndex: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const handleDeleteNode = () => {
    if (onDeleteNode) {
      onDeleteNode(node.id);
      onClose();
    }
  };

  return (
    <div className="w-96 h-full max-h-screen bg-sidebar border-l border-sidebar-border flex flex-col overflow-hidden">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              Edit Step {node.data.step_id}
            </CardTitle>
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="h-8 w-8 p-0"
            >
              {previewMode ? (
                <Edit3 className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <CardContent className="space-y-6 p-4">
            {hasUnsavedChanges && (
              <Alert>
                <AlertDescription className="text-sm">
                  You have unsaved changes. Don't forget to save your work!
                </AlertDescription>
              </Alert>
            )}

            {showDeleteConfirm && (
              <Alert className="border-destructive">
                <Trash2 className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="space-y-3">
                    <p>
                      Are you sure you want to delete this step? This action
                      cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeleteNode}
                        className="h-7"
                      >
                        Delete Step
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="h-7"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {previewMode ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-card">
                  <h3 className="font-semibold mb-2">Step Preview</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Instruction:
                  </p>
                  <p className="text-sm mb-4">{instruction}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Answer Options:
                  </p>
                  <div className="space-y-2">
                    {Object.entries(answerOptions).map(([key, value]) => (
                      <div key={key} className="p-2 bg-muted rounded text-xs">
                        <span className="font-mono text-muted-foreground">
                          {key}:
                        </span>
                        <span className="ml-1">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Instruction Section */}
                <div className="space-y-2">
                  <Label htmlFor="instruction" className="text-sm font-medium">
                    Instruction
                  </Label>
                  <Textarea
                    id="instruction"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Enter the instruction for this step..."
                    className="min-h-[80px] resize-none border-input bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    {instruction.length} characters
                  </p>
                </div>

                <Separator />

                {/* Answer Options Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Answer Options
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addAnswerOption}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>

                  {Object.entries(answerOptions).map(
                    ([optKey, optValue], index) => (
                      <Collapsible
                        key={`option-${index}-${node.id}`}
                        open={expandedSections[index] !== false}
                        onOpenChange={() => toggleSection(index)}
                      >
                        <div className="space-y-3 p-4 border-2 border-border rounded-lg bg-card/50">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between cursor-pointer">
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {optKey}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {(fewShotExamples[optKey] || []).length}{" "}
                                  examples
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeAnswerOption(optKey);
                                  }}
                                  className="h-5 w-5 p-0 hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Option Key
                              </Label>
                              <Textarea
                                key={`option-key-${index}-${node.id}`}
                                value={optKey}
                                onChange={(e) =>
                                  updateAnswerOption(
                                    optKey,
                                    e.target.value,
                                    optValue
                                  )
                                }
                                placeholder="Option key (e.g., yes, no, maybe)"
                                className="font-mono text-xs border-2 border-input bg-background focus:border-ring min-h-[2rem] resize-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Option Description
                              </Label>
                              <Textarea
                                key={`option-value-${index}-${node.id}`}
                                value={optValue}
                                onChange={(e) =>
                                  updateAnswerOption(
                                    optKey,
                                    optKey,
                                    e.target.value
                                  )
                                }
                                placeholder="Describe what this option means..."
                                className="min-h-[60px] resize-none border-2 border-input bg-background focus:border-ring"
                              />
                            </div>

                            {/* Few-shot examples for this option */}
                            <div className="space-y-3 pt-2 border-t border-border/50">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Few-shot Examples
                                </Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addFewShotExample(optKey)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Example
                                </Button>
                              </div>

                              {(fewShotExamples[optKey] || []).map(
                                (example, subIndex) => (
                                  <div
                                    key={`example-${optKey}-${subIndex}-${node.id}`}
                                    className="space-y-2 p-3 bg-muted/50 border border-border rounded-md"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium">
                                        Example {subIndex + 1}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          removeFewShotExample(optKey, subIndex)
                                        }
                                        className="h-5 w-5 p-0 hover:bg-destructive/10"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <div className="space-y-2">
                                      <div>
                                        <Label className="text-xs text-muted-foreground">
                                          Bot Prompt
                                        </Label>
                                        <Textarea
                                          key={`bot-prompt-${optKey}-${subIndex}-${node.id}`}
                                          value={example.bot_prompt}
                                          onChange={(e) =>
                                            updateFewShotExample(
                                              optKey,
                                              subIndex,
                                              "bot_prompt",
                                              e.target.value
                                            )
                                          }
                                          placeholder="What the bot says..."
                                          className="text-xs border border-input bg-background mt-1 min-h-[2rem] resize-none"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground">
                                          User Answer
                                        </Label>
                                        <Textarea
                                          key={`user-answer-${optKey}-${subIndex}-${node.id}`}
                                          value={example.user_answer}
                                          onChange={(e) =>
                                            updateFewShotExample(
                                              optKey,
                                              subIndex,
                                              "user_answer",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Expected user response..."
                                          className="text-xs border border-input bg-background mt-1 min-h-[2rem] resize-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  )}
                </div>
              </>
            )}
          </CardContent>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-4 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {onDeleteNode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Step
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
