import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  app: {
    pageTransition: { name: "fade", mode: "out-in" },
    head: {
      script: [
        {
          src: "https://app.sandbox.midtrans.com/snap/snap.js",
          "data-client-key": process.env.MIDTRANS_CLIENT_KEY,
          type: "text/javascript",
        },
      ],
    },
  },
  modules: ["@nuxt/eslint", "@nuxt/ui", "@pinia/nuxt", "@nuxt/image"],

  pinia: {
    storesDirs: ["./stores/**"],
  },

  devtools: {
    enabled: true,
  },
  css: ["~/assets/css/main.css"],

  routeRules: {
    "/": { prerender: true },
  },

  compatibilityDate: "2025-01-15",

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
