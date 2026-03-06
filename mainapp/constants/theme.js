// The Apex Store Theme
export const COLORS = {
  // Primary Colors
  primary: '#4A90E2',
  primaryDark: '#3A7BC8',
  primaryLight: '#5BA3F5',
  
  // Background Colors
  background: '#1a1a1a',
  backgroundSecondary: '#2d2d2d',
  backgroundCard: '#3a3a3a',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  
  // Accent Colors
  success: '#4CAF50',
  error: '#f44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // UI Colors
  border: '#404040',
  divider: '#333333',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Special
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const SIZES = {
  // Font Sizes
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  body: 14,
  small: 12,
  tiny: 10,
  
  // Spacing
  padding: 16,
  margin: 16,
  radius: 12,
  radiusSmall: 8,
  radiusLarge: 16,
  
  // Component Sizes
  buttonHeight: 50,
  inputHeight: 50,
  iconSize: 24,
  avatarSize: 60,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
};

export default { COLORS, SIZES, FONTS, SHADOWS };
