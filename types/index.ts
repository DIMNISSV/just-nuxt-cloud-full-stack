// types/index.ts

// 1. Перечисление для всех поддерживаемых внешних источников
export enum ExternalDbType {
  SHIKIMORI = 'shikimori',
  IMDB = 'imdb',
  KINOPOISK = 'kinopoisk',
  WORLD_ART = 'world-art',
}

// 2. Типы для загрузок
export type UploadStatus = 'new' | 'downloading' | 'processing' | 'completed' | 'error';
export type UploadType = 'file' | 'url' | 'torrent' | 'gdrive' | 'yt-dlp';

export interface Upload {
  id: number;
  uuid: string;
  status: UploadStatus;
  type: UploadType;
  source: string;
  original_filename: string;
  streams: MediaStream[];
  linked_episode_id: number | null;
  userId: number;
  createdAt: string;
  statusMessage?: string;
}

// 3. Типы для контента (Сериалы, Сезоны, Эпизоды)
export interface Episode {
  id: number;
  episode_number: number;
  title: string;
  // ID сезона из внешней БД (e.g. Shikimori ID для конкретного сезона)
  external_ids?: { [key in ExternalDbType]?: string };
}

export interface Season {
  season_number: number;
  episodes: Episode[];
}

export interface Series {
  id: number;
  title: string;
  poster_url: string;
  // "Копилка" всех внешних ID, связанных с этой франшизой
  external_ids: { [key in ExternalDbType]?: string[] };
  seasons: Season[];
}

// 4. Остальные типы (без изменений)
export interface MediaStream {
  id: number;
  stream_type: 'video' | 'audio' | 'subtitle';
  file_path: string;
  codec_info: string;
  uploader_username: string;
  title?: string;
  language?: string;
}

export interface Translator {
  id: number;
  name: string;
}

export interface Composition {
  id: number;
  name: string;
  audio_stream_id: number;
  video_stream_id: number;
  player_config: {
    video: string;
    audio: { title: string, src: string }[];
    subtitles: { title: string, src: string }[];
  }
}

export interface EpisodeSelection {
  seriesId: number;
  seasonNumber: number;
  episodeId: number;
  episodeNumber: number;
}

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  role: 'user' | 'admin';
}