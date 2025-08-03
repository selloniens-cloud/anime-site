const mongoose = require('mongoose');
const Anime = require('../models/Anime');
require('dotenv').config();

const testAnimeData = [
  {
    title: {
      english: 'Big Buck Bunny',
      japanese: 'ビッグ・バック・バニー',
      romaji: 'Big Buck Bunny',
      synonyms: ['BBB', 'Test Anime 1']
    },
    synopsis: 'Тестовое аниме для проверки видеоплеера. Big Buck Bunny - это короткометражный фильм с открытым исходным кодом.',
    type: 'Movie',
    status: 'Finished Airing',
    episodes: 1,
    duration: 10,
    year: 2008,
    season: 'Spring',
    genres: ['Adventure', 'Comedy', 'Fantasy'],
    themes: ['Animals', 'Nature'],
    demographics: ['Kids'],
    rating: {
      score: 7.5,
      scoredBy: 100
    },
    popularity: 1000,
    rank: 1,
    ageRating: 'G',
    images: {
      poster: {
        small: 'https://picsum.photos/300/400?random=1',
        medium: 'https://picsum.photos/600/800?random=1',
        large: 'https://picsum.photos/900/1200?random=1'
      },
      banner: 'https://picsum.photos/1920/540?random=1'
    },
    videos: [
      {
        episode: 1,
        title: 'Big Buck Bunny Movie',
        sources: [
          {
            quality: '1080p',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            player: 'html5'
          },
          {
            quality: '720p',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            player: 'videojs'
          }
        ],
        subtitles: [
          {
            language: 'ru',
            url: '/subtitles/big_buck_bunny_ru.vtt',
            format: 'vtt'
          }
        ],
        thumbnail: 'https://picsum.photos/320/180?random=11',
        duration: 596
      }
    ],
    studios: [
      {
        name: 'Blender Foundation',
        malId: 1
      }
    ],
    source: 'manual',
    approved: true,
    isActive: true
  },
  
  {
    title: {
      english: 'Elephant Dreams',
      japanese: 'エレファント・ドリームス',
      romaji: 'Elephant Dreams',
      synonyms: ['ED', 'Test Anime 2']
    },
    synopsis: 'Второе тестовое аниме для проверки видеоплеера. Elephant Dreams - еще один короткометражный фильм с открытым исходным кодом.',
    type: 'Movie',
    status: 'Finished Airing',
    episodes: 1,
    duration: 11,
    year: 2006,
    season: 'Winter',
    genres: ['Drama', 'Sci-Fi', 'Psychological'],
    themes: ['Dreams', 'Surreal'],
    demographics: ['Seinen'],
    rating: {
      score: 6.8,
      scoredBy: 75
    },
    popularity: 800,
    rank: 2,
    ageRating: 'PG',
    images: {
      poster: {
        small: 'https://picsum.photos/300/400?random=2',
        medium: 'https://picsum.photos/600/800?random=2',
        large: 'https://picsum.photos/900/1200?random=2'
      },
      banner: 'https://picsum.photos/1920/540?random=2'
    },
    videos: [
      {
        episode: 1,
        title: 'Elephant Dreams Movie',
        sources: [
          {
            quality: '1080p',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            player: 'html5'
          },
          {
            quality: '720p',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            player: 'plyr'
          }
        ],
        subtitles: [
          {
            language: 'ru',
            url: '/subtitles/elephant_dreams_ru.vtt',
            format: 'vtt'
          }
        ],
        thumbnail: 'https://picsum.photos/320/180?random=12',
        duration: 653
      }
    ],
    studios: [
      {
        name: 'Orange Open Movie Project',
        malId: 2
      }
    ],
    source: 'manual',
    approved: true,
    isActive: true
  },

  {
    title: {
      english: 'Sample Anime Series',
      japanese: 'サンプル・アニメ・シリーズ',
      romaji: 'Sample Anime Series',
      synonyms: ['SAS', 'Test Series']
    },
    synopsis: 'Тестовый сериал для проверки функционала эпизодов и навигации между ними. Содержит несколько эпизодов с разными видеопотоками.',
    type: 'TV',
    status: 'Finished Airing',
    episodes: 3,
    duration: 24,
    year: 2023,
    season: 'Summer',
    genres: ['Action', 'Adventure', 'Comedy'],
    themes: ['School', 'Friendship'],
    demographics: ['Shounen'],
    rating: {
      score: 8.2,
      scoredBy: 150
    },
    popularity: 1500,
    rank: 3,
    ageRating: 'PG-13',
    images: {
      poster: {
        small: 'https://picsum.photos/300/400?random=3',
        medium: 'https://picsum.photos/600/800?random=3',
        large: 'https://picsum.photos/900/1200?random=3'
      },
      banner: 'https://picsum.photos/1920/540?random=3'
    },
    videos: [
      {
        episode: 1,
        title: 'First Episode',
        sources: [
          {
            quality: '1080p',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            player: 'html5'
          }
        ],
        thumbnail: 'https://picsum.photos/320/180?random=13',
        duration: 900
      },
      {
        episode: 2,
        title: 'Second Episode',
        sources: [
          {
            quality: '1080p',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            player: 'videojs'
          }
        ],
        thumbnail: 'https://picsum.photos/320/180?random=14',
        duration: 920
      },
      {
        episode: 3,
        title: 'Final Episode',
        sources: [
          {
            quality: '1080p',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
            player: 'plyr'
          }
        ],
        thumbnail: 'https://picsum.photos/320/180?random=15',
        duration: 950
      }
    ],
    studios: [
      {
        name: 'Test Studio',
        malId: 3
      }
    ],
    source: 'manual',
    approved: true,
    isActive: true
  }
];

async function createTestAnime() {
  try {
    // Подключение к базе данных
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anime-site');
    console.log('Connected to MongoDB');

    // Удаляем существующие тестовые данные
    await Anime.deleteMany({ source: 'manual' });
    console.log('Removed existing test anime');

    // Создаем новые тестовые данные
    const result = await Anime.insertMany(testAnimeData);
    console.log(`Created ${result.length} test anime:`, result.map(anime => anime.title.english));

    // Закрываем подключение
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating test anime:', error);
    process.exit(1);
  }
}

// Запускаем скрипт если файл выполняется напрямую
if (require.main === module) {
  createTestAnime();
}

module.exports = { createTestAnime, testAnimeData };