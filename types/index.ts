// types/index.ts

// --- Enums, соответствующие новой схеме Prisma ---

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

// ★ НОВЫЙ ENUM
export enum NodeType {
  FILE = 'FILE',
  FOLDER = 'FOLDER'
}

// ★ НОВЫЙ ENUM
export enum NodeStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  AVAILABLE = 'AVAILABLE',
  ERROR = 'ERROR'
}

// --- Модели данных, соответствующие новой схеме Prisma ---

export interface User {
  id: number;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// ★ НОВАЯ МОДЕЛЬ: StorageNode
export interface StorageNode {
  id: number;
  uuid: string;
  type: NodeType;
  name: string;
  s3Key?: string | null;
  mimeType?: string | null;
  sizeBytes?: number; // Prisma Client преобразует BigInt в number
  status: NodeStatus;
  meta?: Record<string, any> | null;
  ownerId: number;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;

  // Опциональные связи для UI
  children?: StorageNode[];
  owner?: User;
}

// ★ НОВАЯ МОДЕЛЬ: EpisodeMediaSource
export interface EpisodeMediaSource {
  id: number;
  episodeId: number;
  storageNodeId: number;
  storageNode?: StorageNode;
}

// ★ ИЗМЕНЕНИЕ: Composition
export interface Composition {
  id: number;
  name: string;
  audioOffsetMs: number;
  createdAt: string;

  episodeId: number;
  videoStreamNodeId: number;
  audioStreamNodeId: number;
  subtitleStreamNodeId?: number | null;
  translatorId?: number | null;

  episode?: Episode;
  videoStreamNode?: StorageNode;
  audioStreamNode?: StorageNode;
  subtitleStreamNode?: StorageNode;
  translator?: Translator;

  // Конфиг для плеера остается концептуально тем же
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

// ★ ИЗМЕНЕНИЕ: Episode
export interface Episode {
  id: number;
  episodeNumber: number;
  title: string | null;
  createdAt: string;
  seasonId: number;
  externalIds: Record<string, any> | null;
  season?: Season;
  compositions?: Composition[];
  mediaSources?: EpisodeMediaSource[]; // Связь с исходными файлами
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