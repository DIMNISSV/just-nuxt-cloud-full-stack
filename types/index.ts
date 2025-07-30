// types/index.ts

// --- Enums, соответствующие схеме Prisma ---

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UploadStatus {
  NEW = 'NEW',
  DOWNLOADING = 'DOWNLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum StreamType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  SUBTITLE = 'SUBTITLE'
}

// --- Модели данных, соответствующие схеме Prisma (camelCase) ---

export interface User {
  id: number;
  username: string;
  // passwordHash никогда не должен отправляться на клиент
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Upload {
  id: number;
  uuid: string;
  status: UploadStatus;
  statusMessage: string | null;
  type: string; // 'url', 'torrent', etc.
  source: string;
  originalFilename: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;

  // Связанные модели
  user?: User;
  mediaStreams: MediaStream[];
  linkedEpisodeId: number | null;
  linkedEpisode?: Episode;
}

export interface MediaStream {
  id: number;
  type: StreamType;
  filePath: string; // Ключ объекта в S3
  codecInfo: string | null;
  title: string | null;
  language: string | null;
  createdAt: string;
  uploadId: number;

  // Связанные модели
  upload?: Upload;
}

export interface Composition {
  id: number;
  name: string; // Название перевода (денормализовано из Translator)
  audioOffsetMs: number;
  createdAt: string;

  episodeId: number;
  videoStreamId: number;
  audioStreamId: number;
  translatorId: number;

  // Связанные модели
  episode?: Episode;
  videoStream?: MediaStream;
  audioStream?: MediaStream;
  translator?: Translator;

  // Это поле формируется на лету, его нет в БД
  player_config?: {
    video: string;
    audio: { title: string, src: string }[];
    subtitles: { title: string, src: string }[];
  };
}

export interface Translator {
  id: number;
  name: string;
  compositions?: Composition[];
}

export interface Series {
  id: number;
  title: string;
  posterUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Prisma хранит JSON как `Prisma.JsonValue`, для фронтенда это может быть Record
  externalIds: Record<string, any> | null;

  // Связанные модели
  seasons: Season[];
}

export interface Season {
  id: number;
  seasonNumber: number;
  createdAt: string;
  seriesId: number;

  // Связанные модели
  series?: Series;
  episodes: Episode[];
}

export interface Episode {
  id: number;
  episodeNumber: number;
  title: string | null;
  createdAt: string;
  seasonId: number;
  externalIds: Record<string, any> | null;

  // Связанные модели
  season?: Season;
  compositions?: Composition[];
  uploads?: Upload[];
}


// --- Вспомогательные типы для UI ---

export interface EpisodeSelection {
  seriesId: number;
  seasonNumber: number;
  episodeId: number;
  episodeNumber: number;
}

// Тип для внешних БД, который используется в формах
export enum ExternalDbType {
  SHIKIMORI = 'shikimori',
  IMDB = 'imdb',
  KINOPOISK = 'kinopoisk',
  WORLD_ART = 'world-art',
}