import { Platform } from 'react-native';

export const COLORS = {
  // Brand Identity (Royal Purple / Deep Violet)
  primary: '#4F089F',
  primaryDark: '#3B0677',
  primaryLight: '#F3E8FF',      // Soft pastel purple for tags, badges, and card tints
  primaryMedium: '#6813B8',     // Mid-tone purple
  primarySurface: '#F5F0FF',
  primaryActiveBg: 'rgba(255, 255, 255, 0.16)',
  sidebarBg: '#5001B2',

  // Functional Accents
  accentBlue: '#2563EB',       // Course left border, links, profile avatar
  accentBlueLight: '#EFF6FF',
  accentTeal: '#0F766E',       // Literacy buttons, house standing
  accentTealLight: '#F0FDFA',
  accentAmber: '#D97706',      // Pending badges, stat cards
  accentAmberLight: '#FFFBEB',
  accentGreen: '#16A34A',      // Active status, completed habits
  accentGreenLight: '#DCFCE7',
  accentRed: '#DC2626',        // Notification counter, danger, logout
  accentRedLight: '#FEF2F2',
  accentPurple: '#9333EA',     // Discipline pills, exams stat
  accentPurpleLight: '#F3E8FF',

  // Neutrals & Surfaces
  bgPage: '#F8FAFC',
  bgApp: '#F8FAFC',
  bgSurface: '#FFFFFF',
  bgSubtle: '#F1F5F9',
  borderCard: '#E2E8F0',
  borderSubtle: '#E2E8F0',
  borderDefault: '#CBD5E1',

  // Typography
  textMain: '#0F172A',
  textMuted: '#475569',        // Slate 600 - High contrast WCAG AAA
  textLight: '#94A3B8',
  textWhite: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const FONTS = {
  // Headings & Screen Titles: Cabin
  title: Platform.select({
    web: "'Cabin', sans-serif",
    default: 'Cabin_700Bold',
  }),
  titleSemiBold: Platform.select({
    web: "'Cabin', sans-serif",
    default: 'Cabin_600SemiBold',
  }),
  titleMedium: Platform.select({
    web: "'Cabin', sans-serif",
    default: 'Cabin_500Medium',
  }),

  // UI & General Typography: Albert Sans
  regular: Platform.select({
    web: "'Albert Sans', sans-serif",
    default: 'AlbertSans_400Regular',
  }),
  medium: Platform.select({
    web: "'Albert Sans', sans-serif",
    default: 'AlbertSans_500Medium',
  }),
  semiBold: Platform.select({
    web: "'Albert Sans', sans-serif",
    default: 'AlbertSans_600SemiBold',
  }),
  bold: Platform.select({
    web: "'Albert Sans', sans-serif",
    default: 'AlbertSans_700Bold',
  }),
  extraBold: Platform.select({
    web: "'Albert Sans', sans-serif",
    default: 'AlbertSans_800ExtraBold',
  }),
  // Monospace font specifically for points numbers (Leaderboard & Habits): Consolas
  consolas: Platform.select({
    web: "'Consolas', monospace",
    ios: 'Consolas',
    android: 'monospace',
    default: 'monospace',
  }),
  // Serif font for literacy metric numbers (Georgia):
  georgia: Platform.select({
    web: "'Georgia', serif",
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
};

