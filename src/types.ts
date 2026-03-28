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

export interface Board {
  id: string;
  name: string;
  createdAt: number; // timestamp
}

export interface AppData {
  channels: Channel[];
  boards: Board[];
  notes: Note[];
}

export type TabType = 'home' | 'calendar' | 'add' | 'analytics' | 'backup';
