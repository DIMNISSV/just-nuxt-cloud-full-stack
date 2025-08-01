// app.config.ts
export default defineAppConfig({
  // ★ ИЗМЕНЕНИЕ: Обновляем заголовок
  title: 'jCloud.me',
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
        "root": "flex w-80 m-4 bg-white group overflow-hidden shadow-lg rounded-lg ring ring-default p-4 gap-3 focus:outline-none",
      },
    },
    modal: {
      slots: {
        overlay: 'fixed inset-0 bg-gray-200/75 dark:bg-gray-800/75',
        content: 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full sm:max-w-lg bg-white gap-0'
      }
    }
  }
})