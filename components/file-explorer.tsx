"use client";

import { useState } from "react";
import { FileNode } from "@/lib/types";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";

interface FileExplorerProps {
  tree: FileNode[];
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
}

export function FileExplorer({ tree, onFileSelect, selectedFile }: FileExplorerProps) {
  return (
    <div className="h-full overflow-auto bg-zinc-900 text-zinc-100 p-2">
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          level={0}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
  level: number;
}

function FileTreeNode({ node, onFileSelect, selectedFile, level }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFolder = node.type === "folder";
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-zinc-800 rounded ${
          isSelected ? "bg-zinc-700" : ""
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <span className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        )}
        {!isFolder && <span className="w-4" />}
        {isFolder ? (
          <Folder className="w-4 h-4 text-blue-400" />
        ) : (
          <File className="w-4 h-4 text-zinc-400" />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
