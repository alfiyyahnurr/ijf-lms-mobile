import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/theme';

export interface ToastAlertProps {
  message: string;
  visible?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  onHide?: () => void;
  onClose?: () => void;
  duration?: number;
  floating?: boolean; // When true, positions absolutely at top right
  position?: 'top-right' | 'top-center' | 'top-left';
  topOffset?: number; // Distance from top edge, defaults below header
  style?: StyleProp<ViewStyle>;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({
  message,
  visible = true,
  type = 'success',
  onHide,
  onClose,
  duration = 3200,
  floating = true,
  position = 'top-right',
  topOffset,
  style,
}) => {
  const translateY = useRef(new Animated.Value(-16)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -16,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      if (onClose) onClose();
      if (onHide) onHide();
    });
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(-16);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, message, duration]);

  if (!visible || !message) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'alert-circle-outline' as const,
          bg: '#DC2626',
        };
      case 'warning':
        return {
          icon: 'warning-outline' as const,
          bg: '#D97706',
        };
      case 'info':
        return {
          icon: 'information-circle-outline' as const,
          bg: '#135E66',
        };
      case 'success':
      default:
        return {
          icon: 'checkmark-circle-outline' as const,
          bg: '#00A854', // Emerald Green matching user's reference image
        };
    }
  };

  const config = getTypeConfig();

  const getFloatingStyle = (): ViewStyle | undefined => {
    if (!floating) return undefined;
    const defaultOffset = Platform.OS === 'ios' ? 76 : 68;
    const actualTop = topOffset !== undefined ? topOffset : defaultOffset;
    if (position === 'top-center') {
      return {
        position: 'absolute',
        top: actualTop,
        alignSelf: 'center',
        zIndex: 99999,
      };
    }
    if (position === 'top-left') {
      return {
        position: 'absolute',
        top: actualTop,
        left: 16,
        zIndex: 99999,
      };
    }
    return {
      position: 'absolute',
      top: actualTop,
      right: 16,
      zIndex: 99999,
    };
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          transform: [{ translateY }],
          opacity,
        },
        getFloatingStyle(),
        style,
      ]}
      pointerEvents="auto"
    >
      <Ionicons
        name={config.icon}
        size={18}
        color="#FFFFFF"
        style={styles.icon}
      />
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={handleDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
        style={styles.closeBtn}
      >
        <Ionicons name="close" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 8,
    alignSelf: 'flex-end',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    maxWidth: '90%',
  },
  icon: {
    marginRight: 0,
  },
  text: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    color: '#FFFFFF',
    includeFontPadding: false,
    flexShrink: 1,
  },
  closeBtn: {
    marginLeft: 2,
    padding: 2,
  },
});

export default ToastAlert;
