import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true, // автоматически открывает страницу в браузере
  },
  base: '/mesto-ad-actual/',     // путь для сборки
});