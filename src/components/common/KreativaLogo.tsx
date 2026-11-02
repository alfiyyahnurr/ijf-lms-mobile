import React from 'react';
import { View, Image, StyleSheet, ImageStyle, StyleProp, ViewStyle } from 'react-native';

const FULL_LOGO_NEGATIF = require('../../../assets/LOGO_KREATIVA_NEGATIF.png');
const SHIELD_LOGO = require('../../../assets/LOGO_KREATIVA_SHIELD.png');

interface KreativaLogoProps {
  size?: number;
  showText?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  textColor?: string;
  shieldColor?: string;
}

export const KreativaLogo: React.FC<KreativaLogoProps> = ({
  size = 64,
  showText = true,
  style,
  imageStyle,
}) => {
  if (!showText) {
    // Shield only for drawer brand header, app icons, etc.
    const shieldWidth = Math.round(size * 0.85);
    const shieldHeight = Math.round(shieldWidth * 1.22);
    return (
      <View style={[styles.container, style]}>
        <Image
          source={SHIELD_LOGO}
          style={[{ width: shieldWidth, height: shieldHeight }, imageStyle]}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Full Logo with "KREATIVA GLOBAL SCHOOL" official typography
  const fullSize = Math.round(size * 1.5);
  return (
    <View style={[styles.container, style]}>
      <Image
        source={FULL_LOGO_NEGATIF}
        style={[{ width: fullSize, height: fullSize }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default KreativaLogo;

