import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

interface FavoritesState {
  favorites: number[];
  videoFavorites: number[];
  toggleFavorite: (systemId: number) => void;
  isFavorite: (systemId: number) => boolean;
  toggleVideoFavorite: (videoId: number) => void;
  isVideoFavorite: (videoId: number) => boolean;
}

const getStorageKeys = () => {
  const user = useAuthStore.getState().user;
  const id = user?.id || user?.employeeId || 'guest';
  return {
    systemsKey: `portal-favorites-${id}`,
    videosKey: `portal-video-favorites-${id}`,
  };
};

const getInitialFavorites = (): { favorites: number[]; videoFavorites: number[] } => {
  try {
    const { systemsKey, videosKey } = getStorageKeys();
    const storedSys = localStorage.getItem(systemsKey);
    const storedVid = localStorage.getItem(videosKey);
    return {
      favorites: storedSys ? JSON.parse(storedSys) : [],
      videoFavorites: storedVid ? JSON.parse(storedVid) : [],
    };
  } catch {
    return { favorites: [], videoFavorites: [] };
  }
};

const initial = getInitialFavorites();

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: initial.favorites,
  videoFavorites: initial.videoFavorites,

  toggleFavorite: (systemId: number) => {
    const current = get().favorites;
    const exists = current.includes(systemId);
    const updated = exists
      ? current.filter((id) => id !== systemId)
      : [...current, systemId];

    try {
      const { systemsKey } = getStorageKeys();
      localStorage.setItem(systemsKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }

    set({ favorites: updated });
  },

  isFavorite: (systemId: number) => {
    return get().favorites.includes(systemId);
  },

  toggleVideoFavorite: (videoId: number) => {
    const current = get().videoFavorites;
    const exists = current.includes(videoId);
    const updated = exists
      ? current.filter((id) => id !== videoId)
      : [...current, videoId];

    try {
      const { videosKey } = getStorageKeys();
      localStorage.setItem(videosKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save video favorites:', e);
    }

    set({ videoFavorites: updated });
  },

  isVideoFavorite: (videoId: number) => {
    return get().videoFavorites.includes(videoId);
  },
}));

// Re-initialize when auth user changes
useAuthStore.subscribe(() => {
  try {
    const { favorites, videoFavorites } = getInitialFavorites();
    useFavoritesStore.setState({ favorites, videoFavorites });
  } catch {
    useFavoritesStore.setState({ favorites: [], videoFavorites: [] });
  }
});
