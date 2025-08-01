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
  ui: {
    toast: {
      "slots": {
        "root": "w-90 bg-white m-4 relative group overflow-hidden shadow-lg rounded-lg ring ring-default p-4 flex gap-2.5 focus:outline-none",
      },
    }
  }
})