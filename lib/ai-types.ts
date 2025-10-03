export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface FileModification {
  path: string;
  originalContent: string;
  modifiedContent: string;
}

export interface AITaskRequest {
  instruction: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  currentFilePath?: string;
  currentFileContent?: string;
}

export interface AITaskResponse {
  checklist: ChecklistItem[];
  sessionId: string;
}

export interface AIModificationRequest {
  sessionId: string;
  checklist: ChecklistItem[];
  fileTree: string[];
  fileContents: Record<string, string>;
}

export interface AIModificationResponse {
  modifications: FileModification[];
  explanation: string;
}
