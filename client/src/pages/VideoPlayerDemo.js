import React, { useState } from 'react';
import styled from 'styled-components';
import { VideoPlayer } from '../components/video';

const DemoContainer = styled.div`
  min-height: 100vh;
  padding: 80px 20px 40px;
  background: ${props => props.theme.colors.background};
`;

const DemoTitle = styled.h1`
  color: ${props => props.theme.colors.text};
  text-align: center;
  margin-bottom: 40px;
  font-size: 2.5rem;
`;

const PlayerContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto 40px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16/9;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const ControlsPanel = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const ControlGroup = styled.div`
  margin-bottom: 20px;

  h3 {
    color: ${props => props.theme.colors.text};
    margin-bottom: 10px;
    font-size: 1.2rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const DemoButton = styled.button`
  background: ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  color: ${props => props.active ? 'white' : props.theme.colors.text};
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
  }
`;

const InfoPanel = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;

  h4 {
    color: ${props => props.theme.colors.text};
    margin-bottom: 10px;
  }

  p {
    color: ${props => props.theme.colors.textSecondary};
    margin: 5px 0;
    font-size: 0.9rem;
  }
`;

const VideoPlayerDemo = () => {
  const [currentPlayer, setCurrentPlayer] = useState('videojs');
  const [currentVideo, setCurrentVideo] = useState('bigbuckbunny');
  const [playerInfo, setPlayerInfo] = useState({
    currentTime: 0,
    duration: 0,
    buffered: 0,
    quality: 'auto',
  });

  const videoSources = {
    bigbuckbunny: {
      title: 'Big Buck Bunny (MP4)',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      type: 'video/mp4',
    },
    elephantsdream: {
      title: 'Elephants Dream (MP4)',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
      type: 'video/mp4',
    },
    hls_demo: {
      title: 'HLS Demo Stream',
      src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
      type: 'application/vnd.apple.mpegurl',
    },
  };

  const handleTimeUpdate = (currentTime) => {
    setPlayerInfo(prev => ({ ...prev, currentTime }));
  };

  const handleProgress = (buffered) => {
    setPlayerInfo(prev => ({ ...prev, buffered }));
  };

  const handleLoadedMetadata = (duration) => {
    setPlayerInfo(prev => ({ ...prev, duration }));
  };

  const handleQualityChange = (quality) => {
    setPlayerInfo(prev => ({ ...prev, quality }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentVideoData = videoSources[currentVideo];

  return (
    <DemoContainer>
      <DemoTitle>🎬 Демонстрация VideoPlayer</DemoTitle>

      <PlayerContainer>
        <VideoPlayer
          src={currentVideoData.src}
          poster={currentVideoData.poster}
          title={currentVideoData.title}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgress}
          onLoadedMetadata={handleLoadedMetadata}
          onQualityChange={handleQualityChange}
          preferredPlayer={currentPlayer}
          enablePlayerSelector={true}
          autoPlay={false}
          muted={false}
          qualities={[
            { height: 1080, src: currentVideoData.src },
            { height: 720, src: currentVideoData.src },
            { height: 480, src: currentVideoData.src },
          ]}
          subtitles={[
            { lang: 'ru', label: 'Русские субтитры', src: '/subtitles/ru.vtt', default: true },
            { lang: 'en', label: 'English subtitles', src: '/subtitles/en.vtt' },
          ]}
        />
      </PlayerContainer>

      <ControlsPanel>
        <ControlGroup>
          <h3>Выбор плеера</h3>
          <ButtonGroup>
            <DemoButton
              active={currentPlayer === 'html5'}
              onClick={() => setCurrentPlayer('html5')}
            >
              HTML5 Player
            </DemoButton>
            <DemoButton
              active={currentPlayer === 'videojs'}
              onClick={() => setCurrentPlayer('videojs')}
            >
              Video.js Player
            </DemoButton>
            <DemoButton
              active={currentPlayer === 'plyr'}
              onClick={() => setCurrentPlayer('plyr')}
            >
              Plyr Player
            </DemoButton>
            <DemoButton
              active={currentPlayer === 'hls'}
              onClick={() => setCurrentPlayer('hls')}
            >
              HLS.js Player
            </DemoButton>
            <DemoButton
              active={currentPlayer === 'dash'}
              onClick={() => setCurrentPlayer('dash')}
            >
              Dash.js Player
            </DemoButton>
          </ButtonGroup>
        </ControlGroup>

        <ControlGroup>
          <h3>Выбор видео</h3>
          <ButtonGroup>
            <DemoButton
              active={currentVideo === 'bigbuckbunny'}
              onClick={() => setCurrentVideo('bigbuckbunny')}
            >
              Big Buck Bunny
            </DemoButton>
            <DemoButton
              active={currentVideo === 'elephantsdream'}
              onClick={() => setCurrentVideo('elephantsdream')}
            >
              Elephants Dream
            </DemoButton>
            <DemoButton
              active={currentVideo === 'hls_demo'}
              onClick={() => setCurrentVideo('hls_demo')}
            >
              HLS Demo
            </DemoButton>
          </ButtonGroup>
        </ControlGroup>

        <InfoPanel>
          <h4>Информация о воспроизведении</h4>
          <p><strong>Текущий плеер:</strong> {currentPlayer.toUpperCase()}</p>
          <p><strong>Видео:</strong> {currentVideoData.title}</p>
          <p><strong>Время:</strong> {formatTime(playerInfo.currentTime)} / {formatTime(playerInfo.duration)}</p>
          <p><strong>Буферизация:</strong> {Math.round(playerInfo.buffered)}%</p>
          <p><strong>Качество:</strong> {playerInfo.quality}</p>
        </InfoPanel>
      </ControlsPanel>
    </DemoContainer>
  );
};

export default VideoPlayerDemo;
