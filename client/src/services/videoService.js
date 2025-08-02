import api from './api';

export const videoService = {
  // Основной метод для получения видео потока согласно спецификации
  async getVideoStream(animeId, episode) {
    try {
      const response = await api.get('/api/anime/video', {
        params: {
          anime_id: animeId,
          episode: episode
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения видео');
    }
  },

  // Расширенный метод для получения видео потока с качеством (сохраняем существующую функциональность)
  async getVideoStreamWithQuality(animeId, episode, quality = 'auto') {
    try {
      const response = await api.get('/api/anime/video', {
        params: {
          anime_id: animeId,
          episode,
          quality
        },
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения видео');
    }
  },
  
  async getAvailableQualities(animeId, episode) {
    try {
      const response = await api.get('/api/anime/qualities', {
        params: { 
          anime_id: animeId, 
          episode 
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения качеств видео');
    }
  },

  // Новый метод для получения статуса видео
  async checkVideoAvailability(animeId, episode) {
    try {
      const response = await api.get('/api/anime/video/check', {
        params: { 
          anime_id: animeId, 
          episode 
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка проверки доступности видео');
    }
  }
};
