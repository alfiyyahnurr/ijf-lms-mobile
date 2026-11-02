import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudentData } from '../../context/StudentDataContext';
import AppHeader from '../../components/navigation/AppHeader';
import ErrorState from '../../components/feedback/ErrorState';
import { FONTS, SHADOWS, COLORS } from '../../constants/theme';

export const ExamsScreen: React.FC = () => {
  const { exams, isRefreshing, isError, errorMessage, refreshAllData } = useStudentData();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showTitle={false} />

      <ScrollView
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
              <View key={exam.id} style={styles.examCard}>
                <Text style={styles.examTitle}>{exam.course}</Text>
                <Text style={styles.examDate}>{exam.date} • {exam.time}</Text>
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
  examTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  examDate: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
  },
});

export default ExamsScreen;
