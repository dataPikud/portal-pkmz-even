import { create } from 'zustand';

interface EditModeState {
  isEditMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (val: boolean) => void;
}

export const useEditModeStore = create<EditModeState>((set) => ({
  isEditMode: false,
  toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),
  setEditMode: (val: boolean) => set({ isEditMode: val }),
}));
