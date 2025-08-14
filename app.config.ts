export default defineAppConfig({
  title: 'jCloud.me',
  worker: {
    tempDir: './temp',
  },
  binaries: {
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
    ytdlp: 'yt-dlp',
  },
  toaster: {
    position: 'bottom-left' as const,
    expand: true,
    duration: 5000
  },
  ui: {
    toast: {
      slots: {
        root: 'min-w-80 overflow-wrap z-[100] bg-white shadow-lg rounded-lg ring ring-default p-4 m-4 m-bottom-10 flex gap-2.5 focus:outline-none',
        wrapper: 'w-0 h-0 flex-1 flex flex-col',
        title: 'text-sm font-medium text-highlighted',
        description: 'text-sm text-muted',
        icon: 'shrink-0 size-5',
        avatar: 'shrink-0',
        avatarSize: '2xl',
        actions: 'flex gap-1.5 shrink-0',
        progress: 'absolute inset-x-0 bottom-0',
        close: 'p-0'
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