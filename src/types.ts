export interface Channel {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  uploads: Record<string, boolean>; // channelId -> isUploaded
}

export interface AppData {
  channels: Channel[];
  records: Record<string, DailyRecord>;
}

export type TabType = 'home' | 'calendar' | 'add' | 'analytics' | 'backup';
