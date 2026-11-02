import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING, FONTS } from '../../constants/theme';

export interface StatCardProps {
  value: string | number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  iconColor,
  iconBgColor,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.labelText} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  valueText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
  },
  labelText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
});

export default StatCard;
