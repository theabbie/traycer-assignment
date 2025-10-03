"use client";

import Editor from "@monaco-editor/react";
import { getFileExtension, getLanguageFromExtension } from "@/lib/file-tree";

interface CodeEditorProps {
  content: string;
  filename: string;
}

export function CodeEditor({ content, filename }: CodeEditorProps) {
  const extension = getFileExtension(filename);
  const language = getLanguageFromExtension(extension);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={content}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
