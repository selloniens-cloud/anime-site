import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const SubtitleOverlay = styled.div`
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  max-width: 80%;
  text-align: center;
  pointer-events: none;
`;

const SubtitleText = styled.div`
  background: ${props => props.background || 'rgba(0, 0, 0, 0.8)'};
  color: ${props => props.color || 'white'};
  font-size: ${props => props.fontSize || '18px'};
  font-weight: ${props => props.fontWeight || '500'};
  padding: 8px 16px;
  border-radius: 4px;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  max-width: 100%;
  word-wrap: break-word;
  font-family: ${props => props.fontFamily || 'Arial, sans-serif'};
  
  @media (max-width: 768px) {
    font-size: ${props => props.mobileFontSize || '16px'};
    padding: 6px 12px;
  }
`;

const SubtitleSettings = styled.div`
  position: absolute;
  top: 60px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 250px;
  z-index: 200;
  opacity: ${props => props.visible ? 1 : 0};
  transform: ${props => props.visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
`;

const SettingsTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 16px;
  color: white;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  label {
    font-size: 14px;
    color: #ccc;
    margin-right: 10px;
  }
`;

const SettingSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 100px;

  option {
    background: #333;
    color: white;
  }
`;

const SettingInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 60px;

  &[type="color"] {
    width: 40px;
    height: 30px;
    padding: 2px;
    cursor: pointer;
  }

  &[type="range"] {
    width: 100px;
  }
`;

const SubtitleTrackSelector = styled.div`
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

// Парсер WebVTT
class WebVTTParser {
  static parse(vttText) {
    const lines = vttText.split('\n');
    const cues = [];
    let currentCue = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Пропускаем заголовок WEBVTT
      if (line.startsWith('WEBVTT') || line === '') {
        continue;
      }

      // Проверяем временные метки
      const timeMatch = line.match(/^(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})$/);

      if (timeMatch) {
        // Создаем новую реплику
        currentCue = {
          start: this.parseTime(timeMatch[0].split(' --> ')[0]),
          end: this.parseTime(timeMatch[0].split(' --> ')[1]),
          text: '',
        };
        continue;
      }

      // Если есть текущая реплика и строка не пустая
      if (currentCue && line) {
        if (currentCue.text) {
          currentCue.text += `\n${  line}`;
        } else {
          currentCue.text = line;
        }
      }

      // Если следующая строка пустая или мы достигли конца, сохраняем реплику
      if (currentCue && (i === lines.length - 1 || lines[i + 1].trim() === '')) {
        cues.push(currentCue);
        currentCue = null;
      }
    }

    return cues;
  }

  static parseTime(timeString) {
    const parts = timeString.split(':');
    let seconds = 0;

    if (parts.length === 3) {
      // HH:MM:SS.mmm
      seconds += parseInt(parts[0]) * 3600;
      seconds += parseInt(parts[1]) * 60;
      seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
      // MM:SS.mmm
      seconds += parseInt(parts[0]) * 60;
      seconds += parseFloat(parts[1]);
    }

    return seconds;
  }
}

