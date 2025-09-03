"use client"

import { useState, useEffect } from "react"
import type { Node } from "@xyflow/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X, Plus, Trash2, Save, RotateCcw, Eye, Edit3 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EditingPanelProps {
  node: Node
  onUpdateNode: (nodeId: string, newData: any) => void
  onDeleteNode?: (nodeId: string) => void
  onClose: () => void
}

export function EditingPanel({ node, onUpdateNode, onDeleteNode, onClose }: EditingPanelProps) {
  const [instruction, setInstruction] = useState(node.data.instruction)
  const [answerOptions, setAnswerOptions] = useState(node.data.answer_options)
  const [fewShotExamples, setFewShotExamples] = useState(node.data.few_shot_examples)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [previewMode, setPreviewMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setInstruction(node.data.instruction)
    setAnswerOptions(node.data.answer_options)
    setFewShotExamples(node.data.few_shot_examples)
    setHasUnsavedChanges(false)
  }, [node])

  useEffect(() => {
    const hasChanges =
      instruction !== node.data.instruction ||
      JSON.stringify(answerOptions) !== JSON.stringify(node.data.answer_options) ||
      JSON.stringify(fewShotExamples) !== JSON.stringify(node.data.few_shot_examples)
    setHasUnsavedChanges(hasChanges)
  }, [instruction, answerOptions, fewShotExamples, node.data])

  const handleSave = () => {
    const updatedData = {
      ...node.data,
      instruction,
      answer_options: answerOptions,
      few_shot_examples: fewShotExamples,
    }
    onUpdateNode(node.id, updatedData)
    setHasUnsavedChanges(false)
  }

  const handleReset = () => {
    setInstruction(node.data.instruction)
    setAnswerOptions(node.data.answer_options)
    setFewShotExamples(node.data.few_shot_examples)
    setHasUnsavedChanges(false)
  }

  const addAnswerOption = () => {
    const existingKeys = Object.keys(answerOptions)
    const newKey = `option_${existingKeys.length + 1}`
    setAnswerOptions((prev) => ({
      ...prev,
      [newKey]: "New option",
    }))
  }

  const updateAnswerOption = (oldKey: string, newKey: string, value: string) => {
    setAnswerOptions((prev) => {
      const updated = { ...prev }
      if (oldKey !== newKey && newKey.trim() !== "") {
        delete updated[oldKey]
        updated[newKey] = value
      } else {
        updated[oldKey] = value
      }
      return updated
    })
  }

  const removeAnswerOption = (key: string) => {
    setAnswerOptions((prev) => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
    // Also remove associated few-shot examples
    setFewShotExamples((prev) => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  const addFewShotExample = (optionKey: string) => {
    setFewShotExamples((prev) => ({
      ...prev,
      [optionKey]: [...(prev[optionKey] || []), { bot_prompt: "", user_answer: "" }],
    }))
  }

  const updateFewShotExample = (
    optionKey: string,
    index: number,
    field: "bot_prompt" | "user_answer",
    value: string,
  ) => {
    setFewShotExamples((prev) => ({
      ...prev,
      [optionKey]: prev[optionKey]?.map((example, i) => (i === index ? { ...example, [field]: value } : example)) || [],
    }))
  }

  const removeFewShotExample = (optionKey: string, index: number) => {
    setFewShotExamples((prev) => ({
      ...prev,
      [optionKey]: prev[optionKey]?.filter((_, i) => i !== index) || [],
    }))
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleDeleteNode = () => {
    if (onDeleteNode) {
      onDeleteNode(node.id)
      onClose()
    }
  }

  return (
    <div className="w-96 h-full bg-sidebar border-l border-sidebar-border flex flex-col">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Edit Step {node.data.step_id}</CardTitle>
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)} className="h-8 w-8 p-0">
              {previewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1">
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
                    <p>Are you sure you want to delete this step? This action cannot be undone.</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={handleDeleteNode} className="h-7">
                        Delete Step
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="h-7">
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
                  <p className="text-sm text-muted-foreground mb-2">Instruction:</p>
                  <p className="text-sm mb-4">{instruction}</p>
                  <p className="text-sm text-muted-foreground mb-2">Answer Options:</p>
                  <div className="space-y-2">
                    {Object.entries(answerOptions).map(([key, value]) => (
                      <div key={key} className="p-2 bg-muted rounded text-xs">
                        <span className="font-mono text-muted-foreground">{key}:</span>
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
                  <p className="text-xs text-muted-foreground">{instruction.length} characters</p>
                </div>

                <Separator />

                {/* Answer Options Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Answer Options</Label>
                    <Button size="sm" variant="outline" onClick={addAnswerOption}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>

                  {Object.entries(answerOptions).map(([key, value]) => (
                    <Collapsible
                      key={`option-${key}`}
                      open={expandedSections[key] !== false}
                      onOpenChange={() => toggleSection(key)}
                    >
                      <div className="space-y-3 p-4 border-2 border-border rounded-lg bg-card/50">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between cursor-pointer">
                            <Badge variant="outline" className="font-mono text-xs">
                              {key}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {(fewShotExamples[key] || []).length} examples
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeAnswerOption(key)
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
                            <Label className="text-xs text-muted-foreground">Option Key</Label>
                            <Input
                              key={`option-key-${key}-${node.id}`}
                              value={key}
                              onChange={(e) => updateAnswerOption(key, e.target.value, value)}
                              placeholder="Option key (e.g., yes, no, maybe)"
                              className="font-mono text-xs border-2 border-input bg-background focus:border-ring"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Option Description</Label>
                            <Textarea
                              key={`option-value-${key}-${node.id}`}
                              value={value}
                              onChange={(e) => updateAnswerOption(key, key, e.target.value)}
                              placeholder="Describe what this option means..."
                              className="min-h-[60px] resize-none border-2 border-input bg-background focus:border-ring"
                            />
                          </div>

                          {/* Few-shot examples for this option */}
                          <div className="space-y-3 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium text-muted-foreground">Few-shot Examples</Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addFewShotExample(key)}
                                className="h-6 px-2 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Example
                              </Button>
                            </div>

                            {(fewShotExamples[key] || []).map((example, index) => (
                              <div
                                key={`example-${key}-${index}`}
                                className="space-y-2 p-3 bg-muted/50 border border-border rounded-md"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Example {index + 1}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeFewShotExample(key, index)}
                                    className="h-5 w-5 p-0 hover:bg-destructive/10"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Bot Prompt</Label>
                                    <Input
                                      key={`bot-prompt-${key}-${index}-${node.id}`}
                                      value={example.bot_prompt}
                                      onChange={(e) => updateFewShotExample(key, index, "bot_prompt", e.target.value)}
                                      placeholder="What the bot says..."
                                      className="text-xs border border-input bg-background mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">User Answer</Label>
                                    <Input
                                      key={`user-answer-${key}-${index}-${node.id}`}
                                      value={example.user_answer}
                                      onChange={(e) => updateFewShotExample(key, index, "user_answer", e.target.value)}
                                      placeholder="Expected user response..."
                                      className="text-xs border border-input bg-background mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-4 space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!hasUnsavedChanges} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!hasUnsavedChanges}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {onDeleteNode && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Step
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Changes are auto-saved when you click outside inputs
          </p>
        </div>
      </Card>
    </div>
  )
}
