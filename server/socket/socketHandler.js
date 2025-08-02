// Socket.io обработчик для real-time функций аниме-сайта

const socketHandler = (io, socket) => {
  console.log(`Пользователь подключился: ${socket.id}`);

  // Присоединение к комнате аниме для комментариев
  socket.on('join-anime-room', (animeId) => {
    socket.join(`anime-${animeId}`);
    console.log(`Пользователь ${socket.id} присоединился к комнате anime-${animeId}`);
  });

  // Покидание комнаты аниме
  socket.on('leave-anime-room', (animeId) => {
    socket.leave(`anime-${animeId}`);
    console.log(`Пользователь ${socket.id} покинул комнату anime-${animeId}`);
  });

  // Обработка нового комментария
  socket.on('new-comment', (data) => {
    const { animeId, comment } = data;
    
    // Отправляем комментарий всем пользователям в комнате аниме
    socket.to(`anime-${animeId}`).emit('comment-added', {
      comment,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Новый комментарий в anime-${animeId} от ${socket.id}`);
  });

  // Обработка лайка комментария
  socket.on('like-comment', (data) => {
    const { animeId, commentId, userId } = data;
    
    // Отправляем обновление лайка всем в комнате
    socket.to(`anime-${animeId}`).emit('comment-liked', {
      commentId,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Обработка статуса просмотра
  socket.on('update-watch-status', (data) => {
    const { animeId, userId, status } = data;
    
    // Уведомляем других пользователей об изменении статуса
    socket.broadcast.emit('user-watch-status-updated', {
      animeId,
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  });

  // Обработка онлайн статуса пользователя
  socket.on('user-online', (userId) => {
    socket.userId = userId;
    socket.broadcast.emit('user-status-changed', {
      userId,
      status: 'online',
      timestamp: new Date().toISOString()
    });
  });

  // Обработка отключения
  socket.on('disconnect', () => {
    console.log(`Пользователь отключился: ${socket.id}`);
    
    if (socket.userId) {
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Обработка ошибок
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
};

module.exports = socketHandler;