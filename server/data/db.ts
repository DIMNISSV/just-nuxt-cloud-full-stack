// server/data/db.ts

import { ExternalDbType } from '~/types';
import type { Series, MediaStream, Upload, Translator, User, Composition } from '~/types';

// Используем пересечение типов для хранения внутренних полей в `compositions`
type StoredComposition = Composition & { episodeId: number };

// --- Пользователи ---
export let users: User[] = [
  { id: 1, username: 'admin', passwordHash: 'hashed_admin', role: 'admin' },
  { id: 2, username: 'user', passwordHash: 'hashed_user', role: 'user' },
];

// --- Медиапотоки ---
export let mediaStreams: MediaStream[] = [
  // Потоки для "Атаки Титанов"
  { id: 101, stream_type: 'video', file_path: '/storage/aot_s1_raw.mkv', codec_info: 'H.265, 1080p', uploader_username: 'User1', title: 'AOT S1 BDRip' },
  { id: 102, stream_type: 'audio', file_path: '/storage/aot_s1_jpn.mka', codec_info: 'FLAC', uploader_username: 'User1', language: 'JPN', title: 'Original S1' },
  { id: 202, stream_type: 'audio', file_path: '/storage/aot_s1_rus_tvshows.mka', codec_info: 'AC3', uploader_username: 'User2', language: 'RUS', title: 'TVShows S1' },
  { id: 401, stream_type: 'video', file_path: '/storage/aot_s2_raw.mkv', codec_info: 'H.265, 1080p', uploader_username: 'User1', title: 'AOT S2 BDRip' },
  { id: 402, stream_type: 'audio', file_path: '/storage/aot_s2_rus_tvshows.mka', codec_info: 'AC3', uploader_username: 'User1', language: 'RUS', title: 'TVShows S2' },
  // Потоки для "Ковбоя Бибопа"
  { id: 301, stream_type: 'video', file_path: '/storage/bebop_raw.mkv', codec_info: 'H.264, 1080p', uploader_username: 'User1', title: 'Bebop BDRip' },
  { id: 302, stream_type: 'audio', file_path: '/storage/bebop_jpn.mka', codec_info: 'DTS', uploader_username: 'User1', language: 'JPN', title: 'Original Bebop' },
];

// --- Сериалы (Франшизы) ---
export let series: Series[] = [
  {
    id: 42,
    title: 'Атака Титанов',
    poster_url: 'https://placehold.co/400x600/2d3748/e2e8f0?text=AoT',
    external_ids: {
      [ExternalDbType.IMDB]: ['tt2560140'],
      [ExternalDbType.SHIKIMORI]: ['16498'] // Только ID первого сезона для начала
    },
    seasons: [
      {
        season_number: 1,
        episodes: [
          { id: 543, episode_number: 1, title: 'Тебе, 2000 лет спустя', external_ids: { [ExternalDbType.SHIKIMORI]: '16498' } },
          { id: 544, episode_number: 2, title: 'Тот день', external_ids: { [ExternalDbType.SHIKIMORI]: '16498' } }
        ]
      }
    ]
  },
  {
    id: 101,
    title: 'Ковбой Бибоп',
    poster_url: 'https://placehold.co/400x600/714423/e2e8f0?text=Cowboy+Bebop',
    external_ids: {
      [ExternalDbType.IMDB]: ['tt0213338'],
      [ExternalDbType.SHIKIMORI]: ['1']
    },
    seasons: [
      {
        season_number: 1,
        episodes: [
          { id: 801, episode_number: 1, title: 'Астероидный блюз', external_ids: { [ExternalDbType.SHIKIMORI]: '1' } }
        ]
      }
    ]
  }
];

// --- Загрузки ---
export let uploads: Upload[] = [
  {
    id: 1,
    uuid: 'f1e2d3c4-b5a6-4f7e-8c9d-0a1b2c3d4e5f',
    status: 'completed',
    type: 'file',
    source: 'Attack.on.Titan.S01E01.TVShows.720p.mkv',
    original_filename: 'Attack.on.Titan.S01E01.TVShows.720p.mkv',
    streams: [mediaStreams[2]],
    linked_episode_id: 543,
    userId: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    uuid: 'f1e2d3c4-b5a6-4f7e-8c9d-0a1b2c3d4r5f',
    status: 'completed',
    type: 'file',
    source: 'Attack.on.Titan.S01E02.TVShows.720p.mkv',
    original_filename: 'Attack.on.Titan.S01E02.TVShows.720p.mkv',
    streams: [mediaStreams[4]],
    linked_episode_id: 544,
    userId: 1,
    createdAt: new Date().toISOString()
  }
];

// --- Переводчики ---
export let translators: Translator[] = [
  { id: 1, name: 'Неизвестный переводчик' },
  { id: 10, name: 'Original' },
  { id: 15, name: 'TVShows' },
];

// --- Сборки (Переводы) ---
export let compositions: StoredComposition[] = [
  {
    id: 1001,
    name: 'TVShows',
    episodeId: 543,
    audio_stream_id: 202,
    video_stream_id: 101,
    player_config: {
      video: '/storage/aot_s1_raw.mkv',
      audio: [{ title: 'TVShows S1', src: '/storage/aot_s1_rus_tvshows.mka' }],
      subtitles: [],
    }
  }
];