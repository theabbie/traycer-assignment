"use client";

import { diffLines } from "diff";

interface DiffViewerProps {
  original: string;
  modified: string;
  filename: string;
}

export function DiffViewer({ original, modified, filename }: DiffViewerProps) {
  const diff = diffLines(original, modified);

  return (
    <div className="h-full overflow-auto bg-zinc-900 text-zinc-100">
      <div className="sticky top-0 bg-zinc-800 px-4 py-2 border-b border-zinc-700 font-semibold">
        {filename}
      </div>
      <div className="font-mono text-sm">
        {diff.map((part, index) => {
          const bgColor = part.added
            ? "bg-green-900/30"
            : part.removed
            ? "bg-red-900/30"
            : "";
          const textColor = part.added
            ? "text-green-300"
            : part.removed
            ? "text-red-300"
            : "text-zinc-300";
          const prefix = part.added ? "+ " : part.removed ? "- " : "  ";

          return (
            <div key={index} className={`${bgColor} ${textColor}`}>
              {part.value.split("\n").map((line, lineIndex) => {
                if (lineIndex === part.value.split("\n").length - 1 && line === "") {
                  return null;
                }
                return (
                  <div key={lineIndex} className="px-4 py-0.5 hover:bg-zinc-800/50">
                    <span className="select-none opacity-50 mr-2">{prefix}</span>
                    {line}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
