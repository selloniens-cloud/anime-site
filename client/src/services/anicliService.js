import api from './api';

export const anicliService = {
  async getAnimeVideo(animeId, episode) {
    const response = await api.get('/api/anime/anicli/video', {
      params: { anime_id: animeId, episode },
    });
    return response.data;
  },
};
