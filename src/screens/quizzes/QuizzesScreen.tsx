import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStudentData } from '../../context/StudentDataContext';
import { FONTS, SHADOWS } from '../../constants/theme';
import { Quiz } from '../../types';
import Badge from '../../components/common/Badge';
import AppHeader from '../../components/navigation/AppHeader';
import EmptyState from '../../components/feedback/EmptyState';
import ErrorState from '../../components/feedback/ErrorState';
import CardSkeleton from '../../components/feedback/CardSkeleton';
import QuizTakingScreen from './QuizTakingScreen';

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
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const scrollRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return () => {
        setActiveQuiz(null);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('tabPress', () => {
      setActiveQuiz(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.resetKey) {
      setActiveQuiz(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [route.params?.resetKey]);

  if (activeQuiz) {
    return (
      <QuizTakingScreen
        quiz={activeQuiz}
        onBack={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Quizzes" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
          /* Pure Card List matching Web quizzes-list-client */
          <View style={styles.cardList}>
            {quizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz.id}
                style={styles.quizCard}
                onPress={() => setActiveQuiz(quiz)}
                activeOpacity={0.8}
              >
                <View style={styles.quizCardInner}>
                  <View style={styles.quizCardMain}>
                    <Text style={styles.quizTitle} numberOfLines={2}>
                      {quiz.title}
                    </Text>
                    <Text style={styles.quizSubtitle} numberOfLines={2}>
                      {quiz.course} • {quiz.duration || '? min'} • {quiz.questions} questions
                    </Text>
                  </View>
                  <View style={styles.quizCardRight}>
                    {quiz.score && quiz.score !== '—' && (
                      <Text style={styles.quizScoreText}>{quiz.score}</Text>
                    )}
                    <Badge
                      color={
                        quiz.status === 'completed'
                          ? 'green'
                          : quiz.status === 'in progress'
                          ? 'blue'
                          : 'gray'
                      }
                    >
                      {quiz.status || 'not started'}
                    </Badge>
                  </View>
                </View>
              </TouchableOpacity>
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
    padding: 16,
    ...SHADOWS.sm,
  },
  quizCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  quizCardMain: {
    flex: 1,
  },
  quizTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  quizSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  quizCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  quizScoreText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
});

export default QuizzesScreen;
