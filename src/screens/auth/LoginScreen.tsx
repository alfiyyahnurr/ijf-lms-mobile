import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import KreativaLogo from '../../components/common/KreativaLogo';
import GoogleIcon from '../../components/common/GoogleIcon';
import GoogleWebViewModal from '../../components/auth/GoogleWebViewModal';
import { FONTS } from '../../constants/theme';
import { useStudentData } from '../../context/StudentDataContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);

  const { setStudentProfile } = useStudentData();
  const { saveSession, loginWithGoogle, hasLoggedOut, setHasLoggedOut } = useAuth();

  // Handles successful authentication from the In-App WebView Bridge
  const handleAuthSuccess = async (userData: any) => {
    setShowWebView(false);
    setLoading(true);
    setErrorMsg(null);

    try {
      const token =
        userData?.token ||
        userData?.accessToken ||
        `jwt_${userData?.userId || 2602}_${Date.now()}`;

      const profileData: any = {
        userId: userData?.userId || 5243234,
        studentId: userData?.studentId || 5243234,
        schoolId: userData?.schoolId || 6,
        fullName: userData?.fullName || 'Fatih',
        email: userData?.email || 'alfiyyah@cnt.id',
        role: userData?.role || 'student',
        schoolName: userData?.schoolName || 'Kreativa Global High School',
        className: userData?.className || 'S4 Oxford',
        house: userData?.house ?? null,
        academicYearName: userData?.academicYearName || '2026/2027',
      };

      // 1. Update student data context
      setStudentProfile((prev) => ({
        ...prev,
        ...profileData,
      }));

      // 2. Persist session token and student profile permanently to native device storage
      await saveSession(token, profileData);
      setHasLoggedOut(false);
    } catch (err: any) {
      console.error('[Auth Error] Authentication error:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  // Handles error callback from the In-App WebView Bridge
  const handleAuthError = (errorMessage: string) => {
    console.log('[Auth Error] Sign-in failed:', errorMessage);
    setShowWebView(false);
    setLoading(false);
    setErrorMsg(errorMessage);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Decorative Circles: Exact positions & dimensions from Web LMS */}
      <View style={styles.circleTopLeft} />
      <View style={styles.circleBottomRight} />
      <View style={styles.circleTopRight} />

      {/* Main Centered Content */}
      <View style={styles.centerContainer}>
        {/* Kreativa Global School Shield Logo */}
        <View style={styles.logoWrapper}>
          <KreativaLogo size={96} showText={true} />
        </View>

        {/* Welcome Title */}
        <Text style={styles.title}>Welcome to Student Portal</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Access your courses, assignments, and academic progress seamlessly.
        </Text>

        {/* Error Feedback Message: Frosted glass banner matching Web LMS */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* White Rounded Google Sign-In Pill Button */}
        <TouchableOpacity
          style={[styles.googleButton, loading && styles.googleButtonDisabled]}
          activeOpacity={0.88}
          onPress={() => {
            console.log('[Auth] Opening Google OAuth sign-in window...');
            setErrorMsg(null);
            setShowWebView(true);
          }}
          disabled={loading}
          accessibilityLabel="Sign in with Google"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#5001b2" />
          ) : (
            <View style={styles.buttonContent}>
              <GoogleIcon size={20} />
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Academic Copyright Footer */}
      <View style={styles.footerWrap}>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} Kreativa Learning Management System
        </Text>
      </View>

      {/* In-App WebView Google OAuth Bridge Modal */}
      <GoogleWebViewModal
        visible={showWebView}
        onClose={() => setShowWebView(false)}
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
        resetGoogleSession={hasLoggedOut || Boolean(errorMsg)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5001b2', // Official Web LMS theme.secondaryColor
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  /* --- 3 DECORATIVE CIRCLES: Exact dimensions and positions from Web LMS --- */
  circleTopLeft: {
    position: 'absolute',
    top: 80,
    left: 40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  circleBottomRight: {
    position: 'absolute',
    bottom: 128,
    right: 32,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  circleTopRight: {
    position: 'absolute',
    top: 160,
    right: 48,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  /* --- CENTER WRAPPER --- */
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logoWrapper: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.title,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.80)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
    marginBottom: 40,
  },
  /* --- ERROR BANNER: Frosted glass bg-white/10 border-white/20 --- */
  errorBanner: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  /* --- GOOGLE BUTTON: Full pill rounded-full, px-6 py-4, shadow-lg --- */
  googleButton: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    color: '#0F172A',
    marginLeft: 12,
  },
  footerWrap: {
    marginTop: 32,
    marginBottom: 16,
    alignItems: 'center',
    zIndex: 10,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.60)',
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default LoginScreen;
