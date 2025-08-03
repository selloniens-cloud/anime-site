const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');

// Подключение к базе данных
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anime-site');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Базовые достижения согласно техническому заданию
const achievements = [
  // Достижения просмотра
  {
    name: 'first_episode',
    title: '🎬 Первые шаги',
    description: 'Посмотрите свой первый эпизод',
    icon: '🎬',
    category: 'watching',
    rarity: 'common',
    criteria: {
      type: 'count',
      target: 1,
      field: 'totalEpisodes'
    },
    rewards: {
      points: 10,
      badge: 'Новичок'
    }
  },
  {
    name: 'marathon_runner',
    title: '🏃‍♂️ Марафонец',
    description: 'Посмотрите более 10 эпизодов подряд',
    icon: '🏃‍♂️',
    category: 'watching',
    rarity: 'rare',
    criteria: {
      type: 'streak',
      target: 10,
      field: 'watchingStreak'
    },
    rewards: {
      points: 50,
      badge: 'Марафонец',
      title: 'Любитель марафонов'
    }
  },
  {
    name: 'hundred_episodes',
    title: '💯 Сотник',
    description: 'Посмотрите 100 эпизодов',
    icon: '💯',
    category: 'watching',
    rarity: 'epic',
    criteria: {
      type: 'count',
      target: 100,
      field: 'totalEpisodes'
    },
    rewards: {
      points: 100,
      badge: 'Сотник'
    }
  },
  {
    name: 'anime_addict',
    title: '🔥 Аниме-зависимый',
    description: 'Проведите более 1000 минут за просмотром',
    icon: '🔥',
    category: 'watching',
    rarity: 'epic',
    criteria: {
      type: 'time',
      target: 1000,
      field: 'totalMinutes'
    },
    rewards: {
      points: 150,
      badge: 'Зависимый',
      title: 'Истинный фанат аниме'
    }
  },
  
  // Достижения критика
  {
    name: 'first_rating',
    title: '⭐ Первая оценка',
    description: 'Поставьте свою первую оценку аниме',
    icon: '⭐',
    category: 'social',
    rarity: 'common',
    criteria: {
      type: 'count',
      target: 1,
      field: 'totalRatings'
    },
    rewards: {
      points: 10,
      badge: 'Критик-новичок'
    }
  },
  {
    name: 'critic',
    title: '📝 Критик',
    description: 'Оцените более 20 аниме',
    icon: '📝',
    category: 'social',
    rarity: 'rare',
    criteria: {
      type: 'count',
      target: 20,
      field: 'totalRatings'
    },
    rewards: {
      points: 75,
      badge: 'Критик',
      title: 'Знаток аниме'
    }
  },
  {
    name: 'harsh_critic',
    title: '🎯 Придирчивый критик',
    description: 'Поддерживайте средний рейтинг ниже 6.0',
    icon: '🎯',
    category: 'social',
    rarity: 'epic',
    criteria: {
      type: 'rating',
      target: 6.0,
      field: 'averageRating'
    },
    rewards: {
      points: 100,
      badge: 'Придирчивый',
      title: 'Строгий судья'
    }
  },
  
  // Достижения исследователя
  {
    name: 'genre_explorer',
    title: '🗺️ Исследователь',
    description: 'Посмотрите аниме из 5 различных жанров',
    icon: '🗺️',
    category: 'exploration',
    rarity: 'rare',
    criteria: {
      type: 'diversity',
      target: 5,
      field: 'uniqueGenres'
    },
    rewards: {
      points: 60,
      badge: 'Исследователь',
      title: 'Любитель разнообразия'
    }
  },
  {
    name: 'genre_master',
    title: '🏆 Мастер жанров',
    description: 'Посмотрите аниме из 15 различных жанров',
    icon: '🏆',
    category: 'exploration',
    rarity: 'legendary',
    criteria: {
      type: 'diversity',
      target: 15,
      field: 'uniqueGenres'
    },
    rewards: {
      points: 200,
      badge: 'Мастер жанров',
      title: 'Универсальный зритель'
    }
  },
  
  // Временные достижения
  {
    name: 'night_owl',
    title: '🦉 Сова',
    description: 'Смотрите аниме после полуночи 7 дней подряд',
    icon: '🦉',
    category: 'time',
    rarity: 'rare',
    criteria: {
      type: 'custom',
      customCheck: `
        const WatchHistory = require('../models/WatchHistory');
        const nightWatches = await WatchHistory.find({
          userId: userId,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        });
        
        const nightSessions = nightWatches.filter(watch => {
          const hour = new Date(watch.createdAt).getHours();
          return hour >= 0 && hour <= 6;
        });
        
        const uniqueDays = new Set();
        nightSessions.forEach(session => {
          const day = new Date(session.createdAt).toDateString();
          uniqueDays.add(day);
        });
        
        return uniqueDays.size >= 7;
      `
    },
    rewards: {
      points: 80,
      badge: 'Сова',
      title: 'Ночной зритель'
    }
  },
  
  // Социальные достижения
  {
    name: 'first_friend',
    title: '🤝 Первый друг',
    description: 'Добавьте своего первого друга',
    icon: '🤝',
    category: 'social',
    rarity: 'common',
    criteria: {
      type: 'count',
      target: 1,
      field: 'totalFriends'
    },
    rewards: {
      points: 20,
      badge: 'Дружелюбный'
    }
  },
  {
    name: 'social_butterfly',
    title: '🦋 Социальная бабочка',
    description: 'Соберите 25 друзей',
    icon: '🦋',
    category: 'social',
    rarity: 'epic',
    criteria: {
      type: 'count',
      target: 25,
      field: 'totalFriends'
    },
    rewards: {
      points: 120,
      badge: 'Популярный',
      title: 'Душа компании'
    }
  },
  {
    name: 'commenter',
    title: '💬 Комментатор',
    description: 'Оставьте 50 комментариев',
    icon: '💬',
    category: 'social',
    rarity: 'rare',
    criteria: {
      type: 'count',
      target: 50,
      field: 'totalComments'
    },
    rewards: {
      points: 70,
      badge: 'Болтун'
    }
  },
  
  // Специальные достижения
  {
    name: 'early_bird',
    title: '🐦 Ранняя пташка',
    description: 'Посмотрите аниме в течение первой недели после выхода',
    icon: '🐦',
    category: 'special',
    rarity: 'legendary',
    criteria: {
      type: 'custom',
      customCheck: `
        const WatchList = require('../models/WatchList');
        const recentWatches = await WatchList.find({
          userId: userId,
          status: 'watching'
        }).populate('animeId');
        
        return recentWatches.some(watch => {
          if (!watch.animeId.airingStartDate) return false;
          const weekAfterRelease = new Date(watch.animeId.airingStartDate);
          weekAfterRelease.setDate(weekAfterRelease.getDate() + 7);
          return watch.createdAt <= weekAfterRelease;
        });
      `
    },
    rewards: {
      points: 250,
      badge: 'Первопроходец',
      title: 'Охотник за новинками'
    },
    isSecret: true
  },
  {
    name: 'perfectionist',
    title: '💎 Перфекционист',
    description: 'Досмотрите 10 аниме до конца подряд',
    icon: '💎',
    category: 'watching',
    rarity: 'mythic',
    criteria: {
      type: 'custom',
      customCheck: `
        const WatchList = require('../models/WatchList');
        const completedAnime = await WatchList.find({
          userId: userId,
          status: 'completed'
        }).sort({ updatedAt: -1 }).limit(10);
        
        return completedAnime.length >= 10;
      `
    },
    rewards: {
      points: 300,
      badge: 'Перфекционист',
      title: 'Мастер завершения'
    },
    isSecret: true
  },
  
  // Достижения лояльности
  {
    name: 'loyal_user',
    title: '🏅 Верный пользователь',
    description: 'Пользуйтесь сайтом 30 дней подряд',
    icon: '🏅',
    category: 'special',
    rarity: 'epic',
    criteria: {
      type: 'custom',
      customCheck: `
        const User = require('../models/User');
        const user = await User.findById(userId);
        const daysSinceRegistration = Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceRegistration >= 30;
      `
    },
    rewards: {
      points: 150,
      badge: 'Верный',
      title: 'Постоянный зритель'
    }
  }
];

// Функция для создания достижений
const seedAchievements = async () => {
  try {
    console.log('🚀 Начинаем заполнение достижений...');
    
    // Очищаем существующие достижения
    await Achievement.deleteMany({});
    console.log('🗑️  Старые достижения удалены');
    
    // Создаем новые достижения
    const createdAchievements = await Achievement.insertMany(achievements);
    console.log(`✅ Создано ${createdAchievements.length} достижений`);
    
    // Выводим статистику по категориям
    const stats = await Achievement.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Статистика по категориям:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} достижений`);
    });
    
    // Выводим статистику по редкости
    const rarityStats = await Achievement.aggregate([
      { $group: { _id: '$rarity', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n✨ Статистика по редкости:');
    rarityStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} достижений`);
    });
    
    console.log('\n🎉 Заполнение достижений завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при заполнении достижений:', error);
  }
};

// Запуск скрипта
const runSeed = async () => {
  await connectDB();
  await seedAchievements();
  await mongoose.disconnect();
  console.log('👋 Подключение к базе данных закрыто');
  process.exit(0);
};

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  runSeed().catch(console.error);
}

module.exports = { seedAchievements };