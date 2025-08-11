// nuxt.config.ts
import tailwindcss from "@tailwindcss/vite";
// Импортируем нашу общую конфигурацию
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
  // Просто передаем импортированный объект в Nuxt
  runtimeConfig,
})