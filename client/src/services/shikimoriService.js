import api from './api';

export const shikimoriService = {
  async getAnimeById(id) {
    const response = await api.get(`/api/anime/shikimori/${id}`);
    return response.data;
  },
  async searchAnime(query) {
    const response = await api.get('/api/anime/shikimori', { params: { search: query } });
    return response.data;
  }
};
