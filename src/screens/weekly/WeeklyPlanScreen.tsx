import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AppHeader from '../../components/navigation/AppHeader';
import ToastAlert from '../../components/feedback/ToastAlert';
import ErrorState from '../../components/feedback/ErrorState';
import { useStudentData } from '../../context/StudentDataContext';
import { getSchoolWeek } from '../../utils/calendarUtils';
import { WeeklyPlanSession } from '../../types';
import { FONTS, SHADOWS } from '../../constants/theme';
import WeeklyPlanDetailView from './WeeklyPlanDetailView';

// Helper for soft pastel course colors matching web reference screenshot
const getSubjectPalette = (courseCode: string, courseName: string) => {
  const code = (courseCode || '').toUpperCase();
  const name = (courseName || '').toLowerCase();

  if (code.includes('ART') || name.includes('art')) {
    // Peach / soft orange
    return {
      cardBg: '#FFF2E5',
      badgeText: '#C2410C',
      border: '#FED7AA',
    };
  }
  if (code.includes('BIO') || name.includes('biology')) {
    // Lavender / soft violet
    return {
      cardBg: '#F0EEFF',
      badgeText: '#6D28D9',
      border: '#DDD6FE',
    };
  }
  if (code.includes('CHEM') || name.includes('chemistry')) {
    // Mint / soft green
    return {
      cardBg: '#E6F7ED',
      badgeText: '#15803D',
      border: '#BBF7D0',
    };
  }
  if (code.includes('EL') || name.includes('english')) {
    // Warm neutral / sand
    return {
      cardBg: '#F3EFEA',
      badgeText: '#44403C',
      border: '#E7E5E4',
    };
  }
  if (code.includes('ISL') || name.includes('islamic')) {
    // Soft amber / yellow
    return {
      cardBg: '#FEF7DA',
      badgeText: '#B45309',
      border: '#FDE68A',
    };
  }
  if (code.includes('MATH') || name.includes('mathematics') || name.includes('math')) {
    // Soft rose / pink
    return {
      cardBg: '#FDF0F5',
      badgeText: '#BE185D',
      border: '#FBCFE8',
    };
  }
  if (code.includes('PE') || name.includes('physical')) {
    // Soft buff / golden
    return {
      cardBg: '#FEF7DA',
      badgeText: '#A16207',
      border: '#FDE68A',
    };
  }
  if (code.includes('PHY') || name.includes('physics')) {
    // Soft sky blue
    return {
      cardBg: '#F0F9FF',
      badgeText: '#0369A1',
      border: '#BAE6FD',
    };
  }
  if (code.includes('BI') || name.includes('bahasa')) {
    // Soft teal / slate
    return {
      cardBg: '#F0FDFA',
      badgeText: '#0F766E',
      border: '#99F6E4',
    };
  }
  // Default pastel slate
  return {
    cardBg: '#F1F5F9',
    badgeText: '#334155',
    border: '#E2E8F0',
  };
};

