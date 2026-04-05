import { defineStore } from "pinia";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    theme: "dark" as "dark" | "light",
  }),

  actions: {
    init() {
      if (typeof window === "undefined") return;
      const preferred = localStorage.getItem("theme");
      if (preferred === "dark" || preferred === "light") {
        this.theme = preferred;
      }
      this.applyTheme();
    },

    toggle() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      this.applyTheme();
    },

    applyTheme() {
      if (typeof window === "undefined") return;
      document.documentElement.classList.toggle("dark", this.theme === "dark");
      localStorage.setItem("theme", this.theme);
    },
  },
});
