// Скрипт для заполнения базы данных тестовыми данными аниме
const mongoose = require('mongoose');
require('dotenv').config();

// Подключение к базе данных
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anime-site';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Схемы данных
const animeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  titleEn: String,
  description: String,
  poster: String,
  year: Number,
  status: String,
  type: String,
  episodes: Number,
  rating: Number,
  genres: [String],
  videoUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Anime = mongoose.model('Anime', animeSchema);

// Тестовые данные аниме
const testAnimeData = [
  {
    id: 1,
    title: "Атака титанов",
    titleEn: "Attack on Titan",
    description: "Человечество находится на грани вымирания из-за гуманоидных титанов. Последние люди живут в городе, окруженном огромными стенами. Эрен Йегер клянется отомстить титанам после того, как они разрушили его родной город и убили его мать.",
    poster: "https://animevost.org/uploads/posts/2013-04/1366796334_2.jpg",
    year: 2013,
    status: "Завершено",
    type: "TV",
    episodes: 25,
    rating: 9.0,
    genres: ["Экшен", "Драма", "Фэнтези"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  },
  {
    id: 2,
    title: "Моя геройская академия",
    titleEn: "My Hero Academia",
    description: "В мире, где 80% людей обладают суперспособностями, называемыми 'причудами', Мидория Изуку мечтает стать героем, несмотря на то, что родился без способностей.",
    poster: "https://animevost.org/uploads/posts/2016-04/1460134298_1.jpg",
    year: 2016,
    status: "Продолжается",
    type: "TV",
    episodes: 138,
    rating: 8.5,
    genres: ["Экшен", "Школьный", "Супергерои"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  },
  {
    id: 3,
    title: "Ван Пис",
    titleEn: "One Piece",
    description: "Монки Д. Луффи отправляется в путешествие, чтобы найти легендарный сокровище 'Ван Пис' и стать следующим Королём Пиратов.",
    poster: "https://animevost.org/uploads/posts/1999-10/1507366699_1.jpg",
    year: 1999,
    status: "Продолжается",
    type: "TV",
    episodes: 1000,
    rating: 9.2,
    genres: ["Приключения", "Комедия", "Драма", "Экшен"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  },
  {
    id: 4,
    title: "Наруто",
    titleEn: "Naruto",
    description: "История об Узумаки Наруто, молодом ниндзя, который мечтает стать Хокаге - лидером своей деревни.",
    poster: "https://animevost.org/uploads/posts/2002-10/1505828698_1.jpg",
    year: 2002,
    status: "Завершено",
    type: "TV",
    episodes: 220,
    rating: 8.3,
    genres: ["Экшен", "Боевые искусства", "Комедия"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
  },
  {
    id: 5,
    title: "Клинок, рассекающий демонов",
    titleEn: "Demon Slayer",
    description: "Танджиро Камадо становится истребителем демонов, чтобы спасти свою сестру и отомстить за свою семью.",
    poster: "https://animevost.org/uploads/posts/2019-04/1554291848_1.jpg",
    year: 2019,
    status: "Продолжается",
    type: "TV",
    episodes: 44,
    rating: 8.8,
    genres: ["Экшен", "Сверхъестественное", "Исторический"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
  },
  {
    id: 6,
    title: "Покемон",
    titleEn: "Pokemon",
    description: "Приключения Сатоши (Эша) и его покемона Пикачу в мире покемонов.",
    poster: "https://animevost.org/uploads/posts/1997-04/1505908652_1.jpg",
    year: 1997,
    status: "Продолжается",
    type: "TV",
    episodes: 1200,
    rating: 7.5,
    genres: ["Приключения", "Семейный", "Фэнтези"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
  },
  {
    id: 7,
    title: "Твое имя",
    titleEn: "Your Name",
    description: "Романтическая история о двух подростках, которые могут обмениваться телами во сне.",
    poster: "https://animevost.org/uploads/posts/2016-08/1472018344_1.jpg",
    year: 2016,
    status: "Завершено",
    type: "Фильм",
    episodes: 1,
    rating: 9.1,
    genres: ["Романтика", "Драма", "Мистика"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
  },
  {
    id: 8,
    title: "Кибер-город Эдо 2808",
    titleEn: "Cyber City Oedo 2808",
    description: "В будущем криминалисты борются с преступностью в кибер-городе.",
    poster: "https://animevost.org/uploads/posts/1990-06/1505835284_1.jpg",
    year: 1990,
    status: "Завершено",
    type: "OVA",
    episodes: 3,
    rating: 7.8,
    genres: ["Экшен", "Научная фантастика", "Полиция"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
  }
];

// Функция заполнения данных
const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Очистка существующих данных (опционально)
    await Anime.deleteMany({});
    console.log('Старые данные очищены');
    
    // Вставка новых данных
    await Anime.insertMany(testAnimeData);
    console.log(`Добавлено ${testAnimeData.length} аниме в базу данных`);
    
    // Проверка данных
    const count = await Anime.countDocuments();
    console.log(`Всего аниме в базе: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка заполнения базы данных:', error);
    process.exit(1);
  }
};

// Запуск скрипта
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, testAnimeData };