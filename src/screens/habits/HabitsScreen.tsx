import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { FONTS, SHADOWS } from '../../constants/theme';
import { HABIT_GROUPS_INITIAL } from '../../data/mockData';
import { HabitGroup } from '../../types';
import AppHeader from '../../components/navigation/AppHeader';
import PointsToast from '../../components/common/PointsToast';
import { useStudentData, formatDateKey } from '../../context/StudentDataContext';

// SEC_HS Official Design Tokens from Web LMS (lib/sec-hs-theme.ts)
const SEC_HS = {
  navy: '#1B2D4F',
  navyMid: '#2C4370',
  navyBg: '#EEF2F8',
  warm: '#F7F3EC',
  cream: '#FAFAF8',
  border: '#E5E0D8',
  muted: '#78716C',
  white: '#FFFFFF',
  text: '#1C1917',
  green: '#2E7D52',
  greenLight: '#E3F5EC',
  greenDark: '#1E5C3A',
  blue: '#2563EB',
  blueLight: '#DBEAFE',
  blueDark: '#1E40AF',
  red: '#B91C1C',
  redLight: '#FEF2F2',
  redBorder: '#FEE2E2',
} as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const HabitsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scrollRef = useRef<any>(null);

  // Scroll to top when focused or returned to
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

  // Unified reactive context for student profile, points, leaderboard, and habits
  const {
    studentProfile,
    classHabitsLeaderboard,
    habitsByDate,
    toggleHabit: contextToggleHabit,
    isDateSubmitted,
    toastList,
    dismissToast,
    showToast,
  } = useStudentData();

  // Real-time system calendar base
  const now = useMemo(() => new Date(), []);
  const REAL_TODAY_YEAR = now.getFullYear();
  const REAL_TODAY_MONTH = now.getMonth(); // 0-indexed (0=Jan..11=Dec)
  const REAL_TODAY_DATE = now.getDate();

  const [activeTab, setActiveTab] = useState<'daily' | 'recap' | 'leaderboard'>('daily');
  const [viewYear, setViewYear] = useState<number>(REAL_TODAY_YEAR);
  const [viewMonth, setViewMonth] = useState<number>(REAL_TODAY_MONTH);
  const [selectedDate, setSelectedDate] = useState<number>(REAL_TODAY_DATE);

  // Auto-reset calendar to latest real-time date (current year, month, and today)
  const resetCalendarToLatest = useCallback(() => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today.getDate());
  }, []);

  const handleTabChange = (newTab: 'daily' | 'recap' | 'leaderboard') => {
    setActiveTab(newTab);
    resetCalendarToLatest();
  };

  useFocusEffect(
    useCallback(() => {
      resetCalendarToLatest();
    }, [resetCalendarToLatest])
  );

  // Selected date key for current view: YYYY-MM-DD
  const selectedDateKey = useMemo(
    () => formatDateKey(viewYear, viewMonth, selectedDate),
    [viewYear, viewMonth, selectedDate]
  );

  const todayKey = useMemo(
    () => formatDateKey(REAL_TODAY_YEAR, REAL_TODAY_MONTH, REAL_TODAY_DATE),
    [REAL_TODAY_YEAR, REAL_TODAY_MONTH, REAL_TODAY_DATE]
  );

  const canEdit = selectedDateKey <= todayKey;
  const isPastDay = selectedDateKey < todayKey;
  const isFutureDate = selectedDateKey > todayKey;

  // Current active date's habit groups from unified context
  const currentHabitGroups: HabitGroup[] = useMemo(() => {
    return (
      habitsByDate[selectedDateKey] ||
      HABIT_GROUPS_INITIAL.map((g) => ({
        ...g,
        items: g.items.map((i) => ({ ...i, checked: false })),
      }))
    );
  }, [habitsByDate, selectedDateKey]);

  // Dynamic Calendar Month Weeks Computation (Sunday = 0 .. Saturday = 6)
  const monthWeeks = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      currentWeek.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    return weeks;
  }, [viewYear, viewMonth]);

  // Month navigation guards: cannot advance beyond current real-time month
  const isCurrentMonthOrFuture = useMemo(() => {
    return (
      viewYear > REAL_TODAY_YEAR ||
      (viewYear === REAL_TODAY_YEAR && viewMonth >= REAL_TODAY_MONTH)
    );
  }, [viewYear, viewMonth, REAL_TODAY_YEAR, REAL_TODAY_MONTH]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(1);
  };

  const handleNextMonth = () => {
    if (isCurrentMonthOrFuture) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(1);
  };

  // Compute Daily Checklist Stats
  const totalItems = useMemo(
    () => currentHabitGroups.reduce((acc, g) => acc + g.items.length, 0),
    [currentHabitGroups]
  );
  const completedItems = useMemo(
    () => currentHabitGroups.reduce((acc, g) => acc + g.items.filter((i) => i.checked).length, 0),
    [currentHabitGroups]
  );
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const activeGroupsCount = useMemo(
    () => currentHabitGroups.filter((g) => g.items.some((i) => i.checked)).length,
    [currentHabitGroups]
  );

  // Toggle habit with validation for future dates
  const handleToggleHabit = (groupId: string, itemId: string) => {
    if (!canEdit) {
      showToast('Cannot record habits for future dates. Please select today or a past date.');
      return;
    }
    contextToggleHabit(selectedDateKey, groupId, itemId);
  };

  // Compute Recap Stats Dynamically across days of viewed month
  const isViewingCurrentMonth = viewYear === REAL_TODAY_YEAR && viewMonth === REAL_TODAY_MONTH;
  const daysInViewMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
  const totalElapsedDays = isViewingCurrentMonth ? REAL_TODAY_DATE : daysInViewMonth;

  // Recap calculations matching official Web LMS rules
  const recapStats = useMemo(() => {
    let fullDaysCount = 0;
    let daysLoggedCount = 0;

    const groupCompletedDays: Record<string, number> = {
      'rise-early': 0,
      worship: 0,
      exercise: 0,
      'eat-well': 0,
      'love-learning': 0,
      community: 0,
      'sleep-early': 0,
    };

    for (let d = 1; d <= totalElapsedDays; d++) {
      const dKey = formatDateKey(viewYear, viewMonth, d);
      const groups = habitsByDate[dKey];
      if (!groups) continue;

      const anyCheckedToday = groups.some((g) => g.items.some((i) => i.checked));
      if (anyCheckedToday) {
        daysLoggedCount++;
      }

      let categoriesActiveToday = 0;
      for (const g of groups) {
        const hasCheckInGroup = g.items.some((i) => i.checked);
        if (hasCheckInGroup) {
          categoriesActiveToday++;
          if (groupCompletedDays[g.id] !== undefined) {
            groupCompletedDays[g.id]++;
          }
        }
      }

      // Rule: Full day = >= 5 categories checked (2 pts each)
      if (categoriesActiveToday >= 5) {
        fullDaysCount++;
      }
    }

    const pointsEarned = fullDaysCount * 2;

    return {
      fullDays: fullDaysCount,
      daysLogged: daysLoggedCount,
      points: pointsEarned,
      groupCompletedDays,
    };
  }, [habitsByDate, viewYear, viewMonth, totalElapsedDays]);

  const dateSubLabel = isViewingCurrentMonth && selectedDate === REAL_TODAY_DATE
    ? 'today'
    : selectedDateKey;

  const trackLabel = 'Senior';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Habits" />

      {/* Floating Points Toast Notifications */}
      {toastList.length > 0 && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          {toastList.map((toast) => (
            <PointsToast key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header Title matching Web LMS (h1 fontSize: 18, fontWeight: 700, color: SEC_HS.navy) */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Daily habit checklist</Text>
        </View>

        {/* Segmented Tabs (3 Tab: Daily, Recap, Leaderboard) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'daily' && styles.tabBtnActive]}
            onPress={() => handleTabChange('daily')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'daily' && styles.tabBtnTextActive]}>
              Daily
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'recap' && styles.tabBtnActive]}
            onPress={() => handleTabChange('recap')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'recap' && styles.tabBtnTextActive]}>
              Recap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'leaderboard' && styles.tabBtnActive]}
            onPress={() => handleTabChange('leaderboard')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'leaderboard' && styles.tabBtnTextActive]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* ==============================================================
            TAB 1: DAILY
            ============================================================== */}
        {activeTab === 'daily' && (
          <View style={styles.tabContentWrap}>
            {/* 1. Monthly Calendar Card */}
            <View style={styles.calendarCard}>
              {/* Month Header Navigation */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={styles.navArrowBtn}
                  onPress={handlePrevMonth}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={16} color={SEC_HS.muted} />
                </TouchableOpacity>

                <Text style={styles.monthTitleText}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>

                <TouchableOpacity
                  style={[styles.navArrowBtn, isCurrentMonthOrFuture && styles.navArrowBtnDisabled]}
                  onPress={handleNextMonth}
                  activeOpacity={0.7}
                  disabled={isCurrentMonthOrFuture}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isCurrentMonthOrFuture ? 'rgba(28,25,23,0.28)' : SEC_HS.muted}
                  />
                </TouchableOpacity>
              </View>

              {/* Weekday Labels (Sun..Sat) */}
              <View style={styles.weekdaysRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <Text key={d} style={styles.weekdayText}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Dynamic Calendar Days Grid */}
              <View style={styles.daysGrid}>
                {monthWeeks.map((week, wIdx) => (
                  <View key={`week-${wIdx}`} style={styles.weekRow}>
                    {week.map((dateNum, dIdx) => {
                      if (dateNum === null) {
                        return <View key={`empty-${dIdx}`} style={styles.dayCellWrapper} />;
                      }

                      const isSelected = dateNum === selectedDate;
                      const isFuture = isViewingCurrentMonth
                        ? dateNum > REAL_TODAY_DATE
                        : (viewYear > REAL_TODAY_YEAR || (viewYear === REAL_TODAY_YEAR && viewMonth > REAL_TODAY_MONTH));
                      const dKey = formatDateKey(viewYear, viewMonth, dateNum);
                      const hasSubmission = isDateSubmitted(dKey);

                      // State 1: Future locked
                      if (isFuture) {
                        return (
                          <View key={`date-${dateNum}`} style={styles.dayCellWrapper}>
                            <View style={styles.dayCellFuture}>
                              <Text style={styles.dayTextFuture}>{dateNum}</Text>
                              <View style={styles.dotPlaceholder} />
                            </View>
                          </View>
                        );
                      }

                      // State 2: Selected date
                      if (isSelected) {
                        return (
                          <TouchableOpacity
                            key={`date-${dateNum}`}
                            style={styles.dayCellWrapper}
                            onPress={() => setSelectedDate(dateNum)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.dayCellSelected}>
                              <Text style={styles.dayTextSelected}>{dateNum}</Text>
                              {hasSubmission ? (
                                <View style={styles.submissionDot} />
                              ) : (
                                <View style={styles.dotPlaceholder} />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      // State 3: Has submission
                      if (hasSubmission) {
                        return (
                          <TouchableOpacity
                            key={`date-${dateNum}`}
                            style={styles.dayCellWrapper}
                            onPress={() => setSelectedDate(dateNum)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.dayCellSubmission}>
                              <Text style={styles.dayTextSubmission}>{dateNum}</Text>
                              <View style={styles.submissionDot} />
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      // State 4: Past not filled
                      return (
                        <TouchableOpacity
                          key={`date-${dateNum}`}
                          style={styles.dayCellWrapper}
                          onPress={() => setSelectedDate(dateNum)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.dayCellPast}>
                            <Text style={styles.dayTextPast}>{dateNum}</Text>
                            <View style={styles.dotPlaceholder} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Calendar Legend matching Web LMS */}
              <View style={styles.legendDivider} />
              <Text style={styles.legendTitle}>Calendar legend</Text>
              <View style={styles.legendGrid}>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={styles.legendBoxSelected} />
                    <Text style={styles.legendLabel}>Selected date</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.legendBoxSubmission}>
                      <View style={styles.legendInnerDot} />
                    </View>
                    <Text style={styles.legendLabel}>Has submission</Text>
                  </View>
                </View>

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={styles.legendBoxPast} />
                    <Text style={styles.legendLabel}>Past, not filled</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={styles.legendTextFutureNum}>5</Text>
                    <Text style={styles.legendLabel}>Future (locked)</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Validation Banner if Future Date is Selected */}
            {isFutureDate && (
              <View style={styles.validationWarningBanner}>
                <Ionicons name="information-circle-outline" size={16} color={SEC_HS.red} />
                <Text style={styles.validationWarningText}>
                  Cannot record habits for future dates. Please select today or a past date.
                </Text>
              </View>
            )}

            {/* 2. Checklist Progress Summary */}
            <View style={styles.checklistProgressContainer}>
              <Text style={styles.checklistProgressLabel}>Checklist progress</Text>
              <Text style={styles.checklistProgressBigText}>
                {completedItems}/{totalItems} ({progressPercent}%)
              </Text>
              <Text style={styles.checklistProgressAutoSaveText}>
                Checks save automatically. You can still edit past days.{isPastDay ? ' You are editing a past day.' : ''}
              </Text>
              <Text style={styles.checklistProgressSubMeta}>
                {activeGroupsCount}/7 habit groups · {trackLabel} track · {dateSubLabel}
              </Text>
            </View>

            {/* 3. 7 Habit Group Cards (1 Column on Mobile View) */}
            <View
              style={[
                styles.habitListWrap,
                !canEdit && styles.habitListDisabled,
              ]}
              pointerEvents={canEdit ? 'auto' : 'none'}
            >
              {currentHabitGroups.map((group) => {
                const isGroupActive = group.items.some((i) => i.checked);
                return (
                  <View
                    key={group.id}
                    style={[styles.habitCard, isGroupActive && styles.habitCardActive]}
                  >
                    <Text
                      style={[
                        styles.habitCardTitle,
                        isGroupActive && styles.habitCardTitleCompleted,
                      ]}
                    >
                      {group.title}{isGroupActive ? ' ✓' : ''}
                    </Text>
                    <View style={styles.habitCardItemsCol}>
                      {group.items.map((item) => {
                        const isChecked = item.checked;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.habitItemRow,
                              isChecked && styles.habitItemRowChecked,
                            ]}
                            onPress={() => handleToggleHabit(group.id, item.id)}
                            activeOpacity={0.7}
                            disabled={!canEdit}
                          >
                            <Text
                              style={[
                                styles.habitItemLabel,
                                isChecked && styles.habitItemLabelChecked,
                              ]}
                            >
                              {item.text}
                            </Text>
                            <View
                              style={[
                                styles.circularCheck,
                                isChecked && styles.circularCheckActive,
                              ]}
                            >
                              {isChecked && (
                                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 4. Footer Disclaimer */}
            <Text style={styles.footerDisclaimer}>
              Based on G7KAIH (Gerakan 7 Kebiasaan Anak Indonesia Hebat). Full-day points when ≥5 habit groups are checked.
            </Text>
          </View>
        )}

        {/* ==============================================================
            TAB 2: RECAP
            ============================================================== */}
        {activeTab === 'recap' && (
          <View style={styles.tabContentWrap}>
            {/* Card 1: Month summary */}
            <View style={styles.recapSummaryCard}>
              <Text style={styles.recapSummaryTitle}>
                {MONTH_NAMES[viewMonth]} {viewYear} summary
              </Text>
              <View style={styles.recapTilesRow}>
                {/* Tile 1: Full days */}
                <View style={styles.recapTile}>
                  <Text style={styles.recapTileNumber}>{recapStats.fullDays}</Text>
                  <Text style={styles.recapTileLabel}>Full days</Text>
                </View>

                {/* Tile 2: Days logged */}
                <View style={styles.recapTile}>
                  <Text style={styles.recapTileNumber}>{recapStats.daysLogged}</Text>
                  <Text style={styles.recapTileLabel}>Days logged</Text>
                </View>

                {/* Tile 3: Points */}
                <View style={styles.recapTile}>
                  <Text style={styles.recapTileNumber}>{recapStats.points}</Text>
                  <Text style={styles.recapTileLabel}>Points</Text>
                </View>
              </View>

              <Text style={styles.recapRuleText}>
                Full day = ≥5 categories checked (2 pts each).
              </Text>
            </View>

            {/* Card 2: Days per habit group */}
            <View style={styles.recapGroupsCard}>
              <Text style={styles.recapGroupsTitle}>Days per habit group</Text>

              <View style={styles.recapGroupsList}>
                {HABIT_GROUPS_INITIAL.map((group) => {
                  const completedDays = recapStats.groupCompletedDays[group.id] || 0;
                  const progressRatio = totalElapsedDays > 0 ? Math.min(1, completedDays / totalElapsedDays) : 0;

                  return (
                    <View key={group.id} style={styles.recapGroupRow}>
                      <View style={styles.recapGroupHeader}>
                        <Text style={styles.recapGroupName}>{group.title}</Text>
                        <Text style={styles.recapGroupScore}>
                          {completedDays}/{totalElapsedDays}
                        </Text>
                      </View>
                      <View style={styles.recapProgressBarTrack}>
                        <View
                          style={[
                            styles.recapProgressBarFill,
                            { width: `${Math.min(100, progressRatio * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Month Navigation Outline Buttons matching Web LMS */}
            <View style={styles.monthNavButtonsRow}>
              <TouchableOpacity
                style={styles.monthNavOutlineBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={15} color={SEC_HS.navy} />
                <Text style={styles.monthNavOutlineBtnText}>Prev month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.monthNavOutlineBtn,
                  isCurrentMonthOrFuture && styles.monthNavOutlineBtnDisabled,
                ]}
                onPress={handleNextMonth}
                activeOpacity={0.7}
                disabled={isCurrentMonthOrFuture}
              >
                <Text
                  style={[
                    styles.monthNavOutlineBtnText,
                    isCurrentMonthOrFuture && styles.monthNavOutlineBtnTextDisabled,
                  ]}
                >
                  Next month
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={isCurrentMonthOrFuture ? 'rgba(28,25,23,0.35)' : SEC_HS.navy}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ==============================================================
            TAB 3: LEADERBOARD
            ============================================================== */}
        {activeTab === 'leaderboard' && (
          <View style={styles.tabContentWrap}>
            <View style={styles.classLeaderboardCard}>
              {/* Header Row: Title & Link to Full Leaderboard */}
              <View style={styles.classLeaderboardHeader}>
                <View>
                  <Text style={styles.classLeaderboardTitle}>Class habits points</Text>
                  <Text style={styles.classLeaderboardSubtitle}>
                    {studentProfile.className || 'S4 Oxford'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('BoardTab')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fullLeaderboardLinkText}>Full leaderboard →</Text>
                </TouchableOpacity>
              </View>

              {/* Class Ranking List matching Web LMS */}
              <View style={styles.rankList}>
                {classHabitsLeaderboard.slice(0, 15).map((student, idx) => {
                  const hPoints = student.isCurrent ? studentProfile.habitsPts : (student.habitsPts ?? student.points ?? 0);
                  const isMe = student.isCurrent;
                  return (
                    <View
                      key={student.name || idx}
                      style={[styles.rankRow, isMe && styles.rankRowCurrentUser]}
                    >
                      <Text
                        style={[
                          styles.rankNumberText,
                          isMe && styles.rankNumberTextCurrentUser,
                        ]}
                      >
                        {idx + 1}
                      </Text>
                      <Text
                        style={[
                          styles.studentNameText,
                          isMe && styles.studentNameTextCurrentUser,
                        ]}
                        numberOfLines={1}
                      >
                        {student.name}{isMe ? ' (you)' : ''}
                      </Text>
                      <Text style={styles.pointsTextWrap}>
                        <Text style={styles.pointsLetterH}>H </Text>
                        <Text style={styles.pointsNumberConsolas}>
                          {hPoints}
                        </Text>
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
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
    paddingTop: 12,
    paddingBottom: 40,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 76 : 68,
    right: 16,
    zIndex: 99999,
  },
  headerBlock: {
    marginBottom: 12,
  },
  pageTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: SEC_HS.navy,
    letterSpacing: 0,
  },
  /* Segmented Tabs (3 Tab: Daily, Recap, Leaderboard) */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: SEC_HS.warm,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: SEC_HS.blue,
  },
  tabBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: SEC_HS.navy,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContentWrap: {
    gap: 12,
  },
  /* Monthly Calendar Card */
  calendarCard: {
    backgroundColor: SEC_HS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SEC_HS.border,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SEC_HS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SEC_HS.white,
  },
  navArrowBtnDisabled: {
    opacity: 0.35,
  },
  monthTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: SEC_HS.navy,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekdayText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: SEC_HS.muted,
    width: '14.28%',
    textAlign: 'center',
    paddingBottom: 4,
  },
  daysGrid: {
    gap: 4,
    marginBottom: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCellWrapper: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: SEC_HS.blue,
    backgroundColor: SEC_HS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  dayTextSelected: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: SEC_HS.blueDark,
  },
  dayCellSubmission: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: SEC_HS.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  dayTextSubmission: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: SEC_HS.greenDark,
  },
  dayCellFuture: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  dayTextFuture: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(28,25,23,0.28)',
  },
  dayCellPast: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: SEC_HS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingTop: 2,
  },
  dayTextPast: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '500',
    color: SEC_HS.navy,
  },
  submissionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: SEC_HS.green,
    marginTop: 2,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
  legendDivider: {
    height: 1,
    backgroundColor: SEC_HS.border,
    marginTop: 10,
    marginBottom: 10,
  },
  legendTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: SEC_HS.muted,
    marginBottom: 8,
  },
  legendGrid: {
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  legendBoxSelected: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: SEC_HS.blue,
    backgroundColor: SEC_HS.blueLight,
  },
  legendBoxSubmission: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: SEC_HS.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendInnerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: SEC_HS.green,
  },
  legendBoxPast: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: SEC_HS.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  legendTextFutureNum: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(28,25,23,0.28)',
    width: 16,
    textAlign: 'center',
  },
  legendLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: SEC_HS.muted,
  },
  /* Validation warning banner */
  validationWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SEC_HS.redLight,
    borderWidth: 1,
    borderColor: SEC_HS.redBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  validationWarningText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: SEC_HS.red,
    flex: 1,
  },
  /* Checklist Progress Summary */
  checklistProgressContainer: {
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  checklistProgressLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: SEC_HS.muted,
    marginBottom: 2,
  },
  checklistProgressBigText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '800',
    color: SEC_HS.navy,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  checklistProgressAutoSaveText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SEC_HS.muted,
    lineHeight: 18,
  },
  checklistProgressSubMeta: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: SEC_HS.muted,
    marginTop: 4,
  },
  /* Habit Group Cards */
  habitListWrap: {
    gap: 10,
  },
  habitListDisabled: {
    opacity: 0.55,
  },
  habitCard: {
    backgroundColor: SEC_HS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: SEC_HS.border,
    padding: 12,
    ...SHADOWS.sm,
  },
  habitCardActive: {
    borderColor: `${SEC_HS.green}60`,
  },
  habitCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: SEC_HS.navy,
    marginBottom: 8,
  },
  habitCardTitleCompleted: {
    color: SEC_HS.green,
  },
  habitCardItemsCol: {
    gap: 6,
  },
  habitItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SEC_HS.cream,
    borderWidth: 1,
    borderColor: SEC_HS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  habitItemRowChecked: {
    backgroundColor: SEC_HS.greenLight,
    borderColor: `${SEC_HS.green}55`,
  },
  habitItemLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    fontWeight: '500',
    color: SEC_HS.text,
    flex: 1,
    lineHeight: 17,
  },
  habitItemLabelChecked: {
    color: SEC_HS.greenDark,
  },
  circularCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: SEC_HS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SEC_HS.white,
    flexShrink: 0,
  },
  circularCheckActive: {
    backgroundColor: SEC_HS.green,
    borderColor: SEC_HS.green,
  },
  footerDisclaimer: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: SEC_HS.muted,
    lineHeight: 17,
    marginTop: 14,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  /* Tab 2: Recap Styles */
  recapSummaryCard: {
    backgroundColor: SEC_HS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SEC_HS.border,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  recapSummaryTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: SEC_HS.muted,
    marginBottom: 10,
  },
  recapTilesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  recapTile: {
    flex: 1,
    backgroundColor: SEC_HS.warm,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapTileNumber: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '800',
    color: SEC_HS.navy,
  },
  recapTileLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: SEC_HS.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  recapRuleText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: SEC_HS.muted,
    marginTop: 2,
  },
  recapGroupsCard: {
    backgroundColor: SEC_HS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SEC_HS.border,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  recapGroupsTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: SEC_HS.navy,
    marginBottom: 10,
  },
  recapGroupsList: {
    gap: 8,
  },
  recapGroupRow: {
    marginBottom: 2,
  },
  recapGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recapGroupName: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: SEC_HS.navy,
  },
  recapGroupScore: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SEC_HS.muted,
  },
  recapProgressBarTrack: {
    height: 6,
    backgroundColor: SEC_HS.warm,
    borderRadius: 999,
    overflow: 'hidden',
  },
  recapProgressBarFill: {
    height: 6,
    backgroundColor: SEC_HS.green,
    borderRadius: 999,
  },
  monthNavButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  monthNavOutlineBtn: {
    flex: 1,
    backgroundColor: SEC_HS.white,
    borderWidth: 1,
    borderColor: SEC_HS.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  monthNavOutlineBtnDisabled: {
    opacity: 0.4,
  },
  monthNavOutlineBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: SEC_HS.navy,
  },
  monthNavOutlineBtnTextDisabled: {
    color: SEC_HS.muted,
  },
  /* Tab 3: Leaderboard Styles */
  classLeaderboardCard: {
    backgroundColor: SEC_HS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SEC_HS.border,
    padding: 14,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  classLeaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  classLeaderboardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: SEC_HS.navy,
  },
  classLeaderboardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: SEC_HS.muted,
    marginTop: 2,
  },
  fullLeaderboardLinkText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: SEC_HS.blue,
  },
  rankList: {
    gap: 6,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEC_HS.cream,
    borderWidth: 1,
    borderColor: SEC_HS.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 10,
  },
  rankRowCurrentUser: {
    backgroundColor: SEC_HS.blueLight,
    borderColor: `${SEC_HS.blue}55`,
  },
  rankNumberText: {
    fontFamily: FONTS.consolas,
    fontSize: 12,
    fontWeight: '700',
    color: SEC_HS.muted,
    width: 22,
  },
  rankNumberTextCurrentUser: {
    color: SEC_HS.muted,
  },
  studentNameText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '500',
    color: SEC_HS.navy,
    flex: 1,
  },
  studentNameTextCurrentUser: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  pointsTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsLetterH: {
    fontFamily: FONTS.consolas,
    fontSize: 13,
    fontWeight: '700',
    color: SEC_HS.green,
  },
  pointsNumberConsolas: {
    fontFamily: FONTS.consolas,
    fontSize: 13,
    fontWeight: '700',
    color: SEC_HS.green,
  },
});

export default HabitsScreen;
