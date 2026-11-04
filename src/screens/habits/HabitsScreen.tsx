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
  } = useStudentData();

  // Real-time system calendar base
  const now = useMemo(() => new Date(), []);
  const REAL_TODAY_YEAR = now.getFullYear();
  const REAL_TODAY_MONTH = now.getMonth(); // 0-indexed (0=Jan..9=Oct)
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

  // 1. "Pindah Bagian": Reset calendar automatically when switching between Daily, Recap, or Leaderboard
  const handleTabChange = (newTab: 'daily' | 'recap' | 'leaderboard') => {
    setActiveTab(newTab);
    resetCalendarToLatest();
  };

  // 2. "Pindah Halaman": Reset calendar automatically when returning to Habits screen from another screen
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

  // Toggle habit checkbox with instant auto-save, leaderboard update & toast trigger
  const handleToggleHabit = (groupId: string, itemId: string) => {
    contextToggleHabit(selectedDateKey, groupId, itemId);
  };

  // Compute Recap Stats Dynamically across days of viewed month
  const isViewingCurrentMonth = viewYear === REAL_TODAY_YEAR && viewMonth === REAL_TODAY_MONTH;
  const daysInViewMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
  const totalElapsedDays = isViewingCurrentMonth ? REAL_TODAY_DATE : daysInViewMonth;

  // RECAP LOGIC:
  // - Category counts if AT LEAST ONE item in that category is checked (as requested)
  // - Full day = >= 5 categories checked (2 pts each)
  // - Days logged = at least 1 item checked on that day
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

      // Count categories that have at least 1 item checked on this day
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

  const isPastDay = isViewingCurrentMonth
    ? selectedDate < REAL_TODAY_DATE
    : (viewYear < REAL_TODAY_YEAR || (viewYear === REAL_TODAY_YEAR && viewMonth < REAL_TODAY_MONTH));

  const dateSubLabel = isViewingCurrentMonth && selectedDate === REAL_TODAY_DATE
    ? 'today'
    : selectedDateKey;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Habits" />

      {/* Floating Points Toast Notifications matching Screenshot 1 */}
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
        {/* Page Header Title matching Screenshots */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Daily habit checklist</Text>
        </View>

        {/* Segmented Pill Tabs matching Screenshots */}
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
            TAB 1: DAILY (Exact match to Screenshot 2)
            ============================================================== */}
        {activeTab === 'daily' && (
          <View style={styles.tabContentWrap}>
            {/* 1. Monthly Calendar Card matching Screenshot 2 */}
            <View style={styles.calendarCard}>
              {/* Month Header Navigation */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={styles.navArrowBtn}
                  onPress={handlePrevMonth}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color="#64748B" />
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
                    size={18}
                    color={isCurrentMonthOrFuture ? '#CBD5E1' : '#64748B'}
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

              {/* Real-time Dynamic Calendar Days Grid matching Screenshot 2 */}
              <View style={styles.daysGrid}>
                {monthWeeks.map((week, wIdx) => (
                  <View key={`week-${wIdx}`} style={styles.weekRow}>
                    {week.map((dateNum, dIdx) => {
                      if (dateNum === null) {
                        return <View key={`empty-${dIdx}`} style={styles.dayCellWrapper} />;
                      }

                      const isSelected = dateNum === selectedDate;
                      const isToday = isViewingCurrentMonth && dateNum === REAL_TODAY_DATE;
                      const isFuture = isViewingCurrentMonth
                        ? dateNum > REAL_TODAY_DATE
                        : (viewYear > REAL_TODAY_YEAR || (viewYear === REAL_TODAY_YEAR && viewMonth > REAL_TODAY_MONTH));
                      const dKey = formatDateKey(viewYear, viewMonth, dateNum);
                      const hasSubmission = isDateSubmitted(dKey);

                      // State 1: Selected date (Screenshot 2: e.g. 22)
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
                              {hasSubmission && <View style={styles.submissionDot} />}
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      // State 2: Has submission (Screenshot 2: e.g. 14)
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

                      // State 3: Future locked (Screenshot 2: e.g. 23..31)
                      if (isFuture) {
                        return (
                          <View key={`date-${dateNum}`} style={styles.dayCellWrapper}>
                            <View style={styles.dayCellFuture}>
                              <Text style={styles.dayTextFuture}>{dateNum}</Text>
                            </View>
                          </View>
                        );
                      }

                      // State 4: Today unselected, unsubmitted
                      if (isToday) {
                        return (
                          <TouchableOpacity
                            key={`date-${dateNum}`}
                            style={styles.dayCellWrapper}
                            onPress={() => setSelectedDate(dateNum)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.dayCellToday}>
                              <Text style={styles.dayTextToday}>{dateNum}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      // State 5: Past date not filled (Screenshot 2: e.g. 1..13, 15..21)
                      return (
                        <TouchableOpacity
                          key={`date-${dateNum}`}
                          style={styles.dayCellWrapper}
                          onPress={() => setSelectedDate(dateNum)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.dayCellPast}>
                            <Text style={styles.dayTextPast}>{dateNum}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Calendar Legend matching Screenshot 2 */}
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

            {/* 2. Checklist Progress Bar */}
            <View style={styles.checklistProgressContainer}>
              <Text style={styles.checklistProgressLabel}>Checklist progress</Text>
              <Text style={styles.checklistProgressBigText}>
                {completedItems}/{totalItems} ({progressPercent}%)
              </Text>
              <Text style={styles.checklistProgressAutoSaveText}>
                Checks save automatically. You can still edit past days.{isPastDay ? ' You are editing a past day.' : ''}
              </Text>
              <Text style={styles.checklistProgressSubMeta}>
                {activeGroupsCount}/7 habit groups · Senior track · {dateSubLabel}
              </Text>
            </View>

            {/* 3. 7 Habit Group Cards matching Screenshot 1 */}
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
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            {/* 4. Footer Disclaimer matching Screenshots */}
            <Text style={styles.footerDisclaimer}>
              Based on G7KAIH (Gerakan 7 Kebiasaan Anak Indonesia Hebat). Full-day points when ≥5 habit groups are checked.
            </Text>
          </View>
        )}

        {/* ==============================================================
            TAB 2: RECAP (Matching Latest Web Screenshot)
            ============================================================== */}
        {activeTab === 'recap' && (
          <View style={styles.tabContentWrap}>
            {/* Card 1: Month summary matching latest web screenshot */}
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

            {/* Card 2: Days per habit group matching latest web screenshot */}
            <View style={styles.recapGroupsCard}>
              <Text style={styles.recapGroupsTitle}>Days per habit group</Text>

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

            {/* Month Navigation Buttons matching Screenshot 3 */}
            <View style={styles.monthNavButtonsRow}>
              <TouchableOpacity
                style={styles.monthNavPillBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={16} color="#0F172A" />
                <Text style={styles.monthNavPillBtnText}>Prev month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.monthNavPillBtn,
                  isCurrentMonthOrFuture && styles.monthNavPillBtnDisabled,
                ]}
                onPress={handleNextMonth}
                activeOpacity={0.7}
                disabled={isCurrentMonthOrFuture}
              >
                <Text
                  style={[
                    styles.monthNavPillBtnText,
                    isCurrentMonthOrFuture && styles.monthNavPillBtnTextDisabled,
                  ]}
                >
                  Next month
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isCurrentMonthOrFuture ? '#94A3B8' : '#0F172A'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ==============================================================
            TAB 3: LEADERBOARD (Exact match to Screenshot 1)
            ============================================================== */}
        {activeTab === 'leaderboard' && (
          <View style={styles.tabContentWrap}>
            <View style={styles.classLeaderboardCard}>
              {/* Header Row: Title & Link to Full Leaderboard */}
              <View style={styles.classLeaderboardHeader}>
                <View>
                  <Text style={styles.classLeaderboardTitle}>Class habits points</Text>
                  <Text style={styles.classLeaderboardSubtitle}>S4 Oxford</Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('BoardTab')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fullLeaderboardLinkText}>Full leaderboard →</Text>
                </TouchableOpacity>
              </View>

              {/* Class Ranking List matching Screenshot 3 */}
              <View style={styles.rankList}>
                {classHabitsLeaderboard.slice(0, 8).map((student) => {
                  const hPoints = student.isCurrent ? studentProfile.habitsPts : (student.habitsPts ?? student.points ?? 0);
                  return (
                    <View
                      key={student.name}
                      style={[styles.rankRow, student.isCurrent && styles.rankRowCurrentUser]}
                    >
                      <Text
                        style={[
                          styles.rankNumberText,
                          student.isCurrent && styles.rankNumberTextCurrentUser,
                        ]}
                      >
                        {student.rank}
                      </Text>
                      <Text
                        style={[
                          styles.studentNameText,
                          student.isCurrent && styles.studentNameTextCurrentUser,
                        ]}
                        numberOfLines={1}
                      >
                        {student.name}
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
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 108,
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
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0,
  },
  /* Segmented Pill Tabs */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F5EE',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#475569',
  },
  tabBtnTextActive: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabContentWrap: {
    gap: 12,
  },
  /* Monthly Calendar Card matching Screenshot 2 */
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navArrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  navArrowBtnDisabled: {
    opacity: 0.4,
  },
  monthTitleText: {
    fontFamily: FONTS.title,
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekdayText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#475569',
    width: '14.28%',
    textAlign: 'center',
  },
  daysGrid: {
    gap: 8,
    marginBottom: 8,
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
  /* State 1: Selected date (Screenshot 2: e.g. 22) */
  dayCellSelected: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTextSelected: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  /* State 2: Has submission (Screenshot 2: e.g. 14) */
  dayCellSubmission: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTextSubmission: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  /* State 3: Future locked (Screenshot 2: e.g. 23..31) */
  dayCellFuture: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTextFuture: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#94A3B8',
  },
  /* State 4: Today unselected unsubmitted */
  dayCellToday: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTextToday: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  /* State 5: Past not filled (Screenshot 2: e.g. 1..13, 15..21) */
  dayCellPast: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dayTextPast: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#475569',
  },
  submissionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
    marginTop: 2,
  },
  legendDivider: {
    height: 1,
    backgroundColor: '#F5F3EF',
    marginVertical: 14,
  },
  legendTitle: {
    fontFamily: FONTS.title,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  legendGrid: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  legendBoxSelected: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  legendBoxSubmission: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  legendBoxPast: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
  },
  legendTextFutureNum: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#94A3B8',
    width: 18,
    textAlign: 'center',
  },
  legendLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#475569',
  },
  /* Checklist Progress Summary */
  checklistProgressContainer: {
    marginBottom: 8,
  },
  checklistProgressLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  checklistProgressBigText: {
    fontFamily: FONTS.title,
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  checklistProgressAutoSaveText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#475569',
    marginBottom: 2,
  },
  checklistProgressSubMeta: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
  },
  /* Habit Group Card */
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
    ...SHADOWS.sm,
    gap: 8,
  },
  habitCardActive: {
    borderColor: '#86EFAC',
  },
  habitCardTitle: {
    fontFamily: FONTS.title,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  habitCardTitleCompleted: {
    color: '#166534',
  },
  habitItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  habitItemRowChecked: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  habitItemLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
  },
  habitItemLabelChecked: {
    color: '#0F172A',
  },
  circularCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  circularCheckActive: {
    backgroundColor: '#1E6548',
    borderColor: '#1E6548',
    borderWidth: 0,
  },
  footerDisclaimer: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  /* Tab 2: Recap Styles matching latest web screenshot */
  recapSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  recapSummaryTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14.5,
    color: '#64748B',
    marginBottom: 12,
  },
  recapTilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  recapTile: {
    flex: 1,
    backgroundColor: '#F8F5EE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapTileNumber: {
    fontFamily: FONTS.title,
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  recapTileLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  recapRuleText: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  recapGroupsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  recapGroupsTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  recapGroupRow: {
    marginBottom: 16,
  },
  recapGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recapGroupName: {
    fontFamily: FONTS.title,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recapGroupScore: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#64748B',
  },
  recapProgressBarTrack: {
    height: 6,
    backgroundColor: '#F5F0E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  recapProgressBarFill: {
    height: 6,
    backgroundColor: '#1E6548',
    borderRadius: 3,
  },
  monthNavButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  monthNavPillBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  monthNavPillBtnDisabled: {
    opacity: 0.9,
  },
  monthNavPillBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  monthNavPillBtnTextDisabled: {
    fontFamily: FONTS.medium,
    color: '#94A3B8',
  },
  /* Tab 3: Leaderboard Styles matching Screenshot 1 */
  classLeaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  classLeaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  classLeaderboardTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  classLeaderboardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#64748B',
  },
  fullLeaderboardLinkText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  rankList: {
    gap: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rankRowCurrentUser: {
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
  },
  rankNumberText: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#64748B',
    width: 28,
  },
  rankNumberTextCurrentUser: {
    fontFamily: FONTS.bold,
    color: '#475569',
  },
  studentNameText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#0F172A',
    flex: 1,
  },
  studentNameTextCurrentUser: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  pointsTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsLetterH: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  pointsNumberConsolas: {
    fontFamily: FONTS.consolas,
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.5,
  },
});

export default HabitsScreen;
