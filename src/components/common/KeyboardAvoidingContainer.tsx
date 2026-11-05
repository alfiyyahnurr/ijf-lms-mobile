import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Keyboard,
  View,
  StyleProp,
  ViewStyle,
  KeyboardEvent,
} from 'react-native';

export interface KeyboardAvoidingContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  scrollEnabled?: boolean;
  extraBottomPadding?: number;
  showsVerticalScrollIndicator?: boolean;
}

/**
 * Universal Keyboard Avoiding Container for Expo Go (Android, iOS & Web)
 * - Actively tracks keyboard height via native Keyboard listeners.
 * - Dynamically expands bottom padding on Android & iOS so inputs/buttons are never blocked.
 * - Supports smooth scrolling and dismissal when dragging on mobile.
 */
export const KeyboardAvoidingContainer: React.FC<KeyboardAvoidingContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 64 : 0,
  scrollEnabled = true,
  extraBottomPadding = 24,
  showsVerticalScrollIndicator = false,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      if (e?.endCoordinates?.height) {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });

    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // On Android Expo Go, dynamic bottom padding guarantees that inputs at the bottom
  // can always be scrolled fully into view above the soft keyboard.
  const dynamicPaddingBottom =
    keyboardHeight > 0
      ? keyboardHeight + extraBottomPadding
      : extraBottomPadding;

  if (!scrollEnabled) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <View
          style={[
            styles.staticContent,
            contentContainerStyle,
            { paddingBottom: dynamicPaddingBottom },
          ]}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          contentContainerStyle,
          { paddingBottom: dynamicPaddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});

export default KeyboardAvoidingContainer;
