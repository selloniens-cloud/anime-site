import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const VoiceSelectorContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const VoiceButton = styled.button`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }

  .voice-icon {
    font-size: 14px;
  }

  .voice-name {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown-arrow {
    font-size: 10px;
    transition: transform 0.2s ease;
    transform: ${props => props.open ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 11px;
    min-width: 70px;
  }
`;

const VoiceDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  margin-top: 4px;
  z-index: 1000;
  opacity: ${props => props.open ? 1 : 0};
  transform: ${props => props.open ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
  pointer-events: ${props => props.open ? 'auto' : 'none'};
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const VoiceOption = styled.button`
  width: 100%;
  background: none;
  border: none;
  color: white;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:first-child {
    border-radius: 6px 6px 0 0;
  }

  &:last-child {
    border-radius: 0 0 6px 6px;
  }

  &:only-child {
    border-radius: 6px;
  }

  &.active {
    background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    color: white;
  }

  .voice-info {
    flex: 1;
  }

  .voice-title {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .voice-meta {
    font-size: 11px;
    opacity: 0.7;
    display: flex;
    gap: 10px;
  }

  .checkmark {
    font-size: 16px;
    color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    
    .voice-title {
      font-size: 12px;
    }
    
    .voice-meta {
      font-size: 10px;
    }
  }
`;

const VoiceHeader = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 11px;
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const NoVoicesMessage = styled.div`
  padding: 15px 12px;
  text-align: center;
  color: #888;
  font-size: 12px;
  font-style: italic;
`;

// Мок данные для демонстрации
const SAMPLE_VOICES = [
  {
    id: 'original',
    name: 'Оригинал',
    language: 'JP',
    type: 'original',
    quality: 'high',
    studio: 'Original',
    description: 'Оригинальная японская озвучка',
  },
  {
    id: 'anilibria',
    name: 'AniLibria',
    language: 'RU',
    type: 'dub',
    quality: 'high',
    studio: 'AniLibria',
    description: 'Русская озвучка от AniLibria',
  },
  {
    id: 'anidub',
    name: 'AniDub',
    language: 'RU',
    type: 'dub',
    quality: 'medium',
    studio: 'AniDub',
    description: 'Русская озвучка от AniDub',
  },
  {
    id: 'animaunt',
    name: 'Anima.unt',
    language: 'RU',
    type: 'dub',
    quality: 'medium',
    studio: 'Anima.unt',
    description: 'Русская озвучка от Anima.unt',
  },
];

const VoiceSelector = ({
  voices = [],
  activeVoice = 0,
  onVoiceChange,
  disabled = false,
  className,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);

  // Используем переданные голоса или мок данные
  useEffect(() => {
    if (voices.length > 0) {
      setAvailableVoices(voices);
    } else {
      // Для демонстрации используем sample данные
      setAvailableVoices(SAMPLE_VOICES);
    }
  }, [voices]);

  // Закрытие дропдауна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.voice-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleVoiceSelect = (voiceIndex) => {
    setIsOpen(false);
    onVoiceChange?.(voiceIndex);
  };

  const getVoiceIcon = (voice) => {
    switch (voice.type) {
    case 'original':
      return '🎌';
    case 'dub':
      return voice.language === 'RU' ? '🇷🇺' : '🎭';
    case 'sub':
      return '📝';
    default:
      return '🎵';
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
    case 'high':
      return '#28a745';
    case 'medium':
      return '#ffc107';
    case 'low':
      return '#dc3545';
    default:
      return '#6c757d';
    }
  };

  const currentVoice = availableVoices[activeVoice] || availableVoices[0];

  if (availableVoices.length === 0) {
    return null;
  }

  if (availableVoices.length === 1) {
    // Если только одна озвучка, показываем просто кнопку без дропдауна
    return (
      <VoiceSelectorContainer className={`voice-selector ${className || ''}`} style={style}>
        <VoiceButton disabled={disabled}>
          <span className="voice-icon">{getVoiceIcon(currentVoice)}</span>
          <span className="voice-name">{currentVoice.name}</span>
        </VoiceButton>
      </VoiceSelectorContainer>
    );
  }

  return (
    <VoiceSelectorContainer className={`voice-selector ${className || ''}`} style={style}>
      <VoiceButton
        onClick={handleToggle}
        disabled={disabled}
        open={isOpen}
        title={`Текущая озвучка: ${currentVoice?.name} (${currentVoice?.language})`}
      >
        <span className="voice-icon">{getVoiceIcon(currentVoice)}</span>
        <span className="voice-name">{currentVoice?.name}</span>
        <span className="dropdown-arrow">▼</span>
      </VoiceButton>

      <VoiceDropdown open={isOpen}>
        {availableVoices.length > 1 && (
          <VoiceHeader>
            Доступные озвучки
          </VoiceHeader>
        )}

        {availableVoices.length === 0 ? (
          <NoVoicesMessage>
            Озвучки не найдены
          </NoVoicesMessage>
        ) : (
          availableVoices.map((voice, index) => (
            <VoiceOption
              key={voice.id || index}
              className={index === activeVoice ? 'active' : ''}
              onClick={() => handleVoiceSelect(index)}
            >
              <span className="voice-icon">{getVoiceIcon(voice)}</span>

              <div className="voice-info">
                <div className="voice-title">{voice.name}</div>
                <div className="voice-meta">
                  <span>{voice.language}</span>
                  {voice.studio && <span>• {voice.studio}</span>}
                  {voice.quality && (
                    <span style={{ color: getQualityColor(voice.quality) }}>
                      • {voice.quality.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {index === activeVoice && (
                <span className="checkmark">✓</span>
              )}
            </VoiceOption>
          ))
        )}
      </VoiceDropdown>
    </VoiceSelectorContainer>
  );
};

export default VoiceSelector;
