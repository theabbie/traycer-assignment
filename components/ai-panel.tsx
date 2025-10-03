"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChecklistItem } from "@/lib/ai-types";
import { Loader2, Sparkles, CheckCircle2, Circle } from "lucide-react";

interface AIPanelProps {
  onGenerateChecklist: (instruction: string) => void;
  onExecuteChanges: () => void;
  checklist: ChecklistItem[];
  isGenerating: boolean;
  isExecuting: boolean;
}

export function AIPanel({
  onGenerateChecklist,
  onExecuteChanges,
  checklist,
  isGenerating,
  isExecuting,
}: AIPanelProps) {
  const [instruction, setInstruction] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !isGenerating) {
      onGenerateChecklist(instruction);
      setIsExpanded(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-96 max-h-[600px] flex flex-col">
          {}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {}
          <form onSubmit={handleSubmit} className="p-4 border-b border-zinc-800">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe what you want to change in the code..."
              className="w-full bg-zinc-800 text-white rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              disabled={isGenerating || isExecuting}
            />
            <Button
              type="submit"
              disabled={!instruction.trim() || isGenerating || isExecuting}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Plan
                </>
              )}
            </Button>
          </form>

          {}
          {checklist.length > 0 && (
            <div className="flex-1 overflow-auto p-4">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Task Checklist:</h4>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={item.completed ? "line-through text-zinc-500" : ""}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={onExecuteChanges}
                disabled={isExecuting}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing Changes...
                  </>
                ) : (
                  "Execute Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
