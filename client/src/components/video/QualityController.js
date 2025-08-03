import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const QualityContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const QualityButton = styled.button`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    box-shadow: 0 0 0 2px ${props => props.theme?.colors?.primary || '#FF6B6B'}33;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .quality-label {
    flex: 1;
    text-align: left;
  }

  .quality-badge {
    font-size: 10px;
    background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    line-height: 1;
  }

  .dropdown-arrow {
    font-size: 10px;
    transition: transform 0.2s ease;
    transform: ${props => props.open ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 11px;
    min-width: 60px;
  }
`;

const QualityDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  margin-top: 6px;
  z-index: 1000;
  opacity: ${props => props.open ? 1 : 0};
  transform: ${props => props.open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'};
  transition: all 0.2s ease;
  pointer-events: ${props => props.open ? 'auto' : 'none'};
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  min-width: 200px;
`;

const QualityHeader = styled.div`
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 11px;
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .auto-label {
    color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    font-size: 10px;
  }
`;

const QualityOption = styled.button`
  width: 100%;
  background: none;
  border: none;
  color: white;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }

  &:first-of-type {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }

  &:only-child {
    border-radius: 8px;
  }

  &.active {
    background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    color: white;
    
    &:hover {
      background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    }
  }

  .quality-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .quality-name {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .quality-details {
    font-size: 11px;
    opacity: 0.8;
    display: flex;
    gap: 8px;
  }

  .quality-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }

  .signal-bars {
    display: flex;
    gap: 1px;
    align-items: end;
  }

  .bar {
    width: 3px;
    background: currentColor;
    opacity: 0.3;
    
    &.active {
      opacity: 1;
    }
    
    &:nth-child(1) { height: 6px; }
    &:nth-child(2) { height: 9px; }
    &:nth-child(3) { height: 12px; }
    &:nth-child(4) { height: 15px; }
  }

  .checkmark {
    font-size: 16px;
    color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    
    .quality-name {
      font-size: 13px;
    }
    
    .quality-details {
      font-size: 10px;
    }
  }