export const WeeklyPlanScreen: React.FC = () => {
  const {
    studentProfile,
    getWeeklyPlan,
    isRefreshing,
    isError,
    errorMessage,
    refreshAllData,
  } = useStudentData();

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<WeeklyPlanSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scrollRef = useRef<any>(null);

  // Auto-close open detail view and reset scroll to top when navigating
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return () => {
        setSelectedSessionDetail(null);
        setToastMessage(null);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [])
  );

  // Reset when tapping the Plan tab icon while already on Plan detail
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('tabPress', () => {
      setSelectedSessionDetail(null);
      setToastMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation]);

  // Reset when navigation params signal a reset
  useEffect(() => {
    if (route.params?.resetKey) {
      setSelectedSessionDetail(null);
      setToastMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [route.params?.resetKey]);

  // Term 1 Boundary
  const MIN_WEEK_OFFSET = -8;
  const MAX_WEEK_OFFSET = 2;

  // Calculate real dynamic 5-day school week (Monday to Friday)
  const schoolWeek = useMemo(() => {
    return getSchoolWeek(new Date(), weekOffset);
  }, [weekOffset]);

  // Fetch sessions for this week based on Postman format
  const sessions = useMemo(() => {
    return getWeeklyPlan(schoolWeek.weekStartIso);
  }, [schoolWeek.weekStartIso, getWeeklyPlan]);

  // Two-line date range format matching Web Screenshot
  const { dateLine1, dateLine2 } = useMemo(() => {
    const monday = schoolWeek.monday;
    const friday = schoolWeek.friday;
    const monMonth = monday.toLocaleString('en-US', { month: 'long' });
    const friMonth = friday.toLocaleString('en-US', { month: 'long' });
    const year = monday.getFullYear();

    if (monMonth === friMonth) {
      return {
        dateLine1: `${monday.getDate()} ${monMonth} – ${friday.getDate()}`,
        dateLine2: `${friMonth} ${year}`,
      };
    } else {
      return {
        dateLine1: `${monday.getDate()} ${monMonth} –`,
        dateLine2: `${friday.getDate()} ${friMonth} ${year}`,
      };
    }
  }, [schoolWeek]);

  const isPrevDisabled = weekOffset <= MIN_WEEK_OFFSET;
  const isNextDisabled = weekOffset >= MAX_WEEK_OFFSET;

  const handlePrevWeek = () => {
    if (!isPrevDisabled) {
      setWeekOffset((prev) => prev - 1);
    }
  };

  const handleNextWeek = () => {
    if (!isNextDisabled) {
      setWeekOffset((prev) => prev + 1);
    }
  };

  // Sessions for the currently selected day tab
  const selectedDaySessions = useMemo(() => {
    const dayNumber = selectedDayIndex + 1; // 1 = Monday, ..., 5 = Friday
    return sessions.filter((s: WeeklyPlanSession) => s.dayOfWeek === dayNumber);
  }, [sessions, selectedDayIndex]);

  const currentSelectedDay = schoolWeek.days[selectedDayIndex] || schoolWeek.days[0];

  // If session detail is selected, show full-screen detail view
  if (selectedSessionDetail) {
    const dayName = currentSelectedDay?.dayName || 'Monday';
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader showTitle={false} />
        <ToastAlert
          visible={Boolean(toastMessage)}
          message={toastMessage || ''}
          type="success"
          floating
          onClose={() => setToastMessage(null)}
        />
        <WeeklyPlanDetailView
          session={selectedSessionDetail}
          dayName={dayName}
          onBack={() => setSelectedSessionDetail(null)}
          onUpdateSession={(updated) => {
            setToastMessage(`Updated notes for ${updated.courseName}`);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showTitle={false} />

      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        floating
        onClose={() => setToastMessage(null)}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAllData}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Header Title matching Screenshot */}
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Weekly Plan</Text>
        </View>

        {isError ? (
          <ErrorState
            title="Failed to Load Weekly Plan"
            subtitle={errorMessage || 'Unable to sync weekly sessions with server.'}
            onRetry={refreshAllData}
          />
        ) : (
          <>
            {/* YOUR PROFILE Box matching Screenshot */}
            <View style={styles.profileBox}>
              <Text style={styles.profileLabel}>YOUR PROFILE</Text>
              <Text style={styles.profileName}>{studentProfile.fullName}</Text>
              <Text style={styles.profileDetails}>
                {studentProfile.className}, {studentProfile.schoolName}
              </Text>
            </View>

            {/* Date Navigator matching Web Screenshot */}
            <View style={styles.navigatorRow}>
              {/* < Prev Button */}
              <TouchableOpacity
                style={[styles.navButton, isPrevDisabled && styles.navButtonDisabled]}
                onPress={handlePrevWeek}
                activeOpacity={isPrevDisabled ? 1 : 0.7}
                disabled={isPrevDisabled}
              >
                <Ionicons
                  name="chevron-back"
                  size={14}
                  color={isPrevDisabled ? '#94A3B8' : '#1B2D4F'}
                />
                <Text
                  style={[
                    styles.navButtonText,
                    isPrevDisabled && styles.navButtonTextDisabled,
                  ]}
                >
                  Prev
                </Text>
              </TouchableOpacity>

              {/* Dynamic Real Calendar Range (2-Line Centered Format matching Web) */}
              <View style={styles.dateCenter}>
                <Text style={styles.dateRangeLine1} numberOfLines={1}>
                  {dateLine1}
                </Text>
                <Text style={styles.dateRangeLine2} numberOfLines={1}>
                  {dateLine2}
                </Text>
              </View>

              {/* Next > Button */}
              <TouchableOpacity
                style={[styles.navButton, isNextDisabled && styles.navButtonDisabled]}
                onPress={handleNextWeek}
                activeOpacity={isNextDisabled ? 1 : 0.7}
                disabled={isNextDisabled}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    isNextDisabled && styles.navButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={isNextDisabled ? '#94A3B8' : '#1B2D4F'}
                />
              </TouchableOpacity>
            </View>

            {/* 5 Day Selector Pills (Mon, Tue, Wed, Thu, Fri) */}
            <View style={styles.dayTabsRow}>
              {schoolWeek.days.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                const dayNum = idx + 1;
                const dayLessonsCount = sessions.filter((s) => s.dayOfWeek === dayNum).length;

                return (
                  <TouchableOpacity
                    key={day.dateString}
                    style={[
                      styles.dayTabCard,
                      isSelected ? styles.dayTabCardActive : styles.dayTabCardInactive,
                    ]}
                    onPress={() => setSelectedDayIndex(idx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayTabTitle,
                        isSelected ? styles.dayTabTitleActive : styles.dayTabTitleInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {day.dayShort} {day.dayNumber}
                    </Text>
                    <Text
                      style={[
                        styles.dayTabSubtitle,
                        isSelected ? styles.dayTabSubtitleActive : styles.dayTabSubtitleInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {dayLessonsCount} lessons
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Day's Schedule Heading */}
            <Text style={styles.scheduleHeading}>
              {currentSelectedDay?.isToday
                ? "Today's schedule"
                : `${currentSelectedDay?.dayName || 'Day'}'s schedule`}
            </Text>

            {/* Timeline Schedule List */}
            {selectedDaySessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyMessageText}>
                  No sessions scheduled for this day.
                </Text>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {selectedDaySessions.map((session, sIdx) => {
                  const palette = getSubjectPalette(session.courseCode, session.courseName);
                  const timeParts = session.time.split('–').map((t) => t.trim());
                  const isLast = sIdx === selectedDaySessions.length - 1;

                  return (
                    <View key={session.sessionId} style={styles.timelineRow}>
                      {/* Left: Time Range */}
                      <View style={styles.timeCol}>
                        <Text style={styles.timeStart}>{timeParts[0]} –</Text>
                        <Text style={styles.timeEnd}>{timeParts[1] || ''}</Text>
                      </View>

                      {/* Middle: Timeline track & Dot */}
                      <View style={styles.trackCol}>
                        <View style={styles.trackDot} />
                        {!isLast && <View style={styles.trackLine} />}
                      </View>

                      {/* Right: Pastel Lesson Card */}
                      <TouchableOpacity
                        style={[
                          styles.lessonCard,
                          { backgroundColor: palette.cardBg },
                        ]}
                        onPress={() => setSelectedSessionDetail(session)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.subjectBadge}>
                          <Text style={[styles.subjectBadgeText, { color: palette.badgeText }]}>
                            {session.courseName}
                          </Text>
                        </View>
                        <Text style={styles.lessonTitle} numberOfLines={2}>
                          {session.title}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  profileBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  profileLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  profileName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: '#1B2D4F',
    marginBottom: 4,
  },
  profileDetails: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    color: '#78716C',
  },
  /* Date Navigator 2-Line */
  navigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    minWidth: 74,
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  navButtonDisabled: {
    backgroundColor: '#FAF8F5',
    borderColor: '#E5E0D8',
    opacity: 0.5,
  },
  navButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#1B2D4F',
  },
  navButtonTextDisabled: {
    color: '#94A3B8',
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  dateRangeLine1: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#1B2D4F',
    textAlign: 'center',
  },
  dateRangeLine2: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#1B2D4F',
    textAlign: 'center',
  },
  /* 5 Day Selector Row */
  dayTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 24,
  },
  dayTabCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  dayTabCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  dayTabCardInactive: {
    backgroundColor: '#F5F2EB',
    borderWidth: 1,
    borderColor: '#EBE7DF',
  },
  dayTabTitle: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    marginBottom: 3,
  },
  dayTabTitleActive: {
    color: '#1B2D4F',
  },
  dayTabTitleInactive: {
    color: '#1B2D4F',
  },
  dayTabSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 10.5,
  },
  dayTabSubtitleActive: {
    color: '#64748B',
  },
  dayTabSubtitleInactive: {
    color: '#78716C',
  },
  /* Schedule Heading */
  scheduleHeading: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#1B2D4F',
    marginBottom: 16,
  },
  /* Timeline Schedule List */
  timelineList: {
    paddingBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeCol: {
    width: 62,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  timeStart: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
  },
  timeEnd: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
  },
  trackCol: {
    width: 22,
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: 8,
  },
  trackDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#1E293B',
    zIndex: 2,
  },
  trackLine: {
    width: 1.5,
    backgroundColor: '#E2E8F0',
    flex: 1,
    marginTop: 2,
  },
  lessonCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    marginLeft: 6,
    ...SHADOWS.sm,
  },
  subjectBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  subjectBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  lessonTitle: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessageText: {
    fontFamily: FONTS.titleMedium,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default WeeklyPlanScreen;
