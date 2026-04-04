export interface Channel {
  id: string;
  name: string;
  description?: string;
  uploaded: boolean;
  lastUpdated: number; // timestamp
  order: number;
  history?: string[]; // Array of YYYY-MM-DD strings
}

export interface Note {
  id: string;
  boardId: string;
  content: string;
  color: string;
  x: number;
  y: number;
  updatedAt: number; // timestamp
}

export interface Prompt {
  id: string;
  channelId: string;
  title: string;
  category: string;
  content: string;
  createdAt: number;
  lastUsed: number;
}

export interface Board {
  id: string;
  name: string;
  createdAt: number; // timestamp
}

export interface UserSettings {
  earnings: number;
  earningGoal: number;
}

export interface AppData {
  channels: Channel[];
  boards: Board[];
  notes: Note[];
  prompts: Prompt[];
  settings?: UserSettings;
}

export type TabType = 'home' | 'prompt-vault' | 'add' | 'analytics' | 'backup';
