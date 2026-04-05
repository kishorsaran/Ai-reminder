import { AppData } from '../types';

const STORAGE_KEY = 'channel_tracker_data';

const defaultData: AppData = {
  channels: [],
  boards: [],
  notes: [],
  prompts: [],
};

export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
  } catch (error) {
    console.error('Failed to load data from localStorage', error);
    return defaultData;
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage', error);
  }
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayString = (): string => {
  return formatDate(new Date());
};

export const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday is 0
  d.setDate(diff);
  return formatDate(d);
};
