import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';

export interface ErrorStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  subtitle?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  icon = 'cloud-offline-outline',
  title = 'Something Went Wrong',
  subtitle = 'Unable to load data. Please check your connection and try again.',
  retryLabel = 'Try Again',
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={COLORS.accentRed} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {onRetry && (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={onRetry}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={16} color={COLORS.textWhite} style={styles.retryIcon} />
          <Text style={styles.retryBtnText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FECDD3', // Soft red border
    marginVertical: SPACING.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF1F2', // Soft red surface
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.titleSemiBold,
    fontWeight: '700',
    color: COLORS.textMain,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    minHeight: 44,
  },
  retryIcon: {
    marginRight: 6,
  },
  retryBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});

export default ErrorState;
