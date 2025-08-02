import api from './api';

export const authService = {
  // Вход пользователя
  async login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка входа');
    }
  },

  // Регистрация пользователя
  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка регистрации');
    }
  },

  // Получение текущего пользователя
  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения данных пользователя');
    }
  },

  // Обновление профиля
  async updateProfile(userData) {
    try {
      const response = await api.put('/api/users/profile', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка обновления профиля');
    }
  },

  // Смена пароля
  async changePassword(passwordData) {
    try {
      const response = await api.put('/api/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка смены пароля');
    }
  },

  // Загрузка аватара
  async uploadAvatar(formData) {
    try {
      const response = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка загрузки аватара');
    }
  },

  // Восстановление пароля
  async forgotPassword(email) {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка восстановления пароля');
    }
  },

  // Сброс пароля
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка сброса пароля');
    }
  },
};
