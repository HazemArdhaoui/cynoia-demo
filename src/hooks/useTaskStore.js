import { create } from 'zustand';

export const useTaskStore = create((set) => ({
  logs: [],
  addLog: (message) => set((state) => ({
    logs: [`[${new Date().toLocaleTimeString()}] ${message}`, ...state.logs].slice(0, 10)
  })),
  clearLogs: () => set({ logs: [] }),
}));
