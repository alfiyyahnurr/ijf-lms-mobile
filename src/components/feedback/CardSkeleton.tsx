import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import ShimmerSkeleton from './ShimmerSkeleton';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export interface CardSkeletonProps {
  count?: number;
  variant?: 'course' | 'assignment' | 'generic';
  style?: StyleProp<ViewStyle>;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 3,
  variant = 'generic',
  style,
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={style}>
      {items.map((item) => (
        <View key={item} style={styles.card}>
          {variant === 'course' ? (
            <>
              {/* Badge row */}
              <View style={styles.topRow}>
                <ShimmerSkeleton width={48} height={20} borderRadius={RADIUS.sm} />
                <ShimmerSkeleton width={52} height={20} borderRadius={RADIUS.full} />
              </View>
              {/* Course Title */}
              <ShimmerSkeleton width="80%" height={18} style={styles.spacerSm} />
              {/* Teacher */}
              <ShimmerSkeleton width="45%" height={14} style={styles.spacerXs} />
              {/* Sessions */}
              <ShimmerSkeleton width="30%" height={12} style={styles.spacerXs} />
            </>
          ) : variant === 'assignment' ? (
            <>
              {/* Assignment Title */}
              <ShimmerSkeleton width="75%" height={18} />
              {/* Course & Due Date */}
              <ShimmerSkeleton width="55%" height={14} style={styles.spacerSm} />
              {/* Status Pill */}
              <View style={styles.spacerSm}>
                <ShimmerSkeleton width={64} height={20} borderRadius={RADIUS.full} />
              </View>
            </>
          ) : (
            <>
              {/* Generic Card */}
              <ShimmerSkeleton width="70%" height={18} />
              <ShimmerSkeleton width="50%" height={14} style={styles.spacerSm} />
              <ShimmerSkeleton width="35%" height={12} style={styles.spacerXs} />
            </>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  spacerXs: {
    marginTop: 6,
  },
  spacerSm: {
    marginTop: 10,
  },
});

export default CardSkeleton;
