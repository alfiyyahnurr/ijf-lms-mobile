import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  LiteracyProgressStats,
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
import { api } from '../services/api';
import storage from '../services/storage';

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

// Initial habits map per date (empty clean state, populated 100% from live backend API)
const generateInitialHabitsByDate = (todayKey: string): Record<string, HabitGroup[]> => {
  return {
    [todayKey]: HABIT_GROUPS_INITIAL.map((g) => ({
      ...g,
      items: g.items.map((i) => ({ ...i, checked: false })),
    })),
  };
};

const INITIAL_AWARDED_DATES: string[] = [];
const INITIAL_HABIT_PTS = 0;
const INITIAL_POINTS_HISTORY: PointHistoryItem[] = [];

interface StudentDataContextType {
  // Profile & Points
  studentProfile: StudentProfile;
  setStudentProfile: (profile: StudentProfile | ((prev: StudentProfile) => StudentProfile)) => void;
  pointsHistory: PointHistoryItem[];
  addHabitPoints: (dateKey: string) => void;
  revokeHabitPoints: (dateKey: string) => void;

  // Leaderboard
  classHabitsLeaderboard: LeaderboardStudent[];
  classLeaderboard: LeaderboardStudent[];
  houseLeaderboard: LeaderboardHouse[];
  jenjangLeaderboard: LeaderboardStudent[];

  // Habits State
  habitsByDate: Record<string, HabitGroup[]>;
  toggleHabit: (dateKey: string, groupId: string, itemId: string) => void;
  isDateSubmitted: (dateKey: string) => boolean;
  fetchHabitsMonth: (yearMonth: string) => Promise<any>;
  fetchClassLeaderboard: () => Promise<any>;
  fetchLiteracyLogs: () => Promise<LiteracyEntry[]>;
  fetchLiteracyStats: () => Promise<LiteracyProgressStats | null>;

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
  addLiteracyEntry: (entry: LiteracyEntry, pointsAwarded?: number) => void;
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
      // Sync student profile from live backend API
      const liveProfile = await api.profile.getProfile();
      if (liveProfile && liveProfile.fullName) {
        setStudentProfile((prev) => ({
          ...prev,
          ...liveProfile,
        }));
      }

      // Sync literacy logs from live backend API
      try {
        const liveLogs = await api.literacy.list();
        setLiteracyEntries(liveLogs);
      } catch (e) {
        // ignore
      }
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

  // Student Profile State (starts with D 0, L 6, H 8 -> 14 pts)
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(STUDENT_PROFILE);

