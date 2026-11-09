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

  // Quick fallback/simulation login for development
  const handleSimulatedSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const authResult = await loginWithGoogle('mock_google_student_access_token');
      if (authResult?.accessToken) {
        setStudentProfile((prev) => ({
          ...prev,
          userId: authResult.user?.userId || prev.userId,
          studentId: authResult.user?.studentId || prev.studentId,
          schoolId: authResult.user?.schoolId || prev.schoolId,
          fullName: authResult.user?.fullName || prev.fullName,
          email: authResult.user?.email || prev.email,
        }));
        navigation.replace('MainDrawer');
      } else {
        throw new Error('This API is for student accounts only.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to authenticate with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Ambient Decorative Spheres / Circles */}
      <View style={styles.ambientSphereTopLeft} />
      <View style={styles.ambientSphereMiddleRight} />
      <View style={styles.ambientSphereBottomCenter} />

      {/* Main Centered Content */}
      <View style={styles.centerContainer}>
        {/* Kreativa Global School Shield Logo with 4 Quadrants */}
        <View style={styles.logoWrapper}>
          <KreativaLogo size={85} showText={true} />
        </View>

        {/* Welcome Title */}
        <Text style={styles.title}>Welcome to Student Portal</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Access your courses, assignments, and academic progress seamlessly.
        </Text>

        {/* Error Feedback Message (if any) */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* White Rounded Google Sign-In Pill Button (Opens In-App WebView Bridge) */}
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
            <ActivityIndicator size="small" color="#4F089F" />
          ) : (
            <View style={styles.buttonContent}>
              <GoogleIcon size={20} />
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Simulation Mode Link for Dev / Testing */}
        <TouchableOpacity
          style={styles.testLink}
          onPress={handleSimulatedSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.testLinkText}>
            [Simulation Mode: Quick Student Login]
          </Text>
        </TouchableOpacity>
      </View>

      {/* Academic Copyright Footer */}
      <View style={styles.footerWrap}>
        <Text style={styles.footerText}>
          © 2026 Kreativa Learning Management System
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
    backgroundColor: '#4F089F', // Brand Royal Deep Violet
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  /* --- AMBIENT PURPLE SPHERES --- */
  ambientSphereTopLeft: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ambientSphereMiddleRight: {
    position: 'absolute',
    top: '38%',
    right: 25,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  ambientSphereBottomCenter: {
    position: 'absolute',
    bottom: 40,
    left: '20%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  /* --- CENTER WRAPPER --- */
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 10,
  },
  logoWrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontFamily: FONTS.title,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.82)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 36,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    maxWidth: 320,
    alignSelf: 'center',
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  googleButton: {
    width: '100%',
    maxWidth: 340,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999, // 100% full pill capsule
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 15.5,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: 0.1,
  },
  testLink: {
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  testLinkText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
  footerWrap: {
    paddingVertical: 18,
    alignItems: 'center',
    zIndex: 10,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default LoginScreen;
