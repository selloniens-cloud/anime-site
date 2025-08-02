import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleButton = styled(motion.button)`
  position: relative;
  width: 56px;
  height: 28px;
  background: ${props => props.isDark ? props.theme.colors.primary : props.theme.colors.border};
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  outline: none;
  
  &:focus {
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}40;
  }
  
  &:hover {
    background: ${props => props.isDark ? props.theme.colors.primaryLight : props.theme.colors.borderLight};
  }
`;

const ToggleThumb = styled(motion.div)`
  position: absolute;
  top: 2px;
  left: ${props => props.isDark ? '30px' : '2px'};
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: left 0.3s ease;
`;

const ToggleLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  user-select: none;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const SunIcon = () => (
  <IconContainer>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="5" fill="#FFA500"/>
      <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="#FFA500" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </IconContainer>
);

const MoonIcon = () => (
  <IconContainer>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" fill="#4A90E2"/>
    </svg>
  </IconContainer>
);

const ThemeToggle = ({ showLabel = true, size = 'medium' }) => {
  const { isDark, toggleTheme, isLoading } = useTheme();

  const handleToggle = () => {
    if (!isLoading) {
      toggleTheme();
    }
  };

  const buttonVariants = {
    tap: { scale: 0.95 },
    hover: { scale: 1.05 },
  };

  const thumbVariants = {
    light: { x: 0 },
    dark: { x: 28 },
  };

  return (
    <ToggleContainer>
      {showLabel && (
        <ToggleLabel>
          {isDark ? 'Темная' : 'Светлая'}
        </ToggleLabel>
      )}

      <ToggleButton
        isDark={isDark}
        onClick={handleToggle}
        disabled={isLoading}
        variants={buttonVariants}
        whileTap="tap"
        whileHover="hover"
        aria-label={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
        title={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
      >
        <ToggleThumb
          isDark={isDark}
          variants={thumbVariants}
          animate={isDark ? 'dark' : 'light'}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </ToggleThumb>
      </ToggleButton>
    </ToggleContainer>
  );
};

// Компактная версия переключателя для мобильных устройств
export const CompactThemeToggle = () => {
  const { isDark, toggleTheme, isLoading } = useTheme();

  const CompactButton = styled(motion.button)`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid ${props => props.theme.colors.border};
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
      background: ${props => props.theme.colors.surfaceSecondary};
      border-color: ${props => props.theme.colors.primary};
    }
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}40;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

  return (
    <CompactButton
      onClick={toggleTheme}
      disabled={isLoading}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      aria-label={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
      title={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </CompactButton>
  );
};

// Текстовая версия переключателя
export const TextThemeToggle = () => {
  const { isDark, toggleTheme, isLoading } = useTheme();

  const TextButton = styled(motion.button)`
    background: none;
    border: none;
    color: ${props => props.theme.colors.text};
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.3s ease;
    
    &:hover {
      background: ${props => props.theme.colors.surfaceSecondary};
      color: ${props => props.theme.colors.primary};
    }
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}40;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

  return (
    <TextButton
      onClick={toggleTheme}
      disabled={isLoading}
      whileTap={{ scale: 0.95 }}
      aria-label={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
    >
      {isDark ? '🌙 Темная' : '☀️ Светлая'}
    </TextButton>
  );
};

export default ThemeToggle;
