import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useStudentData } from '../../context/StudentDataContext';
import { FONTS, SHADOWS } from '../../constants/theme';
import AppHeader from '../../components/navigation/AppHeader';
import EmptyState from '../../components/feedback/EmptyState';
import ErrorState from '../../components/feedback/ErrorState';
import CardSkeleton from '../../components/feedback/CardSkeleton';

export const QuizzesScreen: React.FC = () => {
  const {
    quizzes,
    isLoading,
    isRefreshing,
    isError,
    errorMessage,
    refreshAllData,
  } = useStudentData();
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
      <AppHeader title="Quizzes" />

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
        {/* Header Title matching Screenshot */}
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Quizzes</Text>
          <Text style={styles.pageSubtitle}>All quizzes across your courses</Text>
        </View>

        {/* Data State Guards */}
        {isLoading ? (
          <CardSkeleton count={3} variant="assignment" />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Quizzes"
            subtitle={errorMessage || undefined}
            onRetry={refreshAllData}
          />
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon="help-circle-outline"
            title="No Quizzes Available"
            subtitle="There are currently no checkpoint quizzes or tests scheduled."
            actionLabel="Refresh List"
            onAction={refreshAllData}
          />
        ) : (
          /* Pure Card List */
          <View style={styles.cardList}>
            {quizzes.map((quiz) => (
              <View key={quiz.id} style={styles.quizCard}>
                {/* Title */}
                <Text style={styles.quizTitle} numberOfLines={2}>
                  {quiz.title}
                </Text>

                {/* Subtitle */}
                <Text style={styles.quizSubtitle} numberOfLines={2}>
                  {quiz.course} • ? min • {quiz.questions} questions
                </Text>

                {/* Status pill located UNDER subtitle */}
                <View style={styles.statusPillRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>not started</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  cardList: {
    gap: 14,
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    ...SHADOWS.sm,
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 6,
  },
  quizSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});

export default QuizzesScreen;
