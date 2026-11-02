import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentBorder?: 'blue' | 'green' | 'purple' | 'none';
}

export const Card: React.FC<CardProps> = ({ children, style, accentBorder = 'none' }) => {
  const getBorderColor = () => {
    if (accentBorder === 'blue') return COLORS.accentBlue;
    if (accentBorder === 'green') return COLORS.accentTeal;
    if (accentBorder === 'purple') return COLORS.primary;
    return 'transparent';
  };

  return (
    <View
      style={[
        styles.card,
        accentBorder !== 'none' && {
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