const SubtitleManager = ({
  currentTime,
  subtitleTracks = [],
  enabled = false,
  onSettingsToggle,
  showSettings = false,
  style,
}) => {
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [activeTrack, setActiveTrack] = useState(0);
  const [subtitleCues, setSubtitleCues] = useState([]);

  // Настройки субтитров
  const [settings, setSettings] = useState({
    fontSize: '18px',
    mobileFontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
    color: '#ffffff',
    background: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom',
    offset: 80,
  });

  // Загрузка субтитров при смене трека
  useEffect(() => {
    if (!enabled || !subtitleTracks[activeTrack]) {
      setSubtitleCues([]);
      return;
    }

    loadSubtitles(subtitleTracks[activeTrack]);
  }, [enabled, activeTrack, subtitleTracks]);

  // Обновление текущих субтитров
  useEffect(() => {
    if (!enabled || subtitleCues.length === 0) {
      setCurrentSubtitle('');
      return;
    }

    const currentCue = subtitleCues.find(
      cue => currentTime >= cue.start && currentTime <= cue.end,
    );

    setCurrentSubtitle(currentCue ? currentCue.text : '');
  }, [currentTime, subtitleCues, enabled]);

  const loadSubtitles = async (track) => {
    try {
      const response = await fetch(track.src);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const vttText = await response.text();
      const cues = WebVTTParser.parse(vttText);

      console.log(`Loaded ${cues.length} subtitle cues from ${track.label}`);
      setSubtitleCues(cues);

    } catch (error) {
      console.error('Error loading subtitles:', error);
      setSubtitleCues([]);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!enabled || !currentSubtitle) {
    return (
      <>
        {showSettings && (
          <SubtitleSettings visible={showSettings}>
            <SettingsTitle>Настройки субтитров</SettingsTitle>
            <div style={{ color: '#999', fontSize: '14px', textAlign: 'center' }}>
              Субтитры отключены
            </div>
          </SubtitleSettings>
        )}
      </>
    );
  }

  return (
    <>
      <SubtitleOverlay style={{ bottom: `${settings.offset}px`, ...style }}>
        <SubtitleText
          fontSize={settings.fontSize}
          mobileFontSize={settings.mobileFontSize}
          fontFamily={settings.fontFamily}
          fontWeight={settings.fontWeight}
          color={settings.color}
          background={settings.background}
          dangerouslySetInnerHTML={{
            __html: currentSubtitle.replace(/\n/g, '<br>'),
          }}
        />
      </SubtitleOverlay>

      {showSettings && (
        <SubtitleSettings visible={showSettings}>
          <SettingsTitle>Настройки субтитров</SettingsTitle>

          {/* Выбор дорожки субтитров */}
          {subtitleTracks.length > 0 && (
            <SubtitleTrackSelector>
              <SettingRow>
                <label htmlFor="track-selector">Дорожка:</label>
                <SettingSelect
                  id="track-selector"
                  value={activeTrack}
                  onChange={(e) => setActiveTrack(parseInt(e.target.value))}
                >
                  {subtitleTracks.map((track, index) => (
                    <option key={index} value={index}>
                      {track.label || `Дорожка ${index + 1}`}
                    </option>
                  ))}
                </SettingSelect>
              </SettingRow>
            </SubtitleTrackSelector>
          )}

          {/* Размер шрифта */}
          <SettingRow>
            <label htmlFor="font-size">Размер шрифта:</label>
            <SettingSelect
              id="font-size"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', e.target.value)}
            >
              <option value="14px">Мелкий</option>
              <option value="16px">Маленький</option>
              <option value="18px">Средний</option>
              <option value="20px">Большой</option>
              <option value="24px">Огромный</option>
            </SettingSelect>
          </SettingRow>

          {/* Семейство шрифтов */}
          <SettingRow>
            <label htmlFor="font-family">Шрифт:</label>
            <SettingSelect
              id="font-family"
              value={settings.fontFamily}
              onChange={(e) => updateSetting('fontFamily', e.target.value)}
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Helvetica Neue', sans-serif">Helvetica</option>
              <option value="'Times New Roman', serif">Times</option>
              <option value="'Courier New', monospace">Courier</option>
              <option value="'Comic Sans MS', cursive">Comic Sans</option>
            </SettingSelect>
          </SettingRow>

          {/* Толщина шрифта */}
          <SettingRow>
            <label htmlFor="font-weight">Толщина:</label>
            <SettingSelect
              id="font-weight"
              value={settings.fontWeight}
              onChange={(e) => updateSetting('fontWeight', e.target.value)}
            >
              <option value="300">Тонкий</option>
              <option value="400">Обычный</option>
              <option value="500">Средний</option>
              <option value="600">Полужирный</option>
              <option value="700">Жирный</option>
            </SettingSelect>
          </SettingRow>

          {/* Цвет текста */}
          <SettingRow>
            <label htmlFor="text-color">Цвет текста:</label>
            <SettingInput
              id="text-color"
              type="color"
              value={settings.color}
              onChange={(e) => updateSetting('color', e.target.value)}
            />
          </SettingRow>

          {/* Цвет фона */}
          <SettingRow>
            <label htmlFor="bg-opacity">Прозрачность фона:</label>
            <SettingInput
              id="bg-opacity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={parseFloat(settings.background.match(/[\d.]+\)$/)?.[0]?.slice(0, -1) || 0.8)}
              onChange={(e) => {
                const alpha = parseFloat(e.target.value);
                updateSetting('background', `rgba(0, 0, 0, ${alpha})`);
              }}
            />
          </SettingRow>

          {/* Позиция субтитров */}
          <SettingRow>
            <label htmlFor="subtitle-offset">Отступ снизу:</label>
            <SettingInput
              id="subtitle-offset"
              type="range"
              min="60"
              max="200"
              value={settings.offset}
              onChange={(e) => updateSetting('offset', parseInt(e.target.value))}
            />
          </SettingRow>
        </SubtitleSettings>
      )}
    </>
  );
};

export default SubtitleManager;