`;

const AutoQualityInfo = styled.div`
  padding: 8px 16px;
  background: rgba(${props => props.theme?.colors?.primary?.replace('#', '') || 'FF6B6B'}, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 11px;
  color: #ccc;
  line-height: 1.4;
`;

const NoQualitiesMessage = styled.div`
  padding: 20px 16px;
  text-align: center;
  color: #888;
  font-size: 12px;
  font-style: italic;
`;

const QualityController = ({
  qualities = [],
  currentQuality = 'auto',
  onQualityChange,
  autoQualityEnabled = true,
  currentBitrate = 0,
  networkSpeed = 0,
  disabled = false,
  className,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [detectedQuality, setDetectedQuality] = useState('auto');
  const dropdownRef = useRef(null);

  // Закрытие дропдауна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Определение оптимального качества на основе скорости интернета
  useEffect(() => {
    if (networkSpeed > 0 && qualities.length > 0) {
      let optimalQuality = 'auto';

      if (networkSpeed > 5000000) { // > 5 Mbps
        optimalQuality = '1080p';
      } else if (networkSpeed > 2500000) { // > 2.5 Mbps
        optimalQuality = '720p';
      } else if (networkSpeed > 1000000) { // > 1 Mbps
        optimalQuality = '480p';
      } else {
        optimalQuality = '360p';
      }

      // Проверяем доступность качества
      const availableQuality = qualities.find(q => q.label === optimalQuality);
      if (availableQuality) {
        setDetectedQuality(optimalQuality);
      }
    }
  }, [networkSpeed, qualities]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleQualitySelect = (quality) => {
    setIsOpen(false);
    onQualityChange?.(quality);
  };

  const getQualityIcon = (quality) => {
    const height = parseInt(quality.height) || 0;

    if (height >= 2160) return '🎬'; // 4K
    if (height >= 1440) return '🎥'; // 1440p
    if (height >= 1080) return '📺'; // 1080p
    if (height >= 720) return '📱'; // 720p
    if (height >= 480) return '💾'; // 480p
    return '📟'; // 360p и ниже
  };

  const getSignalStrength = (quality) => {
    const height = parseInt(quality.height) || 0;

    if (height >= 1080) return 4;
    if (height >= 720) return 3;
    if (height >= 480) return 2;
    return 1;
  };

  const formatBitrate = (bitrate) => {
    if (bitrate > 1000000) {
      return `${(bitrate / 1000000).toFixed(1)}M`;
    } else if (bitrate > 1000) {
      return `${Math.round(bitrate / 1000)}k`;
    }
    return `${bitrate}`;
  };

  const formatNetworkSpeed = (speed) => {
    if (speed > 1000000) {
      return `${(speed / 1000000).toFixed(1)} Mbps`;
    } else if (speed > 1000) {
      return `${Math.round(speed / 1000)} Kbps`;
    }
    return `${speed} bps`;
  };

  const getCurrentQualityLabel = () => {
    if (currentQuality === 'auto') {
      return detectedQuality !== 'auto' ? `Auto (${detectedQuality})` : 'Auto';
    }
    return currentQuality;
  };

  const getCurrentQualityBadge = () => {
    if (currentQuality === 'auto') return 'AUTO';
    return currentQuality.replace('p', '');
  };

  if (qualities.length === 0) {
    return (
      <QualityContainer className={`quality-controller ${className || ''}`} style={style}>
        <QualityButton disabled={disabled}>
          <span className="quality-label">Auto</span>
        </QualityButton>
      </QualityContainer>
    );
  }

  // Создаем расширенный список качеств с автоматическим
  const extendedQualities = autoQualityEnabled
    ? [{ label: 'auto', height: 'auto', bitrate: 0, name: 'Автоматическое' }, ...qualities]
    : qualities;

  return (
    <QualityContainer
      className={`quality-controller ${className || ''}`}
      style={style}
      ref={dropdownRef}
    >
      <QualityButton
        onClick={handleToggle}
        disabled={disabled}
        open={isOpen}
        title={`Текущее качество: ${getCurrentQualityLabel()}${currentBitrate ? ` (${formatBitrate(currentBitrate)}bps)` : ''}`}
      >
        <span className="quality-label">{getCurrentQualityLabel()}</span>
        <span className="quality-badge">{getCurrentQualityBadge()}</span>
        <span className="dropdown-arrow">▼</span>
      </QualityButton>

      <QualityDropdown open={isOpen}>
        <QualityHeader>
          <span>Качество видео</span>
          {currentQuality === 'auto' && (
            <span className="auto-label">Авто</span>
          )}
        </QualityHeader>

        {autoQualityEnabled && currentQuality === 'auto' && (
          <AutoQualityInfo>
            {networkSpeed > 0 ? (
              <>Скорость сети: {formatNetworkSpeed(networkSpeed)} • Рекомендуется: {detectedQuality}</>
            ) : (
              <>Автоматический выбор качества на основе скорости соединения</>
            )}
          </AutoQualityInfo>
        )}

        {extendedQualities.length === 0 ? (
          <NoQualitiesMessage>
            Доступные качества не найдены
          </NoQualitiesMessage>
        ) : (
          extendedQualities.map((quality, index) => (
            <QualityOption
              key={quality.label || index}
              className={quality.label === currentQuality ? 'active' : ''}
              onClick={() => handleQualitySelect(quality.label)}
            >
              <div className="quality-info">
                <div className="quality-name">
                  {quality.label === 'auto' ? '🎯 Автоматическое' : `${getQualityIcon(quality)} ${quality.label}`}
                </div>
                {quality.label !== 'auto' && (
                  <div className="quality-details">
                    <span>{quality.width}×{quality.height}</span>
                    {quality.bitrate > 0 && <span>• {formatBitrate(quality.bitrate)}bps</span>}
                    {quality.fps && <span>• {quality.fps}fps</span>}
                  </div>
                )}
                {quality.label === 'auto' && detectedQuality !== 'auto' && (
                  <div className="quality-details">
                    <span>Текущее: {detectedQuality}</span>
                    {currentBitrate > 0 && <span>• {formatBitrate(currentBitrate)}bps</span>}
                  </div>
                )}
              </div>

              <div className="quality-indicator">
                {quality.label !== 'auto' && (
                  <div className="signal-bars">
                    {[1,2,3,4].map(bar => (
                      <div
                        key={bar}
                        className={`bar ${bar <= getSignalStrength(quality) ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                )}

                {quality.label === currentQuality && (
                  <span className="checkmark">✓</span>
                )}
              </div>
            </QualityOption>
          ))
        )}
      </QualityDropdown>
    </QualityContainer>
  );
};

export default QualityController;
