import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import anilibriaV2Service from '../services/anilibriaV2Service';
import { VideoPlayer } from '../components/video';

const TestContainer = styled.div`
  min-height: 100vh;
  padding: 80px 20px 40px;
  background: ${props => props.theme.colors.background || '#1a1a1a'};
  color: ${props => props.theme.colors.text || '#ffffff'};
`;

const TestTitle = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
`;

const TestSection = styled.div`
  max-width: 1200px;
  margin: 0 auto 40px;
  padding: 20px;
  background: ${props => props.theme.colors.surface || '#2a2a2a'};
  border-radius: 12px;
  
  h3 {
    margin-bottom: 15px;
    color: ${props => props.theme.colors.primary || '#FF6B6B'};
  }
`;

const Button = styled.button`
  background: ${props => props.theme.colors.primary || '#FF6B6B'};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin: 0 10px 10px 0;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const DataDisplay = styled.pre`
  background: #000;
  color: #0f0;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
`;

const ErrorDisplay = styled.div`
  background: #ff4444;
  color: white;
  padding: 15px;
  border-radius: 8px;
  margin: 10px 0;
`;

const VideoContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
`;

const AnilibriaV2Test = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [currentTest, setCurrentTest] = useState('');
  const [videoData, setVideoData] = useState(null);

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    setError(null);
    setCurrentTest(testName);
    setData(null);

    try {
      console.log(`🧪 Запуск теста: ${testName}`);
      const result = await testFunction();
      setData(result);
      console.log(`✅ Тест '${testName}' успешен:`, result);
    } catch (err) {
      setError(err.message);
      console.error(`❌ Тест '${testName}' неудачен:`, err);
    } finally {
      setLoading(false);
    }
  };

  const tests = {
    'Получить последние релизы': () => anilibriaV2Service.getLatestReleases(5),

    'Получить конкретный релиз': () => anilibriaV2Service.getRelease(9990),

    'Получить релиз с эпизодами': () => anilibriaV2Service.getReleaseWithEpisodes(9990),

    'Поиск релизов': () => anilibriaV2Service.searchReleases('меча', 1, 5),

    'Рекомендуемые релизы': () => anilibriaV2Service.getRecommendedReleases(5),

    'Случайные релизы': () => anilibriaV2Service.getRandomReleases(3),

    'Тест совместимости - getAnimeById': () => anilibriaV2Service.getAnimeById(9990),

    'Тест совместимости - getEpisodeById': () => anilibriaV2Service.getEpisodeById(9990, 1),

    'Тест видео - getAnimeVideo': async () => {
      const result = await anilibriaV2Service.getAnimeVideo(9990, 1);
      setVideoData(result);
      return result;
    },
  };

  const testVideoPlayer = () => {
    if (!videoData || !videoData.url) {
      setError('Сначала запустите тест "Тест видео - getAnimeVideo"');
      return;
    }

    setCurrentTest('Тестирование VideoPlayer');
  };

  useEffect(() => {
    // Автоматически запускаем первый тест при загрузке
    runTest('Получить последние релизы', tests['Получить последние релизы']);
  }, []);

  return (
    <TestContainer>
      <TestTitle>🧪 Тестирование AniLiberty API v2</TestTitle>

      <TestSection>
        <h3>📡 API Тесты</h3>
        <div>
          {Object.entries(tests).map(([testName, testFunc]) => (
            <Button
              key={testName}
              onClick={() => runTest(testName, testFunc)}
              disabled={loading}
            >
              {testName}
            </Button>
          ))}
          <Button
            onClick={testVideoPlayer}
            disabled={!videoData?.url}
          >
            🎬 Тест VideoPlayer
          </Button>
        </div>
      </TestSection>

      {loading && (
        <TestSection>
          <h3>⏳ Выполняется: {currentTest}</h3>
          <p>Загрузка...</p>
        </TestSection>
      )}

      {error && (
        <TestSection>
          <h3>❌ Ошибка в тесте: {currentTest}</h3>
          <ErrorDisplay>{error}</ErrorDisplay>
        </TestSection>
      )}

      {data && (
        <TestSection>
          <h3>✅ Результат теста: {currentTest}</h3>
          <DataDisplay>{JSON.stringify(data, null, 2)}</DataDisplay>
        </TestSection>
      )}

      {videoData && videoData.url && currentTest === 'Тестирование VideoPlayer' && (
        <TestSection>
          <h3>🎬 Тестирование VideoPlayer с AniLiberty</h3>
          <VideoContainer>
            <VideoPlayer
              src={videoData.url}
              title={videoData.episode?.title || 'Тестовое видео'}
              poster={videoData.episode?.preview}
              qualities={videoData.qualities || []}
              autoPlay={false}
              muted={true}
              preferredPlayer="hls"
              enablePlayerSelector={true}
              onTimeUpdate={(time) => console.log('Time update:', time)}
              onError={(error) => console.error('Player error:', error)}
              onQualityChange={(quality) => console.log('Quality changed:', quality)}
            />
          </VideoContainer>
          <p><strong>URL:</strong> {videoData.url}</p>
          <p><strong>Тип:</strong> {videoData.type}</p>
          <p><strong>Качества:</strong> {videoData.qualities?.length || 0}</p>
        </TestSection>
      )}

      <TestSection>
        <h3>📋 Информация о тестах</h3>
        <ul>
          <li><strong>Получить последние релизы</strong> - проверяет базовую работу API</li>
          <li><strong>Получить конкретный релиз</strong> - тестирует получение конкретного аниме</li>
          <li><strong>Получить релиз с эпизодами</strong> - включает список эпизодов</li>
          <li><strong>Поиск релизов</strong> - тестирует поисковую функцию</li>
          <li><strong>Рекомендуемые релизы</strong> - получает рекомендации</li>
          <li><strong>Случайные релизы</strong> - получает случайные аниме</li>
          <li><strong>Тест совместимости</strong> - проверяет работу с существующим кодом</li>
          <li><strong>Тест видео</strong> - получает видео URL и настройки</li>
          <li><strong>Тест VideoPlayer</strong> - проверяет работу плеера с HLS</li>
        </ul>
      </TestSection>

      <TestSection>
        <h3>🔧 Информация о системе</h3>
        <p><strong>API Endpoint:</strong> https://aniliberty.top/api/v1</p>
        <p><strong>Браузер поддерживает HLS:</strong> {window.MediaSource ? '✅ Да' : '❌ Нет'}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
      </TestSection>
    </TestContainer>
  );
};

export default AnilibriaV2Test;
