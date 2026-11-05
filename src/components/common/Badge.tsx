import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

export type BadgeColor = 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'gray' | 'red';

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
  label?: string;
  children?: React.ReactNode;
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  children,
  variant = 'default',
  color,
  size = 'md',
  style,
}) => {
  const getBadgeStyle = () => {
    if (color) {
      switch (color) {
        case 'blue':
          return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
        case 'green':
          return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
        case 'orange':
          return { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' };
        case 'purple':
          return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
        case 'teal':
          return { bg: '#CCFBF1', text: '#0F766E', border: '#5EEAD4' };
        case 'red':
          return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
        case 'gray':
        default:
          return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      }
    }

    switch (variant) {
      case 'code':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'active':
      case 'success':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'pending':
      case 'warning':
        return { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' };
      case 'notstarted':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      case 'new':
      case 'info':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'unread':
        return { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' };
      case 'discipline':
      case 'purple':
      case 'primary':
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
      case 'literacy':
        return { bg: '#CCFBF1', text: '#0F766E', border: '#5EEAD4' };
      case 'habits':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  const badgeStyle = getBadgeStyle();
  const textContent = label !== undefined ? label : children;

  return (
    <View
      style={[
        styles.badge,
        styles[size],
        {
          backgroundColor: badgeStyle.bg,
          borderColor: badgeStyle.border,
          borderWidth: 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, styles[`text_${size}`], { color: badgeStyle.text }]}>
        {textContent}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
  },
  lg: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
  },
  text: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  text_sm: {
    fontSize: 10,
  },
  text_md: {
    fontSize: 11.5,
  },
  text_lg: {
    fontSize: 13,
  },
});

export default Badge;
