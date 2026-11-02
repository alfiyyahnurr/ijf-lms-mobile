import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  StudentProfile,
  LeaderboardStudent,
  LeaderboardHouse,
  HabitGroup,
  ToastNotification,
  PointHistoryItem,
  Course,
  Assignment,
  Quiz,
  ExamItem,
  SubjectGrade,
  WeeklyPlanSession,
  LiteracyEntry,
  Announcement,
} from '../types';

import {
  STUDENT_PROFILE,
  LEADERBOARD_CLASS,
  LEADERBOARD_HOUSES,
  LEADERBOARD_JENJANG,
  HABIT_GROUPS_INITIAL,
  COURSES_DATA,
  ASSIGNMENTS_DATA,
  QUIZZES_DATA,
  EXAMS_DATA,
  GRADES_DATA,
  ANNOUNCEMENTS_DATA,
  INITIAL_LITERACY_ENTRIES,
  DUMMY_LITERACY_ENTRIES,
  getCourseSessions,
  getCourseSessionDetail,
  getWeeklyPlanForWeek,
} from '../data/mockData';

// Helper to format consistent date key: YYYY-MM-DD
export const formatDateKey = (year: number, month: number, day: number): string => {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Fixed static historical habit submissions from October 2026
// Oct 14: Full day completed with 6 categories (17 items checked: rise-early, worship, exercise, eat-well, love-learning, community; sleep-early unchecked)
// Oct 13: Only Worship checked once (so Worship total is 2/22, while other groups are 1/22, matching reference)
// Oct 15: Partial day (Rise Early checked, 0 points)
const HISTORICAL_HABITS_OCTOBER: Record<string, HabitGroup[]> = {
  // Oct 14: Full day completed with 6 active categories (earns 2 points)
  '2026-10-14': HABIT_GROUPS_INITIAL.map((g) => ({
    ...g,
    items: g.items.map((i) => ({
      ...i,
      checked: g.id !== 'sleep-early',
    })),
  })),

  // Oct 13: Only 1 prayer checked (Worship = 2/22, but NOT a full day)
  '2026-10-13': HABIT_GROUPS_INITIAL.map((g) => ({
    ...g,
    items: g.items.map((i, idx) => ({
      ...i,
      checked: g.id === 'worship' && idx === 0,
    })),
  })),

  // Oct 15: Partial day (Rise Early checked)
  '2026-10-15': HABIT_GROUPS_INITIAL.map((g) => ({
    ...g,
    items: g.items.map((i, idx) => ({
      ...i,
      checked: g.id === 'rise-early' && idx === 0,
    })),
  })),
};

const generateInitialHabitsByDate = (todayKey: string): Record<string, HabitGroup[]> => {
  const data: Record<string, HabitGroup[]> = {
    ...HISTORICAL_HABITS_OCTOBER,
  };

  // Ensure today's date starts cleanly initialized if not already in historical records
  if (!data[todayKey]) {
    data[todayKey] = HABIT_GROUPS_INITIAL.map((g) => ({
      ...g,
      items: g.items.map((i) => ({ ...i, checked: false })),
    }));
  }

  return data;
};

// Permanent static historical points & awarded dates
const INITIAL_AWARDED_DATES: string[] = ['2026-10-14'];
const INITIAL_HABIT_PTS = 2; // +2 earned from Oct 14 Full Day
const INITIAL_POINTS_HISTORY: PointHistoryItem[] = [
  {
    id: 'pt_partial_2026-10-15',
    title: 'Habit partial day',
    date: 'October 15, 2026',
    points: 0,
  },
  {
    id: 'pt_2026-10-14',
    title: 'Habit full day (≥5 categories checked)',
    date: 'October 14, 2026',
    points: 2,
  },
  {
    id: 'pt_partial_2026-10-13',
    title: 'Habit partial day',
    date: 'October 13, 2026',
    points: 0,
  },
];

interface StudentDataContextType {
  // Profile & Points
  studentProfile: StudentProfile;
  pointsHistory: PointHistoryItem[];
  addHabitPoints: (dateKey: string) => void;
  revokeHabitPoints: (dateKey: string) => void;

  // Leaderboard
  classLeaderboard: LeaderboardStudent[];
  houseLeaderboard: LeaderboardHouse[];
  jenjangLeaderboard: LeaderboardStudent[];

  // Habits State
  habitsByDate: Record<string, HabitGroup[]>;
  toggleHabit: (dateKey: string, groupId: string, itemId: string) => void;
  isDateSubmitted: (dateKey: string) => boolean;

  // Toast Notifications
  toastList: ToastNotification[];
  showToast: (message: string, points?: number) => void;
  dismissToast: (id: string) => void;

  // Courses & Academic Data (API-ready getters)
  courses: Course[];
  assignments: Assignment[];
  quizzes: Quiz[];
  exams: ExamItem[];
  grades: SubjectGrade[];
  announcements: Announcement[];
  literacyEntries: LiteracyEntry[];
  addLiteracyEntry: (entry: LiteracyEntry) => void;
  updateLiteracyEntry: (id: string | number, updated: Partial<LiteracyEntry>) => void;
  deleteLiteracyEntry: (id: string | number) => void;
  loadSampleLiteracyEntry: () => void;
  loadAllMockLiteracyEntries: () => void;
  clearLiteracyEntries: () => void;
  getSessions: (courseId: number, courseName: string, total: number) => any;
  getSessionDetail: (session: any, course?: Course) => any;
  getWeeklyPlan: (weekStart: string) => WeeklyPlanSession[];
  // Async status & Refresh
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  errorMessage: string | null;
  refreshAllData: () => Promise<void>;
  setIsError: (val: boolean) => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const now = useMemo(() => new Date(), []);
  const REAL_TODAY_YEAR = now.getFullYear();
  const REAL_TODAY_MONTH = now.getMonth();
  const REAL_TODAY_DATE = now.getDate();
  const todayKey = useMemo(
    () => formatDateKey(REAL_TODAY_YEAR, REAL_TODAY_MONTH, REAL_TODAY_DATE),
    [REAL_TODAY_YEAR, REAL_TODAY_MONTH, REAL_TODAY_DATE]
  );

  // Async Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshAllData = async () => {
    setIsRefreshing(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      // Smooth simulation of network data sync
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err?.message || 'Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 1. Habits Per Date State (anchored to static October historical data, with today empty)
  const [habitsByDate, setHabitsByDate] = useState<Record<string, HabitGroup[]>>(() =>
    generateInitialHabitsByDate(todayKey)
  );

  // Track dates that have already been awarded points for Full Day (initially only Oct 14)
  const [awardedDates, setAwardedDates] = useState<string[]>(INITIAL_AWARDED_DATES);

  // Dynamic points history list (starts with static historical logs from Oct 13, 14, 15)
  const [pointsHistory, setPointsHistory] = useState<PointHistoryItem[]>(INITIAL_POINTS_HISTORY);

  // Student Profile State (starts with previous points: habitsPts = 2 from Oct 14)
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => ({
    ...STUDENT_PROFILE,
    habitsPts: INITIAL_HABIT_PTS,
    points: STUDENT_PROFILE.points + INITIAL_HABIT_PTS,
  }));

  // Class Leaderboard State (Fatih starts with previous points and placed at Rank 1)
  const [classLeaderboard, setClassLeaderboard] = useState<LeaderboardStudent[]>(() => {
    const updated = LEADERBOARD_CLASS.map((student) => {
      if (student.isCurrent) {
        return { ...student, points: INITIAL_HABIT_PTS };
      }
      return student;
    });
    return [...updated]
      .sort((a, b) => b.points - a.points)
      .map((s, idx) => ({ ...s, rank: idx + 1 }));
  });

  // Jenjang Leaderboard State (Fatih starts with previous points and placed at Rank 1)
  const [jenjangLeaderboard, setJenjangLeaderboard] = useState<LeaderboardStudent[]>(() => {
    const updated = LEADERBOARD_JENJANG.map((student) => {
      if (student.isCurrent) {
        return { ...student, points: INITIAL_HABIT_PTS };
      }
      return student;
    });
    return [...updated]
      .sort((a, b) => b.points - a.points)
      .map((s, idx) => ({ ...s, rank: idx + 1 }));
  });

  // Toast Notifications State
  const [toastList, setToastList] = useState<ToastNotification[]>([]);

  const showToast = (message: string, points?: number) => {
    const newToast: ToastNotification = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'points',
      points: points || 2,
      message,
      duration: 4000,
    };
    setToastList((prev) => [newToast, ...prev.slice(0, 2)]);
  };

  const dismissToast = (id: string) => {
    setToastList((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper: check if a date has any checked habits
  const isDateSubmitted = (dKey: string): boolean => {
    const groups = habitsByDate[dKey];
    if (!groups) return false;
    return groups.some((g) => g.items.some((i) => i.checked));
  };

  // Award +2 points when user completes Full Day on dateKey
  const addHabitPoints = (dateKey: string) => {
    if (awardedDates.includes(dateKey)) return;

    setAwardedDates((prev) => [...prev, dateKey]);

    // Format date for history (e.g. October 22, 2026)
    const parts = dateKey.split('-');
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = MONTH_NAMES[monthIdx] || 'October';
    const day = parseInt(parts[2], 10);
    const dateFormatted = `${monthName} ${day}, ${parts[0]}`;

    // 1. Update pointsHistory
    setPointsHistory((prev) => [
      {
        id: `pt_${dateKey}`,
        title: 'Habit full day (≥5 categories checked)',
        date: dateFormatted,
        points: 2,
      },
      ...prev.filter((p) => p.id !== `pt_${dateKey}`),
    ]);

    // 2. Update Student Profile
    setStudentProfile((prev) => {
      const newHabitsPts = prev.habitsPts + 2;
      const newTotal = prev.points + 2;
      return {
        ...prev,
        habitsPts: newHabitsPts,
        points: newTotal,
      };
    });

    // 3. Update Class Leaderboard (Fatih (you) points & re-sort)
    setClassLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          return { ...student, points: student.points + 2 };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    // 4. Update Jenjang Leaderboard (Fatih (you) points & re-sort)
    setJenjangLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          return { ...student, points: student.points + 2 };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    // 5. Trigger Toast Notification (concise 1-2 words)
    showToast('+2 pts · Full day', 2);
  };

  // Revoke points if user unchecks items below 5 categories
  const revokeHabitPoints = (dateKey: string) => {
    if (!awardedDates.includes(dateKey)) return;

    setAwardedDates((prev) => prev.filter((d) => d !== dateKey));

    // Remove from pointsHistory
    setPointsHistory((prev) => prev.filter((p) => p.id !== `pt_${dateKey}`));

    setStudentProfile((prev) => ({
      ...prev,
      habitsPts: Math.max(0, prev.habitsPts - 2),
      points: Math.max(0, prev.points - 2),
    }));

    setClassLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          return { ...student, points: Math.max(0, student.points - 2) };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    setJenjangLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          return { ...student, points: Math.max(0, student.points - 2) };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });
  };

  // Toggle habit checkbox with auto-check for Full Day points
  const toggleHabit = (dateKey: string, groupId: string, itemId: string) => {
    let shouldAdd = false;
    let shouldRevoke = false;

    setHabitsByDate((prev) => {
      const existing =
        prev[dateKey] ||
        HABIT_GROUPS_INITIAL.map((g) => ({
          ...g,
          items: g.items.map((i) => ({ ...i, checked: false })),
        }));

      const updated = existing.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          items: g.items.map((i) => {
            if (i.id !== itemId) return i;
            return { ...i, checked: !i.checked };
          }),
        };
      });

      // Count categories with >= 1 checked item for this day
      const activeCategoriesCount = updated.filter((g) =>
        g.items.some((i) => i.checked)
      ).length;

      if (activeCategoriesCount >= 5) {
        shouldAdd = true;
      } else {
        shouldRevoke = true;
      }

      return {
        ...prev,
        [dateKey]: updated,
      };
    });

    if (shouldAdd) {
      addHabitPoints(dateKey);
    } else if (shouldRevoke) {
      revokeHabitPoints(dateKey);
    }
  };

  // Dynamic Literacy Entries State (Default empty, can load sample or all)
  const [literacyEntries, setLiteracyEntries] = useState<LiteracyEntry[]>([...INITIAL_LITERACY_ENTRIES]);

  const addLiteracyEntry = (entry: LiteracyEntry) => {
    setLiteracyEntries((prev) => [entry, ...prev]);
    // Award +3 points for logging a reading text
    setStudentProfile((prev) => ({
      ...prev,
      literacyPts: prev.literacyPts + 3,
      points: prev.points + 3,
    }));
    setPointsHistory((prev) => [
      {
        id: `lit_${entry.id}_${Date.now()}`,
        title: entry.title.trim(),
        date: 'Today',
        points: 3,
      },
      ...prev,
    ]);
    showToast('+3 pts · Reading log', 3);
  };

  const updateLiteracyEntry = (id: string | number, updated: Partial<LiteracyEntry>) => {
    setLiteracyEntries((prev) =>
      prev.map((e) => (String(e.id) === String(id) ? { ...e, ...updated } : e))
    );
    if (updated.title) {
      setPointsHistory((prev) =>
        prev.map((p) =>
          p.id.startsWith(`lit_${id}`) ? { ...p, title: updated.title!.trim() } : p
        )
      );
    }
  };

  const deleteLiteracyEntry = (id: string | number) => {
    setLiteracyEntries((prev) => prev.filter((e) => String(e.id) !== String(id)));
    setPointsHistory((prev) => prev.filter((p) => !p.id.startsWith(`lit_${id}`)));
    setStudentProfile((prev) => ({
      ...prev,
      literacyPts: Math.max(0, prev.literacyPts - 3),
      points: Math.max(0, prev.points - 3),
    }));
  };

  const loadSampleLiteracyEntry = () => {
    setLiteracyEntries([DUMMY_LITERACY_ENTRIES[0]]);
  };

  const loadAllMockLiteracyEntries = () => {
    setLiteracyEntries([...DUMMY_LITERACY_ENTRIES]);
  };

  const clearLiteracyEntries = () => {
    setLiteracyEntries([]);
  };

  return (
    <StudentDataContext.Provider
      value={{
        studentProfile,
        pointsHistory,
        addHabitPoints,
        revokeHabitPoints,
        classLeaderboard,
        houseLeaderboard: LEADERBOARD_HOUSES,
        jenjangLeaderboard,
        habitsByDate,
        toggleHabit,
        isDateSubmitted,
        toastList,
        showToast,
        dismissToast,
        courses: COURSES_DATA,
        assignments: ASSIGNMENTS_DATA,
        quizzes: QUIZZES_DATA,
        exams: EXAMS_DATA,
        grades: GRADES_DATA,
        announcements: ANNOUNCEMENTS_DATA,
        literacyEntries,
        addLiteracyEntry,
        updateLiteracyEntry,
        deleteLiteracyEntry,
        loadSampleLiteracyEntry,
        loadAllMockLiteracyEntries,
        clearLiteracyEntries,
        getSessions: getCourseSessions,
        getSessionDetail: getCourseSessionDetail,
        getWeeklyPlan: getWeeklyPlanForWeek,
        isLoading,
        isRefreshing,
        isError,
        errorMessage,
        refreshAllData,
        setIsError,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = (): StudentDataContextType => {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};

export default StudentDataContext;
