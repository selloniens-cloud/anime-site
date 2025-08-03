const JIKAN_API = 'https://api.jikan.moe/v4';

class JikanService {
  async getPopularAnime(limit = 50) {
    try {
      const response = await fetch(`${JIKAN_API}/top/anime?limit=${limit}`);
      const data = await response.json();
      return {
        success: true,
        data: data.data.map(this.formatAnimeData),
      };
    } catch (error) {
      console.error('Jikan API error:', error);
      return { success: false, error };
    }
  }

  formatAnimeData(anime) {
    return {
      _id: `jikan_${anime.mal_id}`,
      title: {
        en: anime.title_english || anime.title,
        ru: anime.title,
        romaji: anime.title,
      },
      description: anime.synopsis,
      images: {
        poster: {
          medium: anime.images.jpg.large_image_url,
          small: anime.images.jpg.small_image_url,
        },
      },
      status: anime.status,
      episodes: anime.episodes,
      year: anime.year,
      genres: anime.genres.map(g => g.name),
      rating: anime.score,
      type: anime.type,
    };
  }

  async searchAnime(query, limit = 50) {
    try {
      const response = await fetch(`${JIKAN_API}/anime?q=${query}&limit=${limit}`);
      const data = await response.json();
      return {
        success: true,
        data: data.data.map(this.formatAnimeData),
      };
    } catch (error) {
      console.error('Jikan search error:', error);
      return { success: false, error };
    }
  }
}

export default new JikanService();
