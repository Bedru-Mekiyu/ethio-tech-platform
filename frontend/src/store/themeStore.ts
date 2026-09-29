import { create } from "zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ethio_theme";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Explicit user choice only; default is always light
    return saved === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyThemeToDOM(theme: Theme) {
  try {
    const root = document.documentElement;
    // Briefly enable CSS transitions for smooth theme cross-fade
    root.classList.add("theme-transitioning");
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.removeAttribute("data-theme");
      root.style.colorScheme = "light";
    }
    // Remove the transition enabler after the animation window
    setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 300);
  } catch {
    // Non-DOM environment fallback
  }
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const nextTheme: Theme = state.theme === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // storage disabled fallback
      }
      applyThemeToDOM(nextTheme);
      return { theme: nextTheme };
    }),
  setTheme: (nextTheme: Theme) =>
    set(() => {
      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // storage disabled fallback
      }
      applyThemeToDOM(nextTheme);
      return { theme: nextTheme };
    }),
}));
