"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileExplorer } from "@/components/file-explorer";
import { CodeEditor } from "@/components/code-editor";
import { DiffViewer } from "@/components/diff-viewer";
import { AIPanel } from "@/components/ai-panel";
import { buildFileTree } from "@/lib/file-tree";
import { useRecaptcha } from "@/lib/use-recaptcha";
import { GitHubTreeItem, FileNode } from "@/lib/types";
import { ChecklistItem, FileModification } from "@/lib/ai-types";
import { Loader2 } from "lucide-react";

function RepoViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const repoUrl = searchParams.get("url");
  const { executeRecaptcha } = useRecaptcha();
  
  const [tree, setTree] = useState<FileNode[]>([]);
  const [flatFileList, setFlatFileList] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string; branch: string } | null>(null);
  

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [isExecutingChanges, setIsExecutingChanges] = useState(false);
  const [modifications, setModifications] = useState<FileModification[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (!repoUrl) {
      setError("No repository URL provided");
      setLoading(false);
      return;
    }

    const parseGitHubUrl = (url: string) => {
      try {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) throw new Error("Invalid GitHub URL");
        
        const owner = match[1];
        let repo = match[2];
        

        repo = repo.replace(/\.git$/, "");
        
        return { owner, repo, branch: "main" };
      } catch {
        throw new Error("Invalid GitHub URL format");
      }
    };

    const fetchRepoTree = async () => {
      try {
        setLoading(true);
        
        const info = parseGitHubUrl(repoUrl);
        

        const recaptchaToken = await executeRecaptcha("fetch_repo_tree");
        if (!recaptchaToken) {
          console.warn("reCAPTCHA token not available, continuing anyway");
        }
        
        const response = await fetch(
          `/api/github/tree?owner=${info.owner}&repo=${info.repo}&branch=${info.branch}&recaptcha=${recaptchaToken}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch repository");
        }
        
        const data = await response.json();
        

        setRepoInfo({
          owner: info.owner,
          repo: info.repo,
          branch: data.defaultBranch
        });
        
        const fileTree = buildFileTree(data.tree);
        setTree(fileTree);
        

        const files = data.tree
          .filter((item: GitHubTreeItem) => item.type === "blob")
          .map((item: GitHubTreeItem) => item.path);
        setFlatFileList(files);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repository");
      } finally {
        setLoading(false);
      }
    };

    fetchRepoTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  const handleFileSelect = async (path: string) => {
    if (!repoInfo) return;
    
    setSelectedFile(path);
    setFileLoading(true);
    setShowDiff(false);
    
    try {

      const recaptchaToken = await executeRecaptcha("fetch_file");
      if (!recaptchaToken) {
        console.warn("reCAPTCHA token not available, continuing anyway");
      }
      
      const response = await fetch(
        `/api/github/file?owner=${repoInfo.owner}&repo=${repoInfo.repo}&path=${encodeURIComponent(path)}&branch=${repoInfo.branch}&recaptcha=${recaptchaToken}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch file");
      }
      
      const data = await response.json();
      setFileContent(data.content);
    } catch (err) {
      console.error("Error loading file:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load file";
      setFileContent(`// Error: ${errorMessage}\n// Please try again or refresh the page.`);
    } finally {
      setFileLoading(false);
    }
  };

  const handleGenerateChecklist = async (instruction: string) => {
    if (!repoInfo) return;
    
    setIsGeneratingChecklist(true);
    
    try {

      const recaptchaToken = await executeRecaptcha("generate_checklist");
      if (!recaptchaToken) {
        console.warn("reCAPTCHA token not available, continuing anyway");
      }
      
      const response = await fetch("/api/ai/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          repoOwner: repoInfo.owner,
          repoName: repoInfo.repo,
          branch: repoInfo.branch,
          currentFilePath: selectedFile,
          currentFileContent: fileContent,
          recaptchaToken,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate checklist");
      }
      
      const data = await response.json();
      setChecklist(data.checklist);
      setSessionId(data.sessionId);
    } catch (err) {
      console.error("Error generating checklist:", err);
      alert(err instanceof Error ? err.message : "Failed to generate checklist");
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  const handleExecuteChanges = async () => {
    if (!repoInfo || !sessionId || checklist.length === 0) return;
    
    setIsExecutingChanges(true);
    
    try {

      const fileContents: Record<string, string> = {};
      
      if (selectedFile && fileContent) {
        fileContents[selectedFile] = fileContent;
      } else {
        alert("Please open a file in the editor before executing changes.");
        setIsExecutingChanges(false);
        return;
      }
      

      const modifyRecaptchaToken = await executeRecaptcha("execute_changes");
      if (!modifyRecaptchaToken) {
        console.warn("reCAPTCHA token not available, continuing anyway");
      }
      

      const response = await fetch("/api/ai/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          checklist,
          fileTree: flatFileList,
          fileContents,
          recaptchaToken: modifyRecaptchaToken,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute changes");
      }
      
      const data = await response.json();
      

      const currentFileModification = data.modifications.find(
        (mod: FileModification) => mod.path === selectedFile
      );
      
      if (currentFileModification) {
        setModifications([currentFileModification]);
        setShowDiff(true);
      } else {
        alert("No modifications were generated for the currently open file.");
      }
      

      setChecklist(prev => prev.map(item => ({ ...item, completed: true })));
    } catch (err) {
      console.error("Error executing changes:", err);
      alert(err instanceof Error ? err.message : "Failed to execute changes");
    } finally {
      setIsExecutingChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-zinc-400">Loading repository...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="text-blue-400 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-blue-400 hover:underline text-sm">
            ← Back
          </button>
          {repoInfo && (
            <h1 className="text-zinc-100 font-semibold">
              {repoInfo.owner}/{repoInfo.repo}
            </h1>
          )}
        </div>
      </div>

      {}
      <div className="flex-1 flex overflow-hidden">
        {}
        <div className="w-64 border-r border-zinc-800 overflow-auto">
          <FileExplorer
            tree={tree}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </div>

        {}
        <div className="flex-1 relative">
          {fileLoading ? (
            <div className="flex items-center justify-center h-full bg-zinc-900">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : showDiff && modifications.length > 0 ? (
            <div className="h-full overflow-auto">
              {modifications.map((mod, index) => (
                <DiffViewer
                  key={index}
                  original={mod.originalContent}
                  modified={mod.modifiedContent}
                  filename={mod.path}
                />
              ))}
            </div>
          ) : selectedFile ? (
            <CodeEditor content={fileContent} filename={selectedFile} />
          ) : (
            <div className="flex items-center justify-center h-full bg-zinc-900 text-zinc-500">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>

      {}
      <AIPanel
        onGenerateChecklist={handleGenerateChecklist}
        onExecuteChanges={handleExecuteChanges}
        checklist={checklist}
        isGenerating={isGeneratingChecklist}
        isExecuting={isExecutingChanges}
      />
    </div>
  );
}

export default function RepoViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <RepoViewerContent />
    </Suspense>
  );
}
