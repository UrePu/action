import { create } from "zustand";

interface DarkModeState {
  isDark: boolean;
  setDark: (value: boolean) => void;
  toggle: () => void;
  syncWithSystem: () => void;
}

export const useDarkModeStore = create<DarkModeState>((set) => ({
  isDark: false,
  setDark: (value) => {
    set({ isDark: value });
    if (value) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  },
  toggle: () =>
    set((state) => {
      const newDark = !state.isDark;
      if (newDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return { isDark: newDark };
    }),
  syncWithSystem: () => {
    const theme = localStorage.getItem("theme");
    const isDark =
      theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    set({ isDark });
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
}));
