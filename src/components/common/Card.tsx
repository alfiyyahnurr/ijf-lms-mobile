import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentBorder?: 'blue' | 'green' | 'purple' | 'none';
  accentColor?: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'none';
}

export const Card: React.FC<CardProps> = ({ children, style, accentBorder = 'none', accentColor }) => {
  const effectiveAccent = accentColor || accentBorder;
  const getBorderColor = () => {
    if (effectiveAccent === 'blue') return COLORS.accentBlue;
    if (effectiveAccent === 'green') return '#16A34A';
    if (effectiveAccent === 'teal') return '#0D9488';
    if (effectiveAccent === 'orange') return '#EA580C';
    if (effectiveAccent === 'purple') return '#7C3AED';
    return 'transparent';
  };

  return (
    <View
      style={[
        styles.card,
        effectiveAccent !== 'none' && {
          borderLeftWidth: 4,
          borderLeftColor: getBorderColor(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
});

export default Card;
