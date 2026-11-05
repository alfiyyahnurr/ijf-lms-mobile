import React, { useEffect } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Cabin_500Medium,
  Cabin_600SemiBold,
  Cabin_700Bold,
} from '@expo-google-fonts/cabin';
import {
  AlbertSans_400Regular,
  AlbertSans_500Medium,
  AlbertSans_600SemiBold,
  AlbertSans_700Bold,
  AlbertSans_800ExtraBold,
} from '@expo-google-fonts/albert-sans';
import RootNavigator from './src/navigation/RootNavigator';
import { NotificationProvider } from './src/context/NotificationContext';
import { StudentDataProvider } from './src/context/StudentDataContext';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    Cabin_500Medium,
    Cabin_600SemiBold,
    Cabin_700Bold,
    AlbertSans_400Regular,
    AlbertSans_500Medium,
    AlbertSans_600SemiBold,
    AlbertSans_700Bold,
    AlbertSans_800ExtraBold,
    'Cabin-Medium': Cabin_500Medium,
    'Cabin-SemiBold': Cabin_600SemiBold,
    'Cabin-Bold': Cabin_700Bold,
    'AlbertSans-Regular': AlbertSans_400Regular,
    'AlbertSans-Medium': AlbertSans_500Medium,
    'AlbertSans-SemiBold': AlbertSans_600SemiBold,
    'AlbertSans-Bold': AlbertSans_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const linkId = 'kreativa-google-fonts-link';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Albert+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Cabin:ital,wght@0,500;0,600;0,700;1,600;1,700&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.id = 'kreativa-base-typography';
        style.innerHTML = `
          /* Strictly enforce Albert Sans as default, Cabin for headings, and Consolas for points numbers */
          html, body, #root, [data-testid="root"], div, span, p, a, button, input, textarea, select {
            font-family: 'Albert Sans', sans-serif;
          }
          [dir="auto"], [class*="css-text-"], [data-lexical-editor] {
            font-family: 'Albert Sans', sans-serif;
          }
          /* Headings using Cabin */
          [style*="Cabin"], [class*="Cabin"] {
            font-family: 'Cabin', sans-serif !important;
          }
          /* Points numbers using Consolas */
          [style*="Consolas"], [style*="monospace"], [class*="Consolas"] {
            font-family: 'Consolas', monospace !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4F089F" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StudentDataProvider>
          <NotificationProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </NotificationProvider>
        </StudentDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

