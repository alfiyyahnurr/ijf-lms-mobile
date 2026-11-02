import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

export type BadgeVariant =
  | 'code'
  | 'active'
  | 'pending'
  | 'notstarted'
  | 'new'
  | 'unread'
  | 'discipline'
  | 'literacy'
  | 'habits'
  | 'primary'
  | 'success'
  | 'warning'
  | 'info'
  | 'purple'
  | 'default';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'code':
        return { bg: COLORS.accentBlueLight, text: COLORS.accentBlue };
      case 'active':
      case 'success':
        return { bg: COLORS.accentGreenLight, text: COLORS.accentGreen };
      case 'pending':
      case 'warning':
        return { bg: COLORS.accentAmberLight, text: COLORS.accentAmber };
      case 'notstarted':
        return { bg: '#F1F5F9', text: COLORS.textMuted };
      case 'new':
      case 'info':
        return { bg: '#E0F2FE', text: '#0369A1' };
      case 'unread':
        return { bg: '#FFEDD5', text: '#C2410C' };
      case 'discipline':
      case 'purple':
      case 'primary':
        return { bg: '#F3E8FF', text: '#7E22CE' };
      case 'literacy':
        return { bg: '#E0F2FE', text: '#0369A1' };
      case 'habits':
        return { bg: '#DCFCE7', text: '#15803D' };
      default:
        return { bg: COLORS.bgSubtle, text: COLORS.textMain };
    }
  };

  const current = getBadgeStyle();

  const getSizeStyle = (): { badge: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          badge: { paddingHorizontal: 6, paddingVertical: 2 },
          text: { fontSize: 10 },
        };
      case 'lg':
        return {
          badge: { paddingHorizontal: 10, paddingVertical: 4 },
          text: { fontSize: 12 },
        };
      case 'md':
      default:
        return {
          badge: { paddingHorizontal: 8, paddingVertical: 3 },
          text: { fontSize: 11 },
        };
    }
  };

  const sz = getSizeStyle();

  return (
    <View style={[styles.badge, sz.badge, { backgroundColor: current.bg }, style]}>
      <Text style={[styles.text, sz.text, { color: current.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default Badge;
