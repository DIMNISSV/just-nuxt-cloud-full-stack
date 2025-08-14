

import { ExternalDbType } from '~/types';
import type { Series, MediaStream, Upload, Translator, User, Composition } from '~/types';


type StoredComposition = Composition & { episodeId: number };


export let users: User[] = [
  { id: 1, username: 'admin', passwordHash: 'hashed_admin', role: 'admin' },
  { id: 2, username: 'user', passwordHash: 'hashed_user', role: 'user' },
];


export let mediaStreams: MediaStream[] = [
  
  { id: 101, type: 'video', file_path: '/storage/aot_e1_raw.mkv', codec_info: 'H.265, 1080p', uploaderUsername: 'User2', title: 'AOT E1 BDRip' },
  { id: 102, type: 'audio', file_path: '/storage/aot_e1_jpn.mka', codec_info: 'FLAC', uploaderUsername: 'User2', language: 'JPN', title: 'Original E1' },
  { id: 202, type: 'audio', file_path: '/storage/aot_e1_rus_tvshows.mka', codec_info: 'AC3', uploaderUsername: 'User1', language: 'RUS', title: 'TVShows E1' },
  { id: 401, type: 'video', file_path: '/storage/aot_e2_raw.mkv', codec_info: 'H.265, 1080p', uploaderUsername: 'User1', title: 'AOT E2 BDRip' },
  { id: 402, type: 'audio', file_path: '/storage/aot_e2_rus_tvshows.mka', codec_info: 'AC3', uploaderUsername: 'User1', language: 'RUS', title: 'TVShows E2' },
  { id: 501, type: 'video', file_path: '/storage/aot_e2_raw.mkv', codec_info: 'H.265, 1080p', uploaderUsername: 'User1', title: 'AOT E2 BDRip' },
  { id: 502, type: 'audio', file_path: '/storage/aot_e2_rus_tvshows.mka', codec_info: 'AC3', uploaderUsername: 'User1', language: 'RUS', title: 'Неизвестный E2' },
  
  { id: 301, type: 'video', file_path: '/storage/bebop_raw.mkv', codec_info: 'H.264, 1080p', uploaderUsername: 'User1', title: 'Bebop BDRip' },
  { id: 302, type: 'audio', file_path: '/storage/bebop_jpn.mka', codec_info: 'DTS', uploaderUsername: 'User1', language: 'JPN', title: 'Original Bebop' },
];


export let series: Series[] = [
  {
    id: 42,
    title: 'Атака Титанов',
    posterUrl: 'https://placehold.co/400x600/2d3748/e2e8f0?text=AoT',
    externalIds: {
      [ExternalDbType.IMDB]: ['tt2560140'],
      [ExternalDbType.SHIKIMORI]: ['16498'] 
    },
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          { id: 543, episodeNumber: 1, title: 'Тебе, 2000 лет спустя', externalIds: { [ExternalDbType.SHIKIMORI]: '16498' } },
          { id: 544, episodeNumber: 2, title: 'Тот день', externalIds: { [ExternalDbType.SHIKIMORI]: '16498' } }
        ]
      }
    ]
  },
  {
    id: 101,
    title: 'Ковбой Бибоп',
    posterUrl: 'https://placehold.co/400x600/714423/e2e8f0?text=Cowboy+Bebop',
    externalIds: {
      [ExternalDbType.IMDB]: ['tt0213338'],
      [ExternalDbType.SHIKIMORI]: ['1']
    },
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          { id: 801, episodeNumber: 1, title: 'Астероидный блюз', externalIds: { [ExternalDbType.SHIKIMORI]: '1' } }
        ]
      }
    ]
  }
];


export let uploads: Upload[] = [
  {
    id: 1,
    uuid: 'f1e2d3c4-b5a6-4f7e-8c9d-0a1b2c3d4e5f',
    status: 'completed',
    type: 'file',
    source: 'Attack.on.Titan.S01E01.TVShows.720p.mkv',
    originalFilename: 'Attack.on.Titan.S01E01.TVShows.720p.mkv',
    streams: [mediaStreams[0], mediaStreams[1], mediaStreams[2]],
    linkedEpisodeId: 543,
    userId: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    uuid: 'f1e2d3c4-b5a6-4f7e-8c9d-0a1b2c3d4r5f',
    status: 'completed',
    type: 'file',
    source: 'Attack.on.Titan.S01E02.TVShows.720p.mkv',
    originalFilename: 'Attack.on.Titan.S01E02.TVShows.720p.mkv',
    streams: [mediaStreams[3], mediaStreams[4]],
    linkedEpisodeId: 544,
    userId: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    uuid: 'f1e2d3c4-b5a6-4f7e-8c9d-0a1b2c3d4r6f',
    status: 'completed',
    type: 'file',
    source: 'Attack.on.Titan.S01E02.Неизвестный.720p.mkv',
    originalFilename: 'Attack.on.Titan.S01E02.TVShows.720p.mkv',
    streams: [mediaStreams[5], mediaStreams[6]],
    linkedEpisodeId: 544,
    userId: 1,
    createdAt: new Date().toISOString()
  }
];


export let translators: Translator[] = [
  { id: 1, name: 'Неизвестный переводчик' },
  { id: 10, name: 'Original' },
  { id: 15, name: 'TVShows' },
];


export let compositions: StoredComposition[] = [
  {
    id: 1001,
    name: 'TVShows',
    episodeId: 543,
    audioStreamId: 202,
    videoStreamId: 101,
    player_config: {
      video: '/storage/aot_s1_raw.mkv',
      audio: [{ title: 'TVShows S1', src: '/storage/aot_s1_rus_tvshows.mka' }],
      subtitles: [],
    }
  }
];