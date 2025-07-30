// app.config.ts
// Этот файл всё еще нужен Nuxt для публичной конфигурации на стороне клиента.
// Его содержимое должно быть синхронизировано с config.ts

export default defineAppConfig({
  title: 'Just Media Server',
  worker: {
    tempDir: './temp',
  },
  binaries: {
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
    ytdlp: 'yt-dlp',
  },
})