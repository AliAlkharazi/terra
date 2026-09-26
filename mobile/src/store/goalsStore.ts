import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Goal = {
  id: string;
  name: string;
  target: number;
};

interface GoalsState {
  goals: Goal[];
  addGoal: (name: string, target?: number) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: [],
      addGoal: (name, target = 0) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          goals: [
            ...state.goals,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: trimmed,
              target: Math.max(0, target ?? 0),
            },
          ],
        }));
      },
    }),
    {
      name: 'terra-goals-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
