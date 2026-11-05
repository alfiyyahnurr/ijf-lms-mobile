import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useStudentData } from '../../context/StudentDataContext';
import AppHeader from '../../components/navigation/AppHeader';
import EmptyState from '../../components/feedback/EmptyState';
import ErrorState from '../../components/feedback/ErrorState';

export const AnnouncementsScreen: React.FC = () => {
  const { announcements, isRefreshing, isError, errorMessage, refreshAllData } = useStudentData();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scrollRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return () => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('tabPress', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.resetKey) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [route.params?.resetKey]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showTitle={false} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAllData}
            colors={['#4F089F']}
            tintColor="#4F089F"
          />
        }
      >
        {/* Title & Subtitle */}
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Announcements</Text>
          <Text style={styles.pageSubtitle}>Important updates from your courses and school</Text>
        </View>

        {/* List of Announcements Cards */}
        {isError ? (
          <ErrorState
            title="Failed to Load Announcements"
            subtitle={errorMessage || 'Unable to sync school notices with server.'}
            onRetry={refreshAllData}
          />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon="megaphone-outline"
            title="No New Announcements"
            subtitle="All recent bulletins and campus notices have been read."
          />
        ) : (
          announcements.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                item.read && { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' },
              ]}
            >
              {/* Top Row: Title + "New" badge */}
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.isNew && (
                  <View style={styles.badgeNew}>
                    <Text style={styles.badgeNewText}>New</Text>
                  </View>
                )}
              </View>

              {/* Snippet */}
              <Text style={styles.cardSnippet} numberOfLines={2}>
                {item.content}
              </Text>

              {/* Meta: Author • Date */}
              <Text style={styles.cardMeta}>
                {item.author} • {item.date}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgApp,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 108,
  },
  headerBox: {
    marginTop: 4,
    marginBottom: 20,
  },
  pageTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0,
  },
  pageSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4.5,
    borderLeftColor: '#2563EB',
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: FONTS.title,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
  },
  badgeNew: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeNewText: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  cardSnippet: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19.5,
    marginBottom: 10,
  },
  cardMeta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default AnnouncementsScreen;

