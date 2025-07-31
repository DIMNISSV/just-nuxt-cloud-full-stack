// types/index.ts

// --- Enums, соответствующие схеме Prisma ---

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum AssetStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  AVAILABLE = 'AVAILABLE',
  ERROR = 'ERROR'
}

export enum AssetType {
  MEDIA_SOURCE = 'MEDIA_SOURCE',
  PERSONAL = 'PERSONAL'
}

export enum StreamType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  SUBTITLE = 'SUBTITLE'
}

// --- Модели данных, соответствующие схеме Prisma ---

export interface User {
  id: number;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface FileAsset {
  id: number;
  uuid: string;
  originalFilename: string;
  s3Key: string;
  sizeBytes: number; // Prisma Client преобразует BigInt в number по умолчанию
  mimeType: string;
  status: AssetStatus;
  assetType: AssetType;
  createdAt: string;
  userId: number;

  mediaFileMeta?: MediaFileMeta;
  personalFileMeta?: PersonalFileMeta;
}

export interface MediaFileMeta {
  id: number;
  assetId: number;
  asset?: FileAsset;
  derivedStreams: MediaStream[];
  linkedEpisodeId: number | null;
  linkedEpisode?: Episode;
}

export interface PersonalFileMeta {
  id: number;
  assetId: number;
  asset?: FileAsset;
  folderId: number | null;
  folder?: PersonalFolder;
}

export interface PersonalFolder {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  parentId: number | null;

  user?: User;
  parent?: PersonalFolder;
  children?: PersonalFolder[];
  files?: PersonalFileMeta[];
}

export interface MediaStream {
  id: number;
  type: StreamType;
  filePath: string;
  qualityLabel: string;
  codecInfo: string | null;
  language: string | null;
  sourceMediaFileId: number;
}

export interface Composition {
  id: number;
  name: string;
  audioOffsetMs: number;
  createdAt: string;

  episodeId: number;
  videoStreamId: number;
  audioStreamId: number;
  subtitleStreamId: number | null; // Добавлено для будущей поддержки
  translatorId: number | null;

  episode?: Episode;
  videoStream?: MediaStream;
  audioStream?: MediaStream;
  subtitleStream?: MediaStream;
  translator?: Translator;

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
  externalIds: Record<string, any> | null;
  seasons: Season[];
}

export interface Season {
  id: number;
  seasonNumber: number;
  createdAt: string;
  seriesId: number;
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
  season?: Season;
  compositions?: Composition[];
  linkedMediaFiles?: MediaFileMeta[];
}


// --- Вспомогательные типы для API и UI ---

export interface EpisodeSelection {
  seriesId: number;
  seasonNumber: number;
  episodeId: number;
  episodeNumber: number;
}

export enum ExternalDbType {
  SHIKIMORI = 'shikimori',
  IMDB = 'imdb',
  KINOPOISK = 'kinopoisk',
  WORLD_ART = 'world-art',
}

// Полезно для UI, чтобы различать типы элементов в файловом менеджере
export type StorageItem = (PersonalFolder & { itemType: 'folder' }) | (PersonalFileMeta & { itemType: 'file' });

// Тип для входных данных при запросе pre-signed URL
export interface RequestUploadPayload {
  filename: string;
  sizeBytes: number;
  mimeType: string;
  assetType: AssetType;
  // Дополнительные метаданные в зависимости от assetType
  folderId?: number; // Для PERSONAL
}

// Тип для ответа с pre-signed URL
export interface RequestUploadResponse {
  assetId: number;
  uploadUrl: string; // Pre-signed URL для PUT-запроса
}

// Тип для запроса завершения загрузки
export interface FinalizeUploadPayload {
  // Ничего не нужно, ID ассета берется из URL
}