import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStudentData } from '../../context/StudentDataContext';
import { ExamItem } from '../../types';
import AppHeader from '../../components/navigation/AppHeader';
import ErrorState from '../../components/feedback/ErrorState';
import { FONTS, SHADOWS, COLORS } from '../../constants/theme';
import Badge from '../../components/common/Badge';
import QuizTakingScreen from '../quizzes/QuizTakingScreen';

export const ExamsScreen: React.FC = () => {
  const { exams, isRefreshing, isError, errorMessage, refreshAllData } = useStudentData();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [activeExam, setActiveExam] = useState<ExamItem | null>(null);
  const scrollRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return () => {
        setActiveExam(null);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('tabPress', () => {
      setActiveExam(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.resetKey) {
      setActiveExam(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [route.params?.resetKey]);

  if (activeExam) {
    return (
      <QuizTakingScreen
        quiz={{
          id: Number(activeExam.id) || 1,
          title: activeExam.course,
          course: activeExam.course,
          duration: '60 min',
          questions: 5,
          score: '—',
          status: 'in progress',
        }}
        onBack={() => setActiveExam(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showTitle={false} />

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
        {/* Header Title matching Screenshot 110159 */}
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Exams</Text>
          <Text style={styles.pageSubtitle}>Upcoming and available exams</Text>
        </View>

        {isError ? (
          <ErrorState
            title="Failed to Load Exams"
            subtitle={errorMessage || 'Unable to sync exam schedule with server.'}
            onRetry={refreshAllData}
          />
        ) : exams.length === 0 ? (
          /* Centered Empty State Text matching Screenshot 110159 */
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessageText}>
              No exams scheduled.
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {exams.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={styles.examCard}
                onPress={() => setActiveExam(exam)}
                activeOpacity={0.8}
              >
                <View style={styles.examCardInner}>
                  <View style={styles.examCardMain}>
                    <View style={styles.examTitleRow}>
                      <Text style={styles.examTitle} numberOfLines={1}>
                        {exam.course}
                      </Text>
                      <Badge color="purple">Midterm</Badge>
                    </View>
                    <Text style={styles.examSubtitle} numberOfLines={2}>
                      {exam.date} • {exam.time} • {exam.room || 'Main Hall'}
                    </Text>
                  </View>
                  <View style={styles.examCardRight}>
                    <Badge color="orange">{exam.status || 'upcoming'}</Badge>
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
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessageText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  cardList: {
    gap: 12,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOWS.sm,
  },
  examCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  examCardMain: {
    flex: 1,
  },
  examTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  examTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  examSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  examCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default ExamsScreen;
