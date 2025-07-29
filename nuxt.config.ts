// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  debug: true,
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  runtimeConfig: {
    // Приватные ключи, доступные только на СЕРВЕРЕ
    // Могут быть переопределены переменными окружения, например, NUXT_JWT_SECRET
    jwtSecret: process.env.NUXT_JWT_SECRET || 'your-super-secret-key-for-development',
    
    // Блок `public` будет доступен и на КЛИЕНТЕ
    public: {
      // Здесь можно хранить несекретные настройки, если нужно
      // Например, базовый URL для API
      apiBase: '/api/v1',
    }
  },
})
