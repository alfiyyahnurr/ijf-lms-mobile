import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useStudentData } from '../../context/StudentDataContext';
import { Course } from '../../types';
import { FONTS, SHADOWS } from '../../constants/theme';
import AppHeader from '../../components/navigation/AppHeader';
import CourseDetailView from './CourseDetailView';
import EmptyState from '../../components/feedback/EmptyState';
import ErrorState from '../../components/feedback/ErrorState';
import CardSkeleton from '../../components/feedback/CardSkeleton';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onPress, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      // @ts-ignore - web hover props
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={[
        styles.courseCard,
        isHovered && styles.courseCardHovered,
      ]}
    >
      {/* Top Badges Row matching Screenshot */}
      <View style={styles.badgeRow}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>{course.code}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>active</Text>
        </View>
      </View>

      {/* Course Title matching Screenshot */}
      <Text style={styles.courseTitle} numberOfLines={2}>
        {course.name}
      </Text>

      {/* Teacher Name matching Screenshot */}
      <Text style={styles.teacherText} numberOfLines={1}>
        {course.teacher}
      </Text>

      {/* Sessions Count matching Screenshot */}
      <Text style={styles.sessionText}>
        {course.sessions} sessions
      </Text>
    </TouchableOpacity>
  );
};

export const CoursesScreen: React.FC = () => {
  const {
    courses,
    isLoading,
    isRefreshing,
    isError,
    errorMessage,
    refreshAllData,
  } = useStudentData();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const navigation = useNavigation<any>();

  // 1. Reset to main course list when user navigates away to any other screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedCourse(null);
      };
    }, [])
  );

  // 2. Also reset if user taps the Courses tab button in bottom nav while already on CourseDetail
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('tabPress', () => {
      setSelectedCourse(null);
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="My Courses" />

      {selectedCourse ? (
        <CourseDetailView
          course={selectedCourse}
          onBack={() => setSelectedCourse(null)}
        />
      ) : (
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
          {/* Header Title */}
          <View style={styles.headerBox}>
            <Text style={styles.pageTitle}>My Courses</Text>
            <Text style={styles.pageSubtitle}>Academic Year 7</Text>
          </View>

          {/* Data State Guards */}
          {isLoading ? (
            <CardSkeleton count={3} variant="course" />
          ) : isError ? (
            <ErrorState
              title="Failed to Load Courses"
              subtitle={errorMessage || undefined}
              onRetry={refreshAllData}
            />
          ) : courses.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No Enrolled Courses"
              subtitle="You are not currently enrolled in any academic courses for this semester."
              actionLabel="Refresh List"
              onAction={refreshAllData}
            />
          ) : (
            /* Pure Cards List matching Image 3 with Hover Effect */
            <View style={styles.cardList}>
              {courses.map((course, idx) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={idx}
                  onPress={() => setSelectedCourse(course)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...SHADOWS.sm,
  },
  courseCardHovered: {
    transform: [{ translateY: -2 }],
    borderTopColor: '#BFDBFE',
    borderRightColor: '#BFDBFE',
    borderBottomColor: '#BFDBFE',
    borderLeftColor: '#1D4ED8',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 3.5,
  },
  codeBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 3.5,
  },
  statusPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  courseTitle: {
    fontFamily: FONTS.title,
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 23,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  teacherText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 12,
  },
  sessionText: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: '#94A3B8',
  },
});

export default CoursesScreen;
