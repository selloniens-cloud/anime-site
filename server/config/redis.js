// Заглушка для Redis в режиме разработки
const redis = {
  get: async (key) => {
    return null; // Всегда пустой кэш
  },
  set: async (key, value, mode, ttl) => {
    return 'OK';
  },
  del: async (key) => {
    return 1;
  },
  exists: async (key) => {
    return 0;
  }
};

module.exports = redis;