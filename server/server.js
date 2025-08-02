const { server, connectDB } = require('./app');
const anilibriaService = require('./services/anilibriaService');
const Anime = require('./models/Anime');

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`
🚀 Server is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
🔗 URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
📚 API Base: http://localhost:${PORT}/api
🗄️  MongoDB: Connected
      `);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

async function autoImportIfEmpty() {
  const count = await Anime.countDocuments();
  if (count === 0) {
    console.log('База пуста, импортируем аниме из AniLibria...');
    await anilibriaService.importPopularAnime(50);
    console.log('Импорт завершён!');
  }
}

// Start the server
startServer();