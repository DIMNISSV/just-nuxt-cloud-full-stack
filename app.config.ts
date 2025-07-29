// app.config.ts

export default defineAppConfig({
  // Публичное название приложения
  title: 'Just Media Server',
  
  // Конфигурация, которая не является секретной и определяется на этапе сборки
  worker: {
    tempDir: './temp', // Путь к временной папке для воркеров
  },
  
  binaries: {
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
    ytdlp: 'yt-dlp',
  },
})