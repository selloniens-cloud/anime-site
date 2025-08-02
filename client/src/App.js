import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { GlobalStyles } from './styles/GlobalStyles';

// Components
import Header from './components/common/Header';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AnimePage from './pages/AnimePage';
import WatchPage from './pages/WatchPage';
import ProfilePage from './pages/ProfilePage';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import VideoPlayerDemo from './pages/VideoPlayerDemo';

// Компонент для динамических стилей Toast
const ToastContainer = () => {
  const { currentTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: currentTheme.colors.surface,
          color: currentTheme.colors.text,
          border: `1px solid ${currentTheme.colors.border}`,
          borderRadius: '8px',
          boxShadow: `0 8px 32px ${currentTheme.colors.shadow}`,
        },
        success: {
          iconTheme: {
            primary: currentTheme.colors.success,
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: currentTheme.colors.error,
            secondary: 'white',
          },
        },
      }}
    />
  );
};

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <GlobalStyles />
        <AuthProvider>
          <Router>
            <div className="App">
              <Header />

              <Routes>
                {/* Публичные маршруты */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/popular" element={<CatalogPage filter="popular" />} />
                <Route path="/latest" element={<CatalogPage filter="latest" />} />
                <Route path="/anime/:id" element={<AnimePage />} />
                <Route path="/watch/:animeId/:episodeId?" element={<WatchPage />} />
                <Route path="/demo/video-player" element={<VideoPlayerDemo />} />

                {/* Защищенные маршруты */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/watchlist" element={
                  <ProtectedRoute>
                    <ProfilePage tab="watchlist" />
                  </ProtectedRoute>
                } />
                <Route path="/favorites" element={
                  <ProtectedRoute>
                    <ProfilePage tab="favorites" />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <ProfilePage tab="settings" />
                  </ProtectedRoute>
                } />

                {/* Админские маршруты */}
                <Route path="/admin/*" element={
                  <ProtectedRoute adminOnly>
                    <AdminPage />
                  </ProtectedRoute>
                } />

                {/* 404 страница */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              {/* Toast уведомления с динамической темой */}
              <ToastContainer />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
