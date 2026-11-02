/**
 * Kreativa LMS Student API Service Layer
 * Fully mapped to Kreativa-LMS-Student.postman_collection.json
 * 
 * Provides typed methods for all modules.
 * Currently backed by structured mock adapters, ready for instant backend URL switch.
 */

import {
  StudentProfile,
  Course,
  CourseSession,
  CourseSessionDetail,
  WeeklyPlanSession,
  HabitGroup,
  LeaderboardStudent,
  LeaderboardHouse,
  Assignment,
  Quiz,
  ExamItem,
  SubjectGrade,
  LiteracyEntry,
  LiteracyProgressStats,
  Announcement,
} from '../types';

import {
  STUDENT_PROFILE,
  COURSES_DATA,
  ASSIGNMENTS_DATA,
  QUIZZES_DATA,
  EXAMS_DATA,
  GRADES_DATA,
  ANNOUNCEMENTS_DATA,
  LEADERBOARD_CLASS,
  LEADERBOARD_HOUSES,
  LEADERBOARD_JENJANG,
  INITIAL_LITERACY_ENTRIES,
  DUMMY_LITERACY_ENTRIES,
  INITIAL_LITERACY_PROGRESS,
  POSTMAN_MOCK_STUDENT_CONTEXT,
  getCourseSessions,
  getCourseSessionDetail,
  getWeeklyPlanForWeek,
  HABIT_GROUPS_INITIAL,
} from '../data/mockData';

export const API_BASE_URL = 'https://learn.kreativaglobal.sch.id';

// In-memory dynamic store for Literacy entries (defaults to empty, can load sample or all)
let inMemoryLiteracyEntries: LiteracyEntry[] = [...INITIAL_LITERACY_ENTRIES];

