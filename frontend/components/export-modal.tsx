"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NodeDataType } from "@/components/editing-panel";
import { Button } from "@/components/ui/button";
import { Copy, Download, Upload, FileText, Database, Eye } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NodeDataType[];
  onImportData?: (data: NodeDataType[]) => void;
}

export function ExportModal({
  isOpen,
  onClose,
  data,
  onImportData,
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [activeTab, setActiveTab] = useState("export");

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversational-flow-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsedData = JSON.parse(importText);

      // Validate the data structure
      if (!Array.isArray(parsedData)) {
        throw new Error("Data must be an array of steps");
      }

      for (const step of parsedData) {
        if (!step.step_id || !step.instruction || !step.answer_options) {
          throw new Error(
            "Each step must have step_id, instruction, and answer_options"
          );
        }
      }

      onImportData?.(parsedData);
      setImportError("");
      setImportText("");
      onClose();
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Invalid JSON format"
      );
    }
  };

  const getDataStats = () => {
    const totalSteps = data.length;
    const totalOptions = data.reduce(
      (sum, step) => sum + Object.keys(step.answer_options).length,
      0
    );
    const totalExamples = data.reduce((sum, step) => {
      return (
        sum +
        Object.values(step.few_shot_examples || {}).reduce(
          (exSum: number, examples: unknown) => {
            return exSum + (Array.isArray(examples) ? examples.length : 0);
          },
          0
        )
      );
    }, 0);
    const totalConnections = data.reduce(
      (sum, step) => sum + Object.keys(step.transitions || {}).length,
      0
    );

    return { totalSteps, totalOptions, totalExamples, totalConnections };
  };

  const stats = getDataStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Export Tab Content */}
          <TabsContent
            value="export"
            className="flex-1 flex flex-col space-y-4 min-h-0 pt-4"
          >
            {" "}
            {/* Added pt-4 for spacing */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {stats.totalSteps}
                </div>
                <div className="text-xs text-muted-foreground">Steps</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {stats.totalOptions}
                </div>
                <div className="text-xs text-muted-foreground">Options</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-accent">
                  {stats.totalConnections}
                </div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-chart-1">
                  {stats.totalExamples}
                </div>
                <div className="text-xs text-muted-foreground">Examples</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy JSON"}
              </Button>
              <Button onClick={handleDownload} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
              <Badge variant="secondary" className="ml-auto">
                {(new Blob([jsonString]).size / 1024).toFixed(1)} KB
              </Badge>
            </div>
            {/* Export JSON display area */}
            <div className="flex-1 relative">
              {" "}
              {/* This flex-1 helps the pre tag take available space */}
              <pre className="bg-muted p-4 rounded-lg text-xs font-mono border max-h-[300px] overflow-y-auto">
                {jsonString}
              </pre>
            </div>
          </TabsContent>

          {/* Import Tab Content */}
          <TabsContent
            value="import"
            className="flex-1 flex flex-col space-y-4 min-h-0 pt-4"
          >
            {" "}
            {/* Added pt-4 for spacing */}
            <Alert>
              <FileText className="w-4 h-4" />
              <AlertDescription>
                Import a JSON file to replace the current conversational flow.
                Make sure the data follows the correct format.
              </AlertDescription>
            </Alert>
            <div className="flex-1 flex flex-col space-y-2">
              <Label htmlFor="import-data">JSON Data</Label>
              <Textarea
                id="import-data"
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError("");
                }}
                placeholder="Paste your JSON data here..."
                className="h-[250px] font-mono text-xs"
              />
            </div>
            {importError && (
              <Alert variant="destructive">
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImportText("");
                  setImportError("");
                }}
              >
                Clear
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Expected format:</p>
              <pre className="bg-muted p-2 rounded text-xs max-h-40 overflow-y-auto">
                {`[
  {
    "step_id": 1,
    "instruction": "Your instruction",
    "answer_options": {
      "option_key": "Option description"
    },
    "transitions": {
      "option_key": 2
    },
    "few_shot_examples": {
      "option_key": [
        {
          "bot_prompt": "Question",
          "user_answer": "Answer"
        }
      ]
    }
  }
]`}
              </pre>
            </div>
          </TabsContent>

          {/* Preview Tab Content */}
          <TabsContent
            value="preview"
            className="flex-1 flex flex-col space-y-4 min-h-0 pt-4"
          >
            {" "}
            {/* Added pt-4 for spacing */}
            <div className="space-y-4 flex-1 overflow-y-auto">
              {" "}
              {/* Adjusted for scrolling */}
              {data.map((step) => (
                <div
                  key={step.step_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Step {step.step_id}</Badge>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {Object.keys(step.answer_options).length} options
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Object.keys(step.transitions || {}).length} connections
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Instruction:</p>
                    <p className="text-sm text-muted-foreground">
                      {step.instruction}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Answer Options:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(step.answer_options).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Badge variant="outline" className="font-mono">
                              {key}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <span>{value as string}</span>
                            {step.transitions?.[key] && (
                              <>
                                <span className="text-muted-foreground">
                                  → Step
                                </span>
                                <Badge variant="secondary">
                                  {step.transitions[key]}
                                </Badge>
                              </>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
