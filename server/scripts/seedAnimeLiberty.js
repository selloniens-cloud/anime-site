const mongoose = require('mongoose');
const AnimeLiberty = require('../models/AnimeLiberty');
require('dotenv').config();

// Тестовые данные для демонстрации
const testAnimeData = [
  {
    anilibertyId: 1,
    title: {
      english: "Attack on Titan",
      japanese: "進撃の巨人",
      romaji: "Shingeki no Kyojin",
      synonyms: ["AoT", "SnK"]
    },
    synopsis: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called titans, forcing humans to hide in fear behind enormous concentric walls.",
    type: "TV",
    status: "Finished Airing",
    episodes: 25,
    year: 2013,
    season: "Spring",
    genres: ["Action", "Drama", "Fantasy", "Military", "Shounen"],
    rating: {
      average: 9.0,
      count: 2500000
    },
    images: {
      poster: {
        small: "https://example.com/aot-small.jpg",
        medium: "https://example.com/aot-medium.jpg",
        large: "https://example.com/aot-large.jpg"
      }
    },
    videos: [
      {
        episode: 1,
        title: "To You, in 2000 Years",
        sources: [
          {
            quality: "1080p",
            url: "https://example.com/aot-ep1-1080p.m3u8",
            format: "hls"
          },
          {
            quality: "720p",
            url: "https://example.com/aot-ep1-720p.m3u8",
            format: "hls"
          }
        ],
        subtitles: [
          {
            lang: "ru",
            url: "https://example.com/aot-ep1-ru.vtt"
          },
          {
            lang: "en",
            url: "https://example.com/aot-ep1-en.vtt"
          }
        ],
        thumbnail: "https://example.com/aot-ep1-thumb.jpg",
        updated_at: new Date()
      }
    ],
    updated_at: new Date(),
    lastSynced: new Date()
  },
  {
    anilibertyId: 2,
    title: {
      english: "One Piece",
      japanese: "ワンピース",
      romaji: "One Piece",
      synonyms: ["OP"]
    },
    synopsis: "Gol D. Roger was known as the 'Pirate King,' the strongest and most infamous being to have sailed the Grand Line.",
    type: "TV",
    status: "Currently Airing",
    episodes: 1000,
    year: 1999,
    season: "Fall",
    genres: ["Action", "Adventure", "Comedy", "Drama", "Shounen"],
    rating: {
      average: 8.9,
      count: 1800000
    },
    images: {
      poster: {
        small: "https://example.com/op-small.jpg",
        medium: "https://example.com/op-medium.jpg",
        large: "https://example.com/op-large.jpg"
      }
    },
    videos: [
      {
        episode: 1,
        title: "I'm Luffy! The Man Who's Gonna Be King of the Pirates!",
        sources: [
          {
            quality: "1080p",
            url: "https://example.com/op-ep1-1080p.m3u8",
            format: "hls"
          }
        ],
        subtitles: [
          {
            lang: "ru",
            url: "https://example.com/op-ep1-ru.vtt"
          }
        ],
        thumbnail: "https://example.com/op-ep1-thumb.jpg",
        updated_at: new Date()
      }
    ],
    updated_at: new Date(),
    lastSynced: new Date()
  },
  {
    anilibertyId: 3,
    title: {
      english: "Death Note",
      japanese: "デスノート",
      romaji: "Death Note",
      synonyms: ["DN"]
    },
    synopsis: "A shinigami, as a god of death, can kill any person—provided they see their victim's face and write their victim's name in a notebook called a Death Note.",
    type: "TV",
    status: "Finished Airing",
    episodes: 37,
    year: 2006,
    season: "Fall",
    genres: ["Supernatural", "Thriller", "Psychological"],
    rating: {
      average: 9.0,
      count: 2200000
    },
    images: {
      poster: {
        small: "https://example.com/dn-small.jpg",
        medium: "https://example.com/dn-medium.jpg",
        large: "https://example.com/dn-large.jpg"
      }
    },
    videos: [
      {
        episode: 1,
        title: "Rebirth",
        sources: [
          {
            quality: "1080p",
            url: "https://example.com/dn-ep1-1080p.m3u8",
            format: "hls"
          }
        ],
        subtitles: [
          {
            lang: "ru",
            url: "https://example.com/dn-ep1-ru.vtt"
          }
        ],
        thumbnail: "https://example.com/dn-ep1-thumb.jpg",
        updated_at: new Date()
      }
    ],
    updated_at: new Date(),
    lastSynced: new Date()
  }
];

const seedDatabase = async () => {
  try {
    // Подключение к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anime-site');
    console.log('Connected to MongoDB');

    // Очистка коллекции
    await AnimeLiberty.deleteMany({});
    console.log('Cleared existing AnimeLiberty data');

    // Добавление тестовых данных
    for (const animeData of testAnimeData) {
      const anime = new AnimeLiberty(animeData);
      await anime.save();
      console.log(`Added: ${anime.title.english}`);
    }

    console.log('✅ Database seeded successfully!');
    console.log(`Added ${testAnimeData.length} anime entries`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Запуск только если файл выполняется напрямую
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, testAnimeData };