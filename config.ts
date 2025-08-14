import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

export const appConfig = {
    title: 'Just Media Server',
    worker: {
        tempDir: './temp',
    },
    binaries: {
        ffmpeg: 'ffmpeg',
        ffprobe: 'ffprobe',
        ytdlp: 'yt-dlp',
    },
}

export const runtimeConfig = {
    jwtSecret: process.env.NUXT_JWT_SECRET || 'your-super-secret-key-for-development',
    s3: {
        endpoint: process.env.NUXT_S3_ENDPOINT,
        region: process.env.NUXT_S3_REGION,
        accessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY,
        bucket: process.env.NUXT_S3_BUCKET,
    },
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    },
    public: {
        apiBase: '/api/v1',
    },
}