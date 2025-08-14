import tailwindcss from "@tailwindcss/vite";
import { runtimeConfig } from './config';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image'],
  css: ['~/assets/css/main.css'],
  debug: true,
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  runtimeConfig,
})