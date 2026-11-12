import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { FONTS, SHADOWS } from '../../constants/theme';
import { HabitDayRecord, HabitCategoryItem } from '../../types';
import AppHeader from '../../components/navigation/AppHeader';
import PointsToast from '../../components/common/PointsToast';
import { useStudentData } from '../../context/StudentDataContext';
import { api } from '../../services/api';

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

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const HABIT_FULL_DAY_THRESHOLD = 5;

// Pick default active date matching Web LMS
function pickDefaultDate(daysList: HabitDayRecord[], todayStr: string): string {
  if (daysList.some((d) => d.record_date === todayStr)) return todayStr;
  const pastOrToday = daysList.filter((d) => d.record_date <= todayStr);
  return pastOrToday[pastOrToday.length - 1]?.record_date ?? daysList[0]?.record_date ?? todayStr;
}

// Shift yearMonth string by delta months matching Web LMS
function shiftYearMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Month title formatting matching Web LMS
function monthTitle(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

// Sunday-first calendar cells for YYYY-MM month matching Web LMS
function buildCalendarCells(ym: string): (string | null)[] {
  const [y, m] = ym.split('-').map(Number);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0=Sun
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) {
    cells.push(`${ym}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const HabitsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scrollRef = useRef<any>(null);

  // Scroll to top when tab or focus changes
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

  const { toastList, dismissToast, showToast } = useStudentData();

  // 100% Web LMS Model States
  const [tab, setTab] = useState<'daily' | 'recap' | 'leaderboard'>('daily');
  const [yearMonth, setYearMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [today, setToday] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [track, setTrack] = useState<'smp' | 'sma'>('sma');
  const [categories, setCategories] = useState<HabitCategoryItem[]>([]);
  const [days, setDays] = useState<HabitDayRecord[]>([]);
  const [pointsPerFullDay, setPointsPerFullDay] = useState<number>(2);
  const [loadingMonth, setLoadingMonth] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Debouncing refs for server sync (500ms matching Web LMS)
  const debounceRef = useRef<any>(null);
  const pendingRef = useRef<{
    categoryId: string;
    itemLabel: string;
    checked: boolean;
    recordDate: string;
  } | null>(null);

  // Leaderboard tab state
  const [lbRows, setLbRows] = useState<any[] | null>(null);
  const [lbMyId, setLbMyId] = useState<number | null>(null);
  const [lbClassName, setLbClassName] = useState<string | null>(null);
  const [lbLoading, setLbLoading] = useState<boolean>(false);
  const lbFetchedRef = useRef<boolean>(false);

  // Date and edit boundary checks
  const currentYm = today.slice(0, 7);
  const canGoNextMonth = shiftYearMonth(yearMonth, 1) <= currentYm;

  const selectedDay = useMemo(() => {
    return days.find((d) => d.record_date === selectedDate);
  }, [days, selectedDate]);

  const isPastDay = selectedDate < today;
  const isFutureDate = selectedDate > today;
  const canEdit = selectedDate <= today;

  const itemTotal = useMemo(() => {
    return categories.reduce((sum, c) => sum + c.items.length, 0);
  }, [categories]);

  const itemChecked = useMemo(() => {
    return selectedDay?.items.filter((i) => i.is_checked).length ?? 0;
  }, [selectedDay]);

  const itemPct = itemTotal > 0 ? Math.round((itemChecked / itemTotal) * 100) : 0;

  const dayByDate = useMemo(() => {
    const map = new Map<string, HabitDayRecord>();
    for (const d of days) map.set(d.record_date, d);
    return map;
  }, [days]);

  const calendarCells = useMemo(() => buildCalendarCells(yearMonth), [yearMonth]);

  // Load habit records for a month matching Web LMS loadMonth
  const loadMonth = useCallback(
    async (ym: string, preferDate?: string) => {
      setLoadingMonth(true);
      try {
        const data = await api.habits.getMonth(ym);
        if (data && Array.isArray(data.days)) {
          setYearMonth(data.yearMonth || ym);
          if (data.today) setToday(data.today);
          if (data.track) setTrack(data.track);
          if (Array.isArray(data.categories)) setCategories(data.categories);
          setDays(data.days);
          if (typeof data.pointsPerFullDay === 'number') {
            setPointsPerFullDay(data.pointsPerFullDay);
          }

          const serverToday = data.today || today;
          const next =
            preferDate && data.days.some((d: HabitDayRecord) => d.record_date === preferDate)
              ? preferDate
              : pickDefaultDate(data.days, serverToday);
          setSelectedDate(next);
        }
      } catch (err: any) {
        console.warn('[Habits Load Month Error]', err?.message || err);
        showToast(err?.message || 'Failed to load month', 'error');
      } finally {
        setLoadingMonth(false);
      }
    },
    [today, showToast]
  );

  // Initial mount load
  useEffect(() => {
    loadMonth(yearMonth);
  }, []);

  // Fetch class habits leaderboard
  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const data = await api.leaderboard.getClass();
      if (data && Array.isArray(data.rows)) {
        setLbRows(data.rows);
        setLbMyId(Number(data.myStudentId) || null);
        setLbClassName(data.className ?? null);
      }
    } catch (err: any) {
      console.warn('[Leaderboard Load Error]', err?.message || err);
    } finally {
      setLbLoading(false);
    }
  }, []);

  // Load leaderboard when tab switches
  useEffect(() => {
    if (tab !== 'leaderboard' || lbFetchedRef.current) return;
    lbFetchedRef.current = true;
    fetchLeaderboard();
  }, [tab, fetchLeaderboard]);

  // Sorted leaderboard rows matching Web LMS
  const sortedLb = useMemo(() => {
    if (!lbRows) return [];
    return [...lbRows].sort(
      (a, b) =>
        (Number(b.habits_pts) || 0) - (Number(a.habits_pts) || 0) ||
        (Number(b.total_points) || 0) - (Number(a.total_points) || 0)
    );
  }, [lbRows]);

  // Pure Pull-to-Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadMonth(yearMonth, selectedDate),
        tab === 'leaderboard' ? fetchLeaderboard() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [yearMonth, selectedDate, tab, loadMonth, fetchLeaderboard]);

  // Direct isItemChecked helper matching Web LMS
  function isItemChecked(day: HabitDayRecord | undefined, categoryId: string, itemLabel: string): boolean {
    return Boolean(
      day?.items.find(
        (i) => i.category_id === categoryId && i.item_label === itemLabel && i.is_checked
      )
    );
  }

  // Check if category has any completed items for active day matching Web LMS
  function catDoneSelected(categoryId: string): boolean {
    return Boolean(
      selectedDay?.items.some((i) => i.category_id === categoryId && i.is_checked)
    );
  }

  // Optimistic local toggle update matching Web LMS applyLocalToggle
  function applyLocalToggle(
    date: string,
    categoryId: string,
    itemLabel: string,
    checked: boolean
  ): HabitDayRecord[] {
    return days.map((day) => {
      if (day.record_date !== date) return day;
      const items = [...day.items];
      const idx = items.findIndex(
        (i) => i.category_id === categoryId && i.item_label === itemLabel
      );
      if (idx >= 0) {
        items[idx] = { ...items[idx], is_checked: checked };
      } else {
        items.push({
          id: -Date.now(),
          category_id: categoryId,
          item_label: itemLabel,
          is_checked: checked,
        });
      }
      const doneCats = new Set(
        items.filter((i) => i.is_checked).map((i) => i.category_id)
      );
      const categories_done = doneCats.size;
      return {
        ...day,
        items,
        categories_done,
        points: categories_done >= HABIT_FULL_DAY_THRESHOLD ? pointsPerFullDay : 0,
      };
    });
  }

  // Handle item toggle with optimistic update and 500ms debounce matching Web LMS
  function handleToggle(categoryId: string, itemLabel: string) {
    if (!canEdit) {
      showToast('Cannot edit future dates', 'error');
      return;
    }
    const currently = isItemChecked(selectedDay, categoryId, itemLabel);
    const next = !currently;
    const date = selectedDate;

    setDays(applyLocalToggle(date, categoryId, itemLabel, next));
    pendingRef.current = { categoryId, itemLabel, checked: next, recordDate: date };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const pending = pendingRef.current;
      if (!pending) return;
      try {
        const data = await api.habits.toggleHabit(
          pending.recordDate,
          pending.categoryId,
          pending.itemLabel,
          pending.checked
        );

        setDays((prev) =>
          prev.map((d) => {
            if (d.record_date !== pending.recordDate) return d;
            const items = [...d.items];
            const idx = items.findIndex(
              (i) => i.category_id === data.categoryId && i.item_label === data.itemLabel
            );
            if (idx >= 0) {
              items[idx] = { ...items[idx], is_checked: data.isChecked };
            } else {
              items.push({
                id: Date.now(),
                category_id: data.categoryId,
                item_label: data.itemLabel,
                is_checked: data.isChecked,
              });
            }
            return {
              ...d,
              id: data.recordId,
              items,
              categories_done: data.categoriesDone,
              points: data.points,
            };
          })
        );

        if (
          data.categoriesDone >= HABIT_FULL_DAY_THRESHOLD &&
          data.points > 0 &&
          pending.checked
        ) {
          showToast(`+${data.points} pts · Habit full day`);
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to save', 'error');
        void loadMonth(yearMonth, selectedDate);
      }
    }, 500);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Recap statistics computation matching Web LMS
  const pastOrTodayDays = useMemo(() => {
    return days.filter((d) => d.record_date <= today);
  }, [days, today]);

  const fullDays = useMemo(() => {
    return pastOrTodayDays.filter((d) => d.categories_done >= HABIT_FULL_DAY_THRESHOLD).length;
  }, [pastOrTodayDays]);

  const monthPoints = useMemo(() => {
    return pastOrTodayDays.reduce((s, d) => s + (d.points || 0), 0);
  }, [pastOrTodayDays]);

  const daysWithAny = useMemo(() => {
    return pastOrTodayDays.filter((d) => d.items.some((i) => i.is_checked)).length;
  }, [pastOrTodayDays]);

  const categoryCounts = useMemo(() => {
    return categories.map((cat) => ({
      id: cat.id,
      label: cat.label,
      days: pastOrTodayDays.filter((d) =>
        d.items.some((i) => i.category_id === cat.id && i.is_checked)
      ).length,
    }));
  }, [categories, pastOrTodayDays]);

  const totalElapsedDays = pastOrTodayDays.length;

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[SEC_HS.navy]}
            tintColor={SEC_HS.navy}
          />
        }
      >
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Daily habit checklist</Text>
        </View>

        {/* Segmented Tabs (Daily, Recap, Leaderboard) matching Web LMS */}
        <View style={styles.tabContainer}>
          {(
            [
              { id: 'daily' as const, label: 'Daily' },
              { id: 'recap' as const, label: 'Recap' },
              { id: 'leaderboard' as const, label: 'Leaderboard' },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setTab(t.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================= */}
        {/* TAB 1: DAILY CHECKLIST & CALENDAR                         */}
        {/* ========================================================= */}
        {tab === 'daily' && (
          <View style={styles.tabContentWrap}>
            {/* Monthly Calendar Card */}
            <View style={styles.calendarCard}>
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={[styles.navArrowBtn, loadingMonth && styles.navArrowBtnDisabled]}
                  disabled={loadingMonth}
                  onPress={() => loadMonth(shiftYearMonth(yearMonth, -1))}
                  activeOpacity={0.7}
                  accessibilityLabel="Previous month"
                >
                  <Ionicons name="chevron-back" size={16} color={SEC_HS.navy} />
                </TouchableOpacity>

                <Text style={styles.monthTitleText}>{monthTitle(yearMonth)}</Text>

                <TouchableOpacity
                  style={[
                    styles.navArrowBtn,
                    (loadingMonth || !canGoNextMonth) && styles.navArrowBtnDisabled,
                  ]}
                  disabled={loadingMonth || !canGoNextMonth}
                  onPress={() => loadMonth(shiftYearMonth(yearMonth, 1))}
                  activeOpacity={0.7}
                  accessibilityLabel="Next month"
                >
                  <Ionicons name="chevron-forward" size={16} color={SEC_HS.navy} />
                </TouchableOpacity>
              </View>

              {/* Day of week headers */}
              <View style={styles.weekdaysRow}>
                {DOW.map((d) => (
                  <Text key={d} style={styles.weekdayText}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* 7-column calendar cells grid matching Web LMS */}
              <View style={styles.calendarCellsGrid}>
                {calendarCells.map((dateStr, idx) => {
                  if (!dateStr) {
                    return <View key={`pad-${idx}`} style={styles.dayCellWrapper} />;
                  }
                  const day = dayByDate.get(dateStr);
                  const dayNum = Number(dateStr.slice(-2));
                  const isSelected = dateStr === selectedDate;
                  const isFuture = dateStr > today;
                  const hasChecks = day?.items.some((i) => i.is_checked) ?? false;
                  const isFull = (day?.categories_done ?? 0) >= HABIT_FULL_DAY_THRESHOLD;
                  const isPastEmpty = dateStr < today && !hasChecks;

                  return (
                    <View key={dateStr} style={styles.dayCellWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.dayCellBase,
                          isSelected && styles.dayCellSelected,
                          !isSelected && (isFull || hasChecks) && styles.dayCellSubmission,
                          !isSelected && !isFull && !hasChecks && isPastEmpty && styles.dayCellPast,
                          !isSelected && isFuture && styles.dayCellFuture,
                        ]}
                        disabled={isFuture || loadingMonth}
                        onPress={() => setSelectedDate(dateStr)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayTextBase,
                            isSelected && styles.dayTextSelected,
                            !isSelected && (isFull || hasChecks) && styles.dayTextSubmission,
                            !isSelected && !isFull && !hasChecks && isPastEmpty && styles.dayTextPast,
                            !isSelected && isFuture && styles.dayTextFuture,
                          ]}
                        >
                          {dayNum}
                        </Text>
                        {(isFull || hasChecks) && !isFuture ? (
                          <View style={styles.submissionDot} />
                        ) : (
                          <View style={styles.dotPlaceholder} />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
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

            {/* Checklist Progress Summary matching Web LMS */}
            <View style={styles.checklistProgressContainer}>
              <Text style={styles.checklistProgressLabel}>Checklist progress</Text>
              <Text style={styles.checklistProgressBigText}>
                {itemChecked}/{itemTotal} ({itemPct}%)
              </Text>
              <Text style={styles.checklistProgressAutoSaveText}>
                Checks save automatically. You can still edit past days.
                {isPastDay ? ' You are editing a past day.' : ''}
              </Text>
              <Text style={styles.checklistProgressSubMeta}>
                {selectedDay?.categories_done ?? 0}/7 habit groups · {track === 'sma' ? 'Senior' : 'Middle'} track ·{' '}
                {selectedDate === today ? 'today' : selectedDate}
              </Text>
            </View>

            {/* Checklist Category Cards — 100% Web LMS Categories & Items */}
            {loadingMonth && categories.length === 0 ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={SEC_HS.navy} />
                <Text style={styles.loadingText}>Loading habits...</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.habitListWrap,
                  !canEdit && styles.habitListDisabled,
                ]}
                pointerEvents={canEdit ? 'auto' : 'none'}
              >
                {categories.map((cat) => {
                  const done = catDoneSelected(cat.id);
                  return (
                    <View
                      key={cat.id}
                      style={[styles.habitCard, done && styles.habitCardActive]}
                    >
                      <Text
                        style={[
                          styles.habitCardTitle,
                          done && styles.habitCardTitleCompleted,
                        ]}
                      >
                        {cat.label}
                        {done ? ' ✓' : ''}
                      </Text>
                      <View style={styles.habitCardItemsCol}>
                        {cat.items.map((item) => {
                          const on = isItemChecked(selectedDay, cat.id, item);
                          return (
                            <TouchableOpacity
                              key={item}
                              style={[
                                styles.habitItemRow,
                                on && styles.habitItemRowChecked,
                              ]}
                              onPress={() => handleToggle(cat.id, item)}
                              activeOpacity={0.7}
                              disabled={!canEdit}
                            >
                              <Text
                                style={[
                                  styles.habitItemLabel,
                                  on && styles.habitItemLabelChecked,
                                ]}
                              >
                                {item}
                              </Text>
                              <View
                                style={[
                                  styles.circularCheck,
                                  on && styles.circularCheckActive,
                                ]}
                              >
                                {on && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Footer Disclaimer */}
            <Text style={styles.footerDisclaimer}>
              Self-reported daily checklist is an honor system. Points are verified periodically by your class teacher.
            </Text>
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RECAP VIEW                                         */}
        {/* ========================================================= */}
        {tab === 'recap' && (
          <View style={styles.tabContentWrap}>
            {/* Card 1: Month Summary (3 Tiles) */}
            <View style={styles.recapSummaryCard}>
              <Text style={styles.recapSummaryTitle}>
                Month summary · {monthTitle(yearMonth)}
              </Text>
              <View style={styles.recapTilesRow}>
                <View style={styles.recapTile}>
                  <Text style={styles.recapTileNumber}>{fullDays}</Text>
                  <Text style={styles.recapTileLabel}>Full days</Text>
                </View>
                <View style={styles.recapTile}>
                  <Text style={styles.recapTileNumber}>{monthPoints}</Text>
                  <Text style={styles.recapTileLabel}>Month pts</Text>
                </View>
                <View style={styles.recapTile}>
                  <Text style={styles.recapTileNumber}>{daysWithAny}</Text>
                  <Text style={styles.recapTileLabel}>Days logged</Text>
                </View>
              </View>

              <Text style={styles.recapRuleText}>
                Full day = ≥5 categories checked (2 pts each).
              </Text>
            </View>

            {/* Card 2: Days per habit group matching Web LMS */}
            <View style={styles.recapGroupsCard}>
              <Text style={styles.recapGroupsTitle}>Days per habit group</Text>

              <View style={styles.recapGroupsList}>
                {categoryCounts.map((cat) => {
                  const completedDays = cat.days;
                  const progressRatio = totalElapsedDays > 0 ? Math.min(1, completedDays / totalElapsedDays) : 0;

                  return (
                    <View key={cat.id} style={styles.recapGroupRow}>
                      <View style={styles.recapGroupHeader}>
                        <Text style={styles.recapGroupName}>{cat.label}</Text>
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
                onPress={() => loadMonth(shiftYearMonth(yearMonth, -1))}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={15} color={SEC_HS.navy} />
                <Text style={styles.monthNavOutlineBtnText}>Previous month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.monthNavOutlineBtn,
                  !canGoNextMonth && styles.monthNavOutlineBtnDisabled,
                ]}
                onPress={() => loadMonth(shiftYearMonth(yearMonth, 1))}
                disabled={!canGoNextMonth}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.monthNavOutlineBtnText,
                    !canGoNextMonth && styles.monthNavOutlineBtnTextDisabled,
                  ]}
                >
                  Next month
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={!canGoNextMonth ? SEC_HS.muted : SEC_HS.navy}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LEADERBOARD VIEW                                   */}
        {/* ========================================================= */}
        {tab === 'leaderboard' && (
          <View style={styles.tabContentWrap}>
            <View style={styles.classLeaderboardCard}>
              <View style={styles.classLeaderboardHeader}>
                <View>
                  <Text style={styles.classLeaderboardTitle}>Class Habits Leaderboard</Text>
                  <Text style={styles.classLeaderboardSubtitle}>
                    {lbClassName || 'All students in your class'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('BoardTab' as never, { initialTab: 'class' } as never)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fullLeaderboardLinkText}>Full Leaderboard →</Text>
                </TouchableOpacity>
              </View>

              {lbLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={SEC_HS.navy} />
                  <Text style={styles.loadingText}>Loading class ranking...</Text>
                </View>
              ) : sortedLb.length === 0 ? (
                <Text style={styles.emptyStateText}>No habit points recorded yet this term.</Text>
              ) : (
                <View style={styles.rankList}>
                  {sortedLb.map((student, idx) => {
                    const isCurrent = lbMyId ? student.student_id === lbMyId : false;
                    return (
                      <View
                        key={student.student_id || idx}
                        style={[styles.rankRow, isCurrent && styles.rankRowCurrentUser]}
                      >
                        <Text style={[styles.rankNumberText, isCurrent && styles.rankNumberTextCurrentUser]}>
                          #{idx + 1}
                        </Text>
                        <Text
                          style={[
                            styles.studentNameText,
                            isCurrent && styles.studentNameTextCurrentUser,
                          ]}
                          numberOfLines={1}
                        >
                          {student.full_name}
                          {isCurrent ? ' (You)' : ''}
                        </Text>
                        <View style={styles.pointsTextWrap}>
                          <Text style={styles.pointsLetterH}>H </Text>
                          <Text style={styles.pointsNumberConsolas}>{student.habits_pts || 0} pts</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
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
    paddingBottom: 110,
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
  /* Segmented Tabs */
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
  calendarCellsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  dayCellWrapper: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCellBase: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayCellSelected: {
    borderWidth: 1.5,
    borderColor: SEC_HS.blue,
    backgroundColor: SEC_HS.blueLight,
  },
  dayCellSubmission: {
    backgroundColor: SEC_HS.greenLight,
  },
  dayCellFuture: {
    backgroundColor: 'transparent',
  },
  dayCellPast: {
    borderWidth: 1.5,
    borderColor: SEC_HS.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  dayTextBase: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '500',
    color: SEC_HS.navy,
  },
  dayTextSelected: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: SEC_HS.blueDark,
  },
  dayTextSubmission: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: SEC_HS.greenDark,
  },
  dayTextFuture: {
    color: 'rgba(28,25,23,0.28)',
  },
  dayTextPast: {
    color: SEC_HS.muted,
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
  loadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SEC_HS.muted,
  },
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
  emptyStateText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: SEC_HS.muted,
    paddingVertical: 12,
    textAlign: 'center',
  },
});

export default HabitsScreen;
