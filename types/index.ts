export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface DriveUploadResponse {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Letter {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isDraft: boolean;
  isPublished?: boolean;
  tags?: string[];
}

export interface EditorProps {
  documentId?: string;
  initialContent?: string;
  readOnly?: boolean;
  onSave?: (content: string) => Promise<void>;
}

export interface ToolbarProps {
  editor: import("@tiptap/core").Editor;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onSaveToDrive: () => Promise<void>;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface UserSettings {
  userId: string;
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  autosaveEnabled: boolean;
  autosaveInterval: number;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  duration?: number;
}
