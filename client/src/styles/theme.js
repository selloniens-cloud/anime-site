export const lightTheme = {
  colors: {
    // Основные цвета
    primary: '#FF6B6B',
    primaryLight: '#FF8E8E',
    primaryDark: '#E55555',
    secondary: '#4ECDC4',
    secondaryLight: '#6FD5CE',
    secondaryDark: '#3BA99F',

    // Фоновые цвета
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F3F4',

    // Текстовые цвета
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    textLight: '#BDC3C7',

    // Границы и разделители
    border: '#E1E8ED',
    borderLight: '#F0F3F4',

    // Состояния
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',

    // Градиенты
    gradientPrimary: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
    gradientSecondary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',

    // Тени
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowMedium: 'rgba(0, 0, 0, 0.15)',
    shadowStrong: 'rgba(0, 0, 0, 0.25)',
  },

  // Размеры и отступы
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  // Радиусы скругления
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    round: '50%',
  },

  // Типографика
  typography: {
    fontFamily: '\'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif',
    fontSizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px',
      xxxl: '48px',
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },

  // Анимации
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },

  // Точки останова для адаптивности
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1200px',
  },

  // Z-индексы
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,

    // Основные цвета остаются теми же
    primary: '#FF6B6B',
    primaryLight: '#FF8E8E',
    primaryDark: '#E55555',
    secondary: '#4ECDC4',
    secondaryLight: '#6FD5CE',
    secondaryDark: '#3BA99F',

    // Темные фоновые цвета
    background: '#0F1419',
    backgroundSecondary: '#1A1F29',
    surface: '#1E2328',
    surfaceSecondary: '#252A31',

    // Светлые текстовые цвета
    text: '#FFFFFF',
    textSecondary: '#B0BEC5',
    textLight: '#78909C',

    // Темные границы
    border: '#37474F',
    borderLight: '#455A64',

    // Состояния остаются теми же
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',

    // Темные градиенты
    gradientPrimary: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
    gradientSecondary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #0F1419 0%, #1A1F29 100%)',

    // Более сильные тени для темной темы
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(0, 0, 0, 0.6)',
  },
};

// Утилиты для работы с темой
export const getTheme = (isDark = false) => isDark ? darkTheme : lightTheme;

// Медиа-запросы
export const media = {
  mobile: `@media (max-width: ${lightTheme.breakpoints.mobile})`,
  tablet: `@media (max-width: ${lightTheme.breakpoints.tablet})`,
  desktop: `@media (min-width: ${lightTheme.breakpoints.desktop})`,
  wide: `@media (min-width: ${lightTheme.breakpoints.wide})`,
};

// Миксины для часто используемых стилей
export const mixins = {
  flexCenter: `
    display: flex;
    align-items: center;
    justify-content: center;
  `,

  flexBetween: `
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,

  absoluteCenter: `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  `,

  truncateText: `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,

  hideScrollbar: `
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  `,
};
