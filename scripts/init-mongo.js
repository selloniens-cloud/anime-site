// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

// Switch to anime-site database
db = db.getSiblingDB('anime-site');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 20,
          description: 'Username must be a string between 3-20 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 60,
          maxLength: 60,
          description: 'Password must be a bcrypt hash'
        }
      }
    }
  }
});

db.createCollection('anime', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'malId'],
      properties: {
        malId: {
          bsonType: 'number',
          description: 'MyAnimeList ID must be a number'
        },
        title: {
          bsonType: 'object',
          required: ['english'],
          properties: {
            english: { bsonType: 'string' },
            japanese: { bsonType: 'string' },
            romaji: { bsonType: 'string' }
          }
        }
      }
    }
  }
});

db.createCollection('comments');
db.createCollection('watchlists');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.anime.createIndex({ malId: 1 }, { unique: true });
db.anime.createIndex({ 'title.english': 'text', 'title.japanese': 'text', 'title.romaji': 'text' });
db.anime.createIndex({ genres: 1 });
db.anime.createIndex({ year: 1 });
db.anime.createIndex({ rating: -1 });

db.comments.createIndex({ animeId: 1 });
db.comments.createIndex({ userId: 1 });
db.comments.createIndex({ createdAt: -1 });

db.watchlists.createIndex({ userId: 1 });
db.watchlists.createIndex({ animeId: 1 });
db.watchlists.createIndex({ userId: 1, animeId: 1 }, { unique: true });

// Insert sample data for development
db.users.insertOne({
  username: 'admin',
  email: 'admin@anime-site.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  role: 'admin',
  avatar: 'https://via.placeholder.com/150',
  preferences: {
    theme: 'dark',
    language: 'ru'
  },
  watchLists: {
    watching: [],
    completed: [],
    planToWatch: [],
    dropped: [],
    onHold: []
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sample anime data
db.anime.insertMany([
  {
    malId: 16498,
    title: {
      english: 'Attack on Titan',
      japanese: '進撃の巨人',
      romaji: 'Shingeki no Kyojin'
    },
    synopsis: 'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called titans...',
    genres: ['Action', 'Drama', 'Fantasy', 'Military'],
    year: 2013,
    season: 'Spring',
    episodes: 25,
    status: 'Completed',
    rating: 9.0,
    images: {
      poster: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
      banner: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg',
      screenshots: []
    },
    videos: [],
    cached: true,
    lastUpdated: new Date()
  },
  {
    malId: 11061,
    title: {
      english: 'Hunter x Hunter (2011)',
      japanese: 'ハンター×ハンター (2011)',
      romaji: 'Hunter x Hunter (2011)'
    },
    synopsis: 'Hunter x Hunter is set in a world where Hunters exist to perform all manner of dangerous tasks...',
    genres: ['Action', 'Adventure', 'Fantasy'],
    year: 2011,
    season: 'Fall',
    episodes: 148,
    status: 'Completed',
    rating: 9.1,
    images: {
      poster: 'https://cdn.myanimelist.net/images/anime/11/33657.jpg',
      banner: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg',
      screenshots: []
    },
    videos: [],
    cached: true,
    lastUpdated: new Date()
  }
]);

print('MongoDB initialization completed successfully!');