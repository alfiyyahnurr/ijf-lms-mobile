import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'teal' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  size = 'md',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'teal':
        return {
          btn: { backgroundColor: COLORS.accentTeal, borderColor: 'transparent' },
          text: { color: COLORS.textWhite },
          indicator: COLORS.textWhite,
        };
      case 'outline':
        return {
          btn: { backgroundColor: COLORS.bgSurface, borderColor: COLORS.borderSubtle },
          text: { color: COLORS.textMain },
          indicator: COLORS.textMain,
        };
      case 'danger':
        return {
          btn: { backgroundColor: COLORS.accentRedLight, borderColor: '#FCA5A5' },
          text: { color: COLORS.accentRed },
          indicator: COLORS.accentRed,
        };
      case 'primary':
      default:
        return {
          btn: { backgroundColor: COLORS.primary, borderColor: 'transparent' },
          text: { color: COLORS.textWhite },
          indicator: COLORS.textWhite,
        };
    }
  };

  const current = getVariantStyles();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 20, fontSize: 15 };
      case 'md':
      default:
        return { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13.5 };
    }
  };

  const sz = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        current.btn,
        {
          paddingVertical: sz.paddingVertical,
          paddingHorizontal: sz.paddingHorizontal,
          opacity: disabled ? 0.6 : 1,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={current.indicator} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={sz.fontSize + 2}
              color={typeof current.text?.color === 'string' ? current.text.color : '#FFFFFF'}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[styles.text, current.text, { fontSize: sz.fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum mobile touch target
  },
  text: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default CustomButton;
