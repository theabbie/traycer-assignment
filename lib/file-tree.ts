import { GitHubTreeItem, FileNode } from "./types";

export function buildFileTree(items: GitHubTreeItem[]): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  const sortedItems = [...items].sort((a, b) => a.path.localeCompare(b.path));

  for (const item of sortedItems) {
    const parts = item.path.split("/");
    const name = parts[parts.length - 1];
    
    const node: FileNode = {
      name,
      path: item.path,
      type: item.type === "blob" ? "file" : "folder",
      children: item.type === "tree" ? [] : undefined,
    };

    map.set(item.path, node);

    if (parts.length === 1) {

      root.push(node);
    } else {

      const parentPath = parts.slice(0, -1).join("/");
      const parent = map.get(parentPath);
      
      if (parent && parent.children) {
        parent.children.push(node);
      }
    }
  }

  return root;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    swift: "swift",
    kt: "kotlin",
    r: "r",
    m: "objective-c",
    vue: "vue",
    dart: "dart",
  };

  return languageMap[ext.toLowerCase()] || "plaintext";
}