  // Restore saved student profile from persistent storage on app startup
  useEffect(() => {
    storage
      .getStudentSession()
      .then((saved) => {
        if (saved) {
          setStudentProfile((prev) => ({
            ...prev,
            ...saved,
            userId: saved.userId ?? prev.userId,
            studentId: saved.studentId ?? prev.studentId,
            schoolId: saved.schoolId ?? prev.schoolId,
            fullName: saved.fullName ?? prev.fullName,
            email: saved.email ?? prev.email,
            className: saved.className ?? prev.className,
            schoolName: saved.schoolName ?? prev.schoolName,
            house: saved.house ?? prev.house,
            academicYearName: saved.academicYearName ?? prev.academicYearName,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live habit records for a specific yearMonth from backend API
  const fetchHabitsMonth = useCallback(async (yearMonth: string) => {
    try {
      const res = await api.habits.getMonth(yearMonth);
      if (res && Array.isArray(res.days)) {
        setHabitsByDate((prev) => {
          const next = { ...prev };
          res.days.forEach((dayRecord: any) => {
            if (!dayRecord.record_date || !Array.isArray(dayRecord.items)) return;
            const dateStr = dayRecord.record_date;
            const baseGroups =
              next[dateStr] ||
              HABIT_GROUPS_INITIAL.map((g) => ({
                ...g,
                items: g.items.map((i) => ({ ...i, checked: false })),
              }));

            const updated = baseGroups.map((g) => {
              const mappedId =
                g.id === 'rise-early' ? 'wake' :
                g.id === 'eat-well' ? 'eat' :
                g.id === 'love-learning' ? 'learn' :
                g.id === 'sleep-early' ? 'sleep' : g.id;

              return {
                ...g,
                items: g.items.map((i) => {
                  const match = dayRecord.items.find(
                    (it: any) =>
                      (it.category_id === mappedId || it.category_id === g.id) &&
                      it.item_label === i.text
                  );
                  return match ? { ...i, checked: Boolean(match.is_checked) } : i;
                }),
              };
            });
            next[dateStr] = updated;
          });
          return next;
        });
        return res;
      }
    } catch (err) {
      console.warn('[Fetch Habits Month Error]', err);
    }
    return null;
  }, []);

  // Dynamic Literacy Entries State (populated live from API)
  const [literacyEntries, setLiteracyEntries] = useState<LiteracyEntry[]>([]);

  // Fetch live student literacy logs directly from backend API
  const fetchLiteracyLogs = useCallback(async () => {
    try {
      const logs = await api.literacy.list();
      setLiteracyEntries(logs);
      return logs;
    } catch (err) {
      console.warn('[Fetch Literacy Logs Error]', err);
    }
    return [];
  }, []);

  // Fetch live student literacy statistics directly from backend API
  const fetchLiteracyStats = useCallback(async () => {
    try {
      const stats = await api.literacy.getStats();
      return stats;
    } catch (err) {
      console.warn('[Fetch Literacy Stats Error]', err);
    }
    return null;
  }, []);

  // Fetch live class habits leaderboard directly from backend API
  const fetchClassLeaderboard = useCallback(async () => {
    try {
      const data = await api.leaderboard.getClass();
      if (data && Array.isArray(data.rows)) {
        const myId = Number(data.myStudentId) || studentProfile.studentId;
        const mapped: LeaderboardStudent[] = data.rows.map((row: any, idx: number) => ({
          id: String(row.student_id),
          name: row.full_name,
          points: Number(row.total_points) || 0,
          habitsPts: Number(row.habits_pts) || 0,
          literacyPts: Number(row.literacy_pts) || 0,
          disciplinePts: Number(row.discipline_pts) || 0,
          house: row.house,
          rank: idx + 1,
          isCurrent: myId ? row.student_id === myId : false,
        }));

        const habitsSorted = [...mapped]
          .sort((a, b) => (b.habitsPts || 0) - (a.habitsPts || 0))
          .map((s, idx) => ({ ...s, rank: idx + 1 }));

        setClassHabitsLeaderboard(habitsSorted);
        setClassLeaderboard(mapped);

        // Sync current user's habitsPts from live API into studentProfile
        const myRow = mapped.find((s) => s.isCurrent);
        if (myRow) {
          setStudentProfile((prev) => ({
            ...prev,
            habitsPts: myRow.habitsPts ?? prev.habitsPts,
          }));
        }

        return data;
      }
    } catch (err) {
      console.warn('[Fetch Class Leaderboard Error]', err);
    }
    return null;
  }, [studentProfile.studentId]);

  // Load initial active month habits and literacy on startup / user switch
  useEffect(() => {
    const ym = todayKey.slice(0, 7);
    fetchHabitsMonth(ym);
    fetchClassLeaderboard();
    fetchLiteracyLogs();
  }, [todayKey, studentProfile.studentId, fetchHabitsMonth, fetchClassLeaderboard, fetchLiteracyLogs]);

  // House Leaderboard State (7 houses, dynamic points and breakdown)
  const [houseLeaderboard, setHouseLeaderboard] = useState<LeaderboardHouse[]>([...LEADERBOARD_HOUSES]);

  // Class Habits Leaderboard (Ranked SOLELY by habitsPts - populated live from API)
  const [classHabitsLeaderboard, setClassHabitsLeaderboard] = useState<LeaderboardStudent[]>([]);

  // Class Full Leaderboard (Ranked by TOTAL points D+L+H for Leaderboard screen tab 3)
  const [classLeaderboard, setClassLeaderboard] = useState<LeaderboardStudent[]>([]);

  // Jenjang Full Leaderboard (Ranked by TOTAL points D+L+H for Leaderboard screen tab 2)
  const [jenjangLeaderboard, setJenjangLeaderboard] = useState<LeaderboardStudent[]>(() => {
    return [...LEADERBOARD_JENJANG]
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

    // 3. Update Class Habits Leaderboard (re-sort by habitsPts only)
    setClassHabitsLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          const newH = (student.habitsPts || 0) + 2;
          return { ...student, habitsPts: newH, points: newH };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => (b.habitsPts || 0) - (a.habitsPts || 0))
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    // 4. Update Class Full Leaderboard (Fatih (you) total points + 2 & habitsPts + 2 & re-sort)
    setClassLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          const newH = (student.habitsPts || 0) + 2;
          const newTotal = student.points + 2;
          return { ...student, habitsPts: newH, points: newTotal };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    // 5. Update Jenjang Full Leaderboard (Fatih (you) total points + 2 & habitsPts + 2 & re-sort)
    setJenjangLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          const newH = (student.habitsPts || 0) + 2;
          const newTotal = student.points + 2;
          return { ...student, habitsPts: newH, points: newTotal };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    // 6. Trigger Toast Notification (concise 1-2 words)
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

    // Update Class Habits Leaderboard
    setClassHabitsLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          const newH = Math.max(0, (student.habitsPts || 0) - 2);
          return { ...student, habitsPts: newH, points: newH };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => (b.habitsPts || 0) - (a.habitsPts || 0))
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    // Update Class Full Leaderboard
    setClassLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          const newH = Math.max(0, (student.habitsPts || 0) - 2);
          const newTotal = Math.max(0, student.points - 2);
          return { ...student, habitsPts: newH, points: newTotal };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    // Update Jenjang Full Leaderboard
    setJenjangLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          const newH = Math.max(0, (student.habitsPts || 0) - 2);
          const newTotal = Math.max(0, student.points - 2);
          return { ...student, habitsPts: newH, points: newTotal };
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
    let targetChecked = true;
    let targetItemText = '';

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
            if (i.id !== itemId && i.text !== itemId) return i;
            targetChecked = !i.checked;
            targetItemText = i.text;
            return { ...i, checked: !i.checked };
          }),
        };
      });

      // Count categories with >= 1 checked item for this day (threshold: 5 categories)
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

    // Synchronize to backend database asynchronously with official item label
    const labelToSend = targetItemText || itemId;
    api.habits.toggleHabit(dateKey, groupId, labelToSend, targetChecked).catch((err: any) => {
      console.warn('[Habit Sync Error]', err?.message || err);
    });

    if (shouldAdd) {
      addHabitPoints(dateKey);
    } else if (shouldRevoke) {
      revokeHabitPoints(dateKey);
    }
  };

  const addLiteracyEntry = (entry: LiteracyEntry, pointsAwarded = 3) => {
    setLiteracyEntries((prev) => [entry, ...prev.filter((e) => String(e.id) !== String(entry.id))]);
    // Award points for logging a reading text
    if (pointsAwarded > 0) {
      setStudentProfile((prev) => ({
        ...prev,
        literacyPts: prev.literacyPts + pointsAwarded,
        points: prev.points + pointsAwarded,
      }));

      // Reactively update Class Full Leaderboard (literacyPts + pointsAwarded, total points + pointsAwarded, re-sort)
      setClassLeaderboard((prev) => {
        const updated = prev.map((student) => {
          if (student.isCurrent) {
            const newL = (student.literacyPts || 0) + pointsAwarded;
            const newTotal = student.points + pointsAwarded;
            return { ...student, literacyPts: newL, points: newTotal };
          }
          return student;
        });
        return [...updated]
          .sort((a, b) => b.points - a.points)
          .map((s, idx) => ({ ...s, rank: idx + 1 }));
      });

      // Reactively update Jenjang Full Leaderboard (literacyPts + pointsAwarded, total points + pointsAwarded, re-sort)
      setJenjangLeaderboard((prev) => {
        const updated = prev.map((student) => {
          if (student.isCurrent) {
            const newL = (student.literacyPts || 0) + pointsAwarded;
            const newTotal = student.points + pointsAwarded;
            return { ...student, literacyPts: newL, points: newTotal };
          }
          return student;
        });
        return [...updated]
          .sort((a, b) => b.points - a.points)
          .map((s, idx) => ({ ...s, rank: idx + 1 }));
      });

      setPointsHistory((prev) => [
        {
          id: `lit_${entry.id}_${Date.now()}`,
          title: entry.title.trim(),
          date: 'Today',
          points: pointsAwarded,
        },
        ...prev,
      ]);
    }
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
    // Synchronize to backend database asynchronously
    api.literacy.update(id, updated).catch(() => {});
  };

  const deleteLiteracyEntry = (id: string | number) => {
    setLiteracyEntries((prev) => prev.filter((e) => String(e.id) !== String(id)));
    setPointsHistory((prev) => prev.filter((p) => !p.id.startsWith(`lit_${id}`)));
    setStudentProfile((prev) => ({
      ...prev,
      literacyPts: Math.max(0, prev.literacyPts - 3),
      points: Math.max(0, prev.points - 3),
    }));

    // Synchronize to backend database asynchronously
    api.literacy.delete(id).catch(() => {});

    // Update Class Full Leaderboard
    setClassLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          const newL = Math.max(0, (student.literacyPts || 0) - 3);
          const newTotal = Math.max(0, student.points - 3);
          return { ...student, literacyPts: newL, points: newTotal };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });

    // Update Jenjang Full Leaderboard
    setJenjangLeaderboard((prev) => {
      const updated = prev.map((student) => {
        if (student.isCurrent) {
          const newL = Math.max(0, (student.literacyPts || 0) - 3);
          const newTotal = Math.max(0, student.points - 3);
          return { ...student, literacyPts: newL, points: newTotal };
        }
        return student;
      });
      return [...updated]
        .sort((a, b) => b.points - a.points)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    });
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
        setStudentProfile,
        pointsHistory,
        addHabitPoints,
        revokeHabitPoints,
        classHabitsLeaderboard,
        classLeaderboard,
        houseLeaderboard,
        jenjangLeaderboard,
        habitsByDate,
        toggleHabit,
        isDateSubmitted,
        fetchHabitsMonth,
        fetchClassLeaderboard,
        fetchLiteracyLogs,
        fetchLiteracyStats,
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
