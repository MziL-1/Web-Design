'use client';

import { create } from 'zustand';

export type ActiveTab = 'discover' | 'following';

interface AppState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'discover',
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  isSearching: false,
  setIsSearching: (v) => set({ isSearching: v }),
}));
