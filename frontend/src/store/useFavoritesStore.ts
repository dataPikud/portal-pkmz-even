import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

interface FavoritesState {
  favorites: number[];
  toggleFavorite: (systemId: number) => void;
  isFavorite: (systemId: number) => boolean;
}

const getStorageKey = (): string => {
  const user = useAuthStore.getState().user;
  return `portal-favorites-${user?.id || user?.employeeId || 'guest'}`;
};

const getInitialFavorites = (): number[] => {
  try {
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: getInitialFavorites(),

  toggleFavorite: (systemId: number) => {
    const current = get().favorites;
    const exists = current.includes(systemId);
    const updated = exists
      ? current.filter((id) => id !== systemId)
      : [...current, systemId];

    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save favorites to localStorage:', e);
    }

    set({ favorites: updated });
  },

  isFavorite: (systemId: number) => {
    return get().favorites.includes(systemId);
  },
}));

// Re-initialize when auth user changes
useAuthStore.subscribe((state) => {
  try {
    const key = `portal-favorites-${state.user?.id || state.user?.employeeId || 'guest'}`;
    const stored = localStorage.getItem(key);
    const favorites = stored ? JSON.parse(stored) : [];
    useFavoritesStore.setState({ favorites });
  } catch {
    useFavoritesStore.setState({ favorites: [] });
  }
});