export const api = {
  auth: {
    loginWithGoogle: async (accessToken: string) => {
      // POST {{baseUrl}}/api/auth/login or /api/mobile/auth/google
      return {
        accessToken: 'mock_jwt_token_' + Date.now(),
        tokenType: 'Bearer',
        studentId: STUDENT_PROFILE.studentId,
        user: STUDENT_PROFILE,
      };
    },
    getMe: async (): Promise<StudentProfile> => {
      // GET {{baseUrl}}/api/auth/me
      return { ...STUDENT_PROFILE };
    },
  },

  dashboard: {
    getStats: async () => {
      // GET {{baseUrl}}/api/dashboard
      return {
        activeCoursesCount: COURSES_DATA.length,
        pendingAssignmentsCount: ASSIGNMENTS_DATA.filter((a) => a.status === 'pending').length,
        upcomingExamsCount: EXAMS_DATA.filter((e) => e.status === 'upcoming').length,
        totalPoints: STUDENT_PROFILE.points,
      };
    },
  },

  courses: {
    list: async (): Promise<Course[]> => {
      // GET {{baseUrl}}/api/courses
      return [...COURSES_DATA];
    },
    getSessions: async (courseId: number, courseName: string, totalSessions: number): Promise<CourseSession[]> => {
      // GET {{baseUrl}}/api/courses/:courseId/sessions
      return getCourseSessions(courseId, courseName, totalSessions);
    },
    getSessionDetail: async (session: CourseSession, course?: Course): Promise<CourseSessionDetail> => {
      // GET {{baseUrl}}/api/sessions/:sessionId
      return getCourseSessionDetail(session, course);
    },
  },

  weeklyPlan: {
    getWeek: async (weekStartIso: string): Promise<WeeklyPlanSession[]> => {
      // GET {{baseUrl}}/api/student/habits/week or /api/weekly-plan
      return getWeeklyPlanForWeek(weekStartIso);
    },
  },

  habits: {
    getMonth: async (yearMonth: string) => {
      // GET {{baseUrl}}/api/student/habits/month?yearMonth={{yearMonth}}
      return {
        yearMonth,
        submittedDays: [5, 6, 8, 9, 12, 13, 14],
        fullDaysCount: 7,
        daysLoggedCount: 7,
        points: 14,
      };
    },
    getWeek: async (weekStart: string): Promise<HabitGroup[]> => {
      // GET {{baseUrl}}/api/student/habits/week?weekStart={{weekStart}}
      return HABIT_GROUPS_INITIAL;
    },
    toggleHabit: async (recordDate: string, categoryId: string | number, itemLabel: string, checked: boolean) => {
      // POST {{baseUrl}}/api/student/habits/toggle
      return {
        success: true,
        recordDate,
        categoryId,
        itemLabel,
        checked,
      };
    },
  },

  leaderboard: {
    getClass: async (classId: number = 99): Promise<LeaderboardStudent[]> => {
      // GET {{baseUrl}}/api/leaderboard/class?classId=99
      return [...LEADERBOARD_CLASS];
    },
    getHouses: async (): Promise<LeaderboardHouse[]> => {
      // GET {{baseUrl}}/api/leaderboard/house
      return [...LEADERBOARD_HOUSES];
    },
    getJenjang: async (): Promise<LeaderboardStudent[]> => {
      // GET {{baseUrl}}/api/leaderboard/level
      return [...LEADERBOARD_JENJANG];
    },
  },

  assignments: {
    list: async (): Promise<Assignment[]> => {
      // GET {{baseUrl}}/api/assignments
      return [...ASSIGNMENTS_DATA];
    },
  },

  quizzes: {
    list: async (): Promise<Quiz[]> => {
      // GET {{baseUrl}}/api/quizzes
      return [...QUIZZES_DATA];
    },
  },

  exams: {
    list: async (): Promise<ExamItem[]> => {
      // GET {{baseUrl}}/api/exams
      return [...EXAMS_DATA];
    },
  },

  scores: {
    getGrades: async (): Promise<SubjectGrade[]> => {
      // GET {{baseUrl}}/api/scores
      return [...GRADES_DATA];
    },
  },

  literacy: {
    // GET {{baseUrl}}/api/student/literacy?termId={{termId}}
    list: async (termId: number = 1): Promise<LiteracyEntry[]> => {
      return [...inMemoryLiteracyEntries];
    },

    // GET {{baseUrl}}/api/student/literacy/stats?termId={{termId}}
    getStats: async (termId: number = 1): Promise<LiteracyProgressStats> => {
      const textsRead = inMemoryLiteracyEntries.length;
      const uniqueGenres = new Set(inMemoryLiteracyEntries.map((e) => e.genre).filter(Boolean)).size;
      const englishCount = inMemoryLiteracyEntries.filter((e) => e.language === 'English').length;
      const englishPercentage = textsRead > 0 ? Math.round((englishCount / textsRead) * 100) : 0;

      let avgRating = '—';
      const ratedEntries = inMemoryLiteracyEntries.filter((e) => e.rating);
      if (ratedEntries.length > 0) {
        let totalStars = 0;
        let count = 0;
        ratedEntries.forEach((e) => {
          if (typeof e.rating === 'number') {
            totalStars += e.rating;
            count++;
          } else {
            const matches = String(e.rating).match(/[★⭐]/g);
            if (matches) {
              totalStars += matches.length;
              count++;
            }
          }
        });
        if (count > 0) {
          const avg = totalStars / count;
          avgRating = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
        }
      }

      return {
        textsRead,
        textsTarget: INITIAL_LITERACY_PROGRESS.textsTarget,
        genreVariety: uniqueGenres,
        genreTarget: INITIAL_LITERACY_PROGRESS.genreTarget,
        avgRating,
        englishPercentage,
        englishTargetPercentage: INITIAL_LITERACY_PROGRESS.englishTargetPercentage,
        level: INITIAL_LITERACY_PROGRESS.level,
        schoolLevel: INITIAL_LITERACY_PROGRESS.schoolLevel,
      };
    },

    // POST {{baseUrl}}/api/student/literacy
    create: async (payload: Partial<LiteracyEntry>): Promise<LiteracyEntry> => {
      const newEntry: LiteracyEntry = {
        id: 'lit-' + Date.now(),
        title: (payload.title || 'Untitled').trim(),
        author: (payload.author || 'Anonymous').trim(),
        readingType: payload.readingType || payload.type || 'Novel / Fiction',
        type: payload.type || payload.readingType || 'Novel / Fiction',
        genre: payload.genre || 'Historical Fiction',
        language: payload.language || 'English',
        pagesOrLength: payload.pagesOrLength || '—',
        finishedDate: payload.finishedDate || payload.dateFinished || new Date().toISOString().split('T')[0],
        dateFinished: payload.dateFinished || payload.finishedDate || '22/10/2026',
        rating: payload.rating || 'Outstanding ★★★★★',
        claim: payload.claim || payload.reflectionText || '',
        claimPrompt: payload.claimPrompt || payload.reflectionClaim || 'What argument or central claim does the author make?',
        reflectionClaim: payload.claimPrompt || payload.reflectionClaim || 'What argument or central claim does the author make?',
        reflectionText: payload.claim || payload.reflectionText || '',
        evidence: payload.evidence || '',
        evidencePrompt: payload.evidencePrompt || 'Which specific passage, data, or example best supports your claim?',
        sowhat: payload.sowhat || '',
        sowhatPrompt: payload.sowhatPrompt || 'What are the broader implications of the author\'s argument?',
        connection: payload.connection || '',
        vocab: payload.vocab || (payload.vocabulary ? payload.vocabulary.split(',').map((w) => w.trim()).filter(Boolean) : []),
        vocabulary: payload.vocabulary || (payload.vocab ? payload.vocab.join(', ') : ''),
        createdAt: new Date().toISOString(),
      };
      inMemoryLiteracyEntries = [newEntry, ...inMemoryLiteracyEntries];
      return newEntry;
    },

    // PUT {{baseUrl}}/api/student/literacy/{{literacyId}}
    update: async (literacyId: string | number, payload: Partial<LiteracyEntry>): Promise<LiteracyEntry> => {
      const index = inMemoryLiteracyEntries.findIndex((e) => String(e.id) === String(literacyId));
      if (index === -1) {
        throw new Error(`Literacy entry with id ${literacyId} not found`);
      }
      const existing = inMemoryLiteracyEntries[index];
      const updated: LiteracyEntry = {
        ...existing,
        ...payload,
        id: existing.id,
      };
      inMemoryLiteracyEntries[index] = updated;
      return updated;
    },

    // DELETE {{baseUrl}}/api/student/literacy/{{literacyId}}
    delete: async (literacyId: string | number): Promise<{ success: boolean; id: string | number }> => {
      inMemoryLiteracyEntries = inMemoryLiteracyEntries.filter((e) => String(e.id) !== String(literacyId));
      return { success: true, id: literacyId };
    },

    // Dynamic helper: Load single sample entry (To Kill a Mockingbird) matching reference screenshot
    loadSample: async (): Promise<LiteracyEntry[]> => {
      inMemoryLiteracyEntries = [DUMMY_LITERACY_ENTRIES[0]];
      return [...inMemoryLiteracyEntries];
    },

    // Dynamic helper: Load full mock dataset (3 Books)
    loadAllMock: async (): Promise<LiteracyEntry[]> => {
      inMemoryLiteracyEntries = [...DUMMY_LITERACY_ENTRIES];
      return [...inMemoryLiteracyEntries];
    },

    // Dynamic helper: Reset/clear all entries (Empty state)
    clearAll: async (): Promise<LiteracyEntry[]> => {
      inMemoryLiteracyEntries = [];
      return [];
    },

    // Backward compatibility alias for list()
    getEntries: async (): Promise<LiteracyEntry[]> => {
      return [...inMemoryLiteracyEntries];
    },
  },

  announcements: {
    list: async (): Promise<Announcement[]> => {
      // GET {{baseUrl}}/api/announcements
      return [...ANNOUNCEMENTS_DATA];
    },
  },
};

export default api;