/**
 * Kreativa LMS Student API Service Layer
 * Fully mapped to Kreativa-LMS-Student.postman_collection.json,
 * Kreativa-LMS-Student.postman_environment.json, and GOOGLE_SSO.md.
 * 
 * Provides typed methods for all 20 modules & 67 endpoints.
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
  ScheduleItem,
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
  WEEKLY_SCHEDULE,
  getCourseSessions,
  getCourseSessionDetail,
  getWeeklyPlanForWeek,
  HABIT_GROUPS_INITIAL,
} from '../data/mockData';

export const API_BASE_URL = 'https://learn.kreativaglobal.sch.id';

// In-memory dynamic store for Literacy entries
let inMemoryLiteracyEntries: LiteracyEntry[] = [...INITIAL_LITERACY_ENTRIES];

export const api = {
  // ==========================================
  // 1. AUTH (GOOGLE_SSO.md)
  // ==========================================
  auth: {
    // POST {{baseUrl}}/api/auth/login or /api/mobile/auth/google
    loginWithGoogle: async (tokenOrPayload: string | { idToken?: string; accessToken?: string }) => {
      const token = typeof tokenOrPayload === 'string' ? tokenOrPayload : (tokenOrPayload.accessToken || tokenOrPayload.idToken || 'mock_token');
      return {
        tokenType: 'Bearer',
        accessToken: 'mock_jwt_token_' + Date.now(),
        token: 'mock_jwt_token_' + Date.now(),
        expiresIn: 2592000,
        studentId: STUDENT_PROFILE.studentId, // 2602
        userId: STUDENT_PROFILE.userId,       // 2602
        schoolId: STUDENT_PROFILE.schoolId,   // 6
        user: {
          userId: STUDENT_PROFILE.userId,
          studentId: STUDENT_PROFILE.studentId,
          schoolId: STUDENT_PROFILE.schoolId,
          email: STUDENT_PROFILE.email,
          fullName: STUDENT_PROFILE.fullName,
          role: 'student' as const,
        },
      };
    },

    // GET {{baseUrl}}/api/auth/me
    getMe: async (): Promise<StudentProfile> => {
      return { ...STUDENT_PROFILE };
    },

    // GET {{baseUrl}}/api/mobile/auth/me
    getMeMobile: async (): Promise<StudentProfile> => {
      return { ...STUDENT_PROFILE };
    },

    // POST {{baseUrl}}/api/auth/logout
    logout: async () => {
      return { success: true };
    },

    // GET {{baseUrl}}/api/auth/session (NextAuth session)
    getSession: async () => {
      return {
        user: {
          name: STUDENT_PROFILE.fullName,
          email: STUDENT_PROFILE.email,
          role: 'student',
        },
        expires: new Date(Date.now() + 2592000 * 1000).toISOString(),
      };
    },

    // GET {{baseUrl}}/api/auth/csrf
    getCsrf: async () => {
      return { csrfToken: 'mock_csrf_token_' + Date.now() };
    },

    // GET {{baseUrl}}/api/auth/providers
    getProviders: async () => {
      return {
        google: {
          id: 'google',
          name: 'Google',
          type: 'oauth',
          signinUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          callbackUrl: 'https://learn.kreativaglobal.sch.id/api/auth/callback/google',
        },
      };
    },

    // GET {{baseUrl}}/api/auth/impersonate?token={{impersonateToken}}
    impersonate: async (token: string) => {
      return {
        success: true,
        accessToken: 'mock_impersonate_jwt_' + token,
        studentId: STUDENT_PROFILE.studentId,
      };
    },
  },

  // ==========================================
  // 2. DASHBOARD
  // ==========================================
  dashboard: {
    // GET {{baseUrl}}/api/dashboard
    getStats: async () => {
      return {
        activeCoursesCount: COURSES_DATA.length,
        pendingAssignmentsCount: ASSIGNMENTS_DATA.filter((a) => a.status === 'pending').length,
        upcomingExamsCount: EXAMS_DATA.filter((e) => e.status === 'upcoming').length,
        totalPoints: STUDENT_PROFILE.points,
      };
    },

    // GET {{baseUrl}}/api/academic-year
    getAcademicYear: async () => {
      return {
        academicYearId: 7,
        name: 'Academic Year 7 2026/2027',
        termId: 1,
        termName: 'Term 1',
        isCurrent: true,
      };
    },
  },

  // ==========================================
  // 3. PROFILE
  // ==========================================
  profile: {
    // GET {{baseUrl}}/api/profile
    getProfile: async (): Promise<StudentProfile> => {
      return { ...STUDENT_PROFILE };
    },
  },

  // ==========================================
  // 4. COURSES
  // ==========================================
  courses: {
    // GET {{baseUrl}}/api/courses
    list: async (): Promise<Course[]> => {
      return [...COURSES_DATA];
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}
    getCourse: async (courseId: number): Promise<Course> => {
      const found = COURSES_DATA.find((c) => c.id === courseId);
      return found || COURSES_DATA[0];
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}/sessions
    getSessions: async (courseId: number, courseName: string, totalSessions: number): Promise<CourseSession[]> => {
      return getCourseSessions(courseId, courseName, totalSessions);
    },

    // GET {{baseUrl}}/api/sessions/{{sessionId}}
    getSessionDetail: async (session: CourseSession, course?: Course): Promise<CourseSessionDetail> => {
      return getCourseSessionDetail(session, course);
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}/assignments
    getAssignments: async (courseId: number): Promise<Assignment[]> => {
      return ASSIGNMENTS_DATA.filter((a) => a.course.toLowerCase().includes(String(courseId)));
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}/quizzes
    getQuizzes: async (courseId: number): Promise<Quiz[]> => {
      return QUIZZES_DATA.filter((q) => q.course.toLowerCase().includes(String(courseId)));
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}/forums
    getForums: async (courseId: number) => {
      return [
        {
          id: 1,
          courseId,
          title: 'Class Discussion Board',
          postsCount: 4,
          updatedAt: '2026-09-21',
        },
      ];
    },

    // GET {{baseUrl}}/api/calendar?start={{calendarStart}}&end={{calendarEnd}}
    getCalendar: async (start?: string, end?: string) => {
      return [
        {
          id: 'cal-1',
          title: 'Term 1 Midterm Assessment Week',
          start: start || '2026-09-01T00:00:00.000Z',
          end: end || '2026-10-01T00:00:00.000Z',
          type: 'exam',
        },
      ];
    },
  },

  // ==========================================
  // 5. SCHEDULE
  // ==========================================
  schedule: {
    // GET {{baseUrl}}/api/schedule
    getSchedule: async (): Promise<ScheduleItem[]> => {
      return [...WEEKLY_SCHEDULE.Mon];
    },
  },

  // ==========================================
  // 6. ASSIGNMENTS
  // ==========================================
  assignments: {
    // GET {{baseUrl}}/api/assignments
    list: async (): Promise<Assignment[]> => {
      return [...ASSIGNMENTS_DATA];
    },

    // GET {{baseUrl}}/api/assignments/{{assignmentId}}
    getAssignment: async (assignmentId: number): Promise<Assignment> => {
      const found = ASSIGNMENTS_DATA.find((a) => a.id === assignmentId);
      return found || ASSIGNMENTS_DATA[0];
    },

    // POST {{baseUrl}}/api/assignments/{{assignmentId}}/submit
    submit: async (assignmentId: number, payload: { submissionText?: string; submissionUrl?: string }) => {
      return {
        success: true,
        assignmentId,
        submissionText: payload.submissionText || '',
        submissionUrl: payload.submissionUrl || '',
        submittedAt: new Date().toISOString(),
      };
    },
  },

  // ==========================================
  // 7. QUIZZES
  // ==========================================
  quizzes: {
    // GET {{baseUrl}}/api/quizzes
    list: async (): Promise<Quiz[]> => {
      return [...QUIZZES_DATA];
    },

    // GET {{baseUrl}}/api/quizzes/{{quizId}}
    getQuiz: async (quizId: number): Promise<Quiz> => {
      const found = QUIZZES_DATA.find((q) => q.id === quizId);
      return found || QUIZZES_DATA[0];
    },

    // POST {{baseUrl}}/api/quizzes/{{quizId}}/start
    start: async (quizId: number) => {
      return {
        attemptId: 1,
        quizId,
        startedAt: new Date().toISOString(),
      };
    },

    // POST {{baseUrl}}/api/quizzes/{{quizId}}/answer
    answer: async (quizId: number, payload: { attemptId: number; questionId: number; selectedOptionIds?: string; answerText?: string; answerNumeric?: number }) => {
      return {
        success: true,
        quizId,
        ...payload,
      };
    },

    // POST {{baseUrl}}/api/quizzes/{{quizId}}/submit
    submit: async (quizId: number, payload: { attemptId: number; score?: number; timeSpent?: number }) => {
      return {
        success: true,
        quizId,
        attemptId: payload.attemptId,
        score: payload.score || 80,
        timeSpent: payload.timeSpent || 120,
        status: 'completed',
      };
    },
  },

  // ==========================================
  // 8. EXAMS
  // ==========================================
  exams: {
    // GET {{baseUrl}}/api/exams
    list: async (): Promise<ExamItem[]> => {
      return [...EXAMS_DATA];
    },

    // GET {{baseUrl}}/api/exams/{{examId}}
    getExam: async (examId: string | number): Promise<ExamItem> => {
      const found = EXAMS_DATA.find((e) => String(e.id) === String(examId));
      return found || EXAMS_DATA[0];
    },

    // POST {{baseUrl}}/api/exams/{{examId}}/start
    start: async (examId: string | number) => {
      return {
        attemptId: 1,
        examId,
        startedAt: new Date().toISOString(),
      };
    },

    // POST {{baseUrl}}/api/exams/{{examId}}/answer
    answer: async (examId: string | number, payload: { attemptId: number; questionId: number; selectedOptionIds?: string }) => {
      return {
        success: true,
        examId,
        ...payload,
      };
    },

    // POST {{baseUrl}}/api/exams/{{examId}}/submit
    submit: async (examId: string | number, payload: { attemptId: number; score?: number; timeSpent?: number }) => {
      return {
        success: true,
        examId,
        attemptId: payload.attemptId,
        score: payload.score || 85,
        timeSpent: payload.timeSpent || 180,
        status: 'completed',
      };
    },
  },

  // ==========================================
  // 9. SCORES
  // ==========================================
  scores: {
    // GET {{baseUrl}}/api/scores
    getGrades: async (): Promise<SubjectGrade[]> => {
      return [...GRADES_DATA];
    },

    // GET {{baseUrl}}/api/scores/{{courseId}}
    getScoreByCourse: async (courseId: number): Promise<SubjectGrade | undefined> => {
      return GRADES_DATA.find((g) => String(g.id) === String(courseId));
    },
  },

  // ==========================================
  // 10. REPORT CARDS
  // ==========================================
  reportCards: {
    // GET {{baseUrl}}/api/student/report-cards
    list: async () => {
      return [
        {
          id: 1,
          reportCardId: 1,
          term: 'Term 1 2026/2027',
          academicYear: '2026/2027',
          publishedAt: '2026-10-25',
          gpa: '3.85',
          status: 'published',
        },
      ];
    },

    // GET {{baseUrl}}/api/student/report-cards/{{reportCardId}}
    getReportCard: async (reportCardId: number) => {
      return {
        id: reportCardId,
        term: 'Term 1 2026/2027',
        student: STUDENT_PROFILE,
        grades: GRADES_DATA,
        gpa: '3.85',
      };
    },

    // GET {{baseUrl}}/api/student/report-cards/{{reportCardId}}/pdf
    downloadPdf: async (reportCardId: number) => {
      return {
        downloadUrl: `https://learn.kreativaglobal.sch.id/api/student/report-cards/${reportCardId}/pdf`,
      };
    },
  },

  // ==========================================
  // 11. DISCUSSIONS / FORUMS
  // ==========================================
  forums: {
    // GET {{baseUrl}}/api/forums
    list: async () => {
      return [
        {
          id: 1,
          forumId: 1,
          title: 'Term 1 Collaborative Inquiry Board',
          course: 'Civic Education/History IGCSE',
          author: 'Mr. David Wilson',
          repliesCount: 6,
          lastActivity: '2 hours ago',
        },
      ];
    },

    // GET {{baseUrl}}/api/forums/{{forumId}}
    getForum: async (forumId: number) => {
      return {
        id: forumId,
        title: 'Term 1 Collaborative Inquiry Board',
        posts: [
          {
            id: 1,
            author: 'Fatih',
            content: 'How do historical events shape contemporary civil policy?',
            date: '2026-09-21',
          },
        ],
      };
    },

    // POST {{baseUrl}}/api/forums/{{forumId}}/reply
    reply: async (forumId: number, payload: { content: string; parentPostId?: number }) => {
      return {
        success: true,
        forumId,
        postId: Date.now(),
        content: payload.content,
        parentPostId: payload.parentPostId || 1,
        createdAt: new Date().toISOString(),
      };
    },
  },

  // ==========================================
  // 12. ANNOUNCEMENTS
  // ==========================================
  announcements: {
    // GET {{baseUrl}}/api/announcements
    list: async (): Promise<Announcement[]> => {
      return [...ANNOUNCEMENTS_DATA];
    },

    // POST {{baseUrl}}/api/announcements/{{announcementId}}/read
    markRead: async (announcementId: number) => {
      const target = ANNOUNCEMENTS_DATA.find((a) => a.id === announcementId);
      if (target) {
        target.read = true;
        target.isNew = false;
      }
      return { success: true, announcementId, read: true };
    },
  },

  // ==========================================
  // 13. RESOURCES
  // ==========================================
  resources: {
    // GET {{baseUrl}}/api/resources
    list: async () => {
      return [
        {
          id: 1,
          title: 'Cambridge IGCSE Curriculum Guide 2026/2027',
          category: 'Academic Guide',
          fileType: 'pdf',
          size: '3.4 MB',
          url: 'https://learn.kreativaglobal.sch.id/resources/igcse_guide.pdf',
        },
        {
          id: 2,
          title: 'Student Code of Conduct & Honor Pledge',
          category: 'School Policy',
          fileType: 'pdf',
          size: '1.2 MB',
          url: 'https://learn.kreativaglobal.sch.id/resources/code_of_conduct.pdf',
        },
      ];
    },
  },

  // ==========================================
  // 14. NOTIFICATIONS
  // ==========================================
  notifications: {
    // GET {{baseUrl}}/api/notifications?limit=20&offset=0
    list: async (limit: number = 20, offset: number = 0) => {
      return [
        {
          id: 1,
          title: 'Assignment Deadline Reminder',
          message: 'Civic Education Project due November 11, 2026.',
          read: false,
          createdAt: '2026-11-01',
        },
        {
          id: 2,
          title: 'Habit Log Awarded',
          message: 'Full habit day logged! +2 points awarded.',
          read: false,
          createdAt: '2026-10-14',
        },
      ];
    },

    // GET {{baseUrl}}/api/notifications/unread-count
    unreadCount: async () => {
      return { unreadCount: 2 };
    },

    // POST {{baseUrl}}/api/notifications/read
    markRead: async (payload: { notificationId?: number; all?: boolean }) => {
      return {
        success: true,
        ...payload,
      };
    },
  },

  // ==========================================
  // 15. WEEKLY PLAN & SESSIONS
  // ==========================================
  weeklyPlan: {
    // GET {{baseUrl}}/api/student/weekly-plan?weekStart={{weekStart}}
    getWeek: async (weekStartIso: string = '2026-09-07'): Promise<WeeklyPlanSession[]> => {
      return getWeeklyPlanForWeek(weekStartIso);
    },

    // GET {{baseUrl}}/api/student/sessions/{{sessionId}}
    getStudentSession: async (sessionId: number): Promise<WeeklyPlanSession | undefined> => {
      const allSessions = getWeeklyPlanForWeek('2026-09-21');
      return allSessions.find((s) => s.sessionId === sessionId);
    },

    // GET {{baseUrl}}/api/sessions/{{sessionId}}
    getSessionDetail: async (sessionId: number) => {
      const allSessions = getWeeklyPlanForWeek('2026-09-21');
      const session = allSessions.find((s) => s.sessionId === sessionId);
      return session || allSessions[0];
    },

    // POST {{baseUrl}}/api/student/sessions/{{sessionId}}/progress
    updateSessionProgress: async (
      sessionId: number,
      payload: { preDone?: boolean; postDone?: boolean; preQuestion?: string; postNote?: string }
    ) => {
      return {
        success: true,
        sessionId,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
    },
  },

  // ==========================================
  // 16. HABITS
  // ==========================================
  habits: {
    // GET {{baseUrl}}/api/student/habits/week?weekStart={{weekStart}}
    getWeek: async (weekStart: string = '2026-09-07'): Promise<HabitGroup[]> => {
      return HABIT_GROUPS_INITIAL;
    },

    // GET {{baseUrl}}/api/student/habits/month?yearMonth={{yearMonth}}
    getMonth: async (yearMonth: string = '2026-09') => {
      return {
        yearMonth,
        submittedDays: [5, 6, 8, 9, 12, 13, 14],
        fullDaysCount: 7,
        daysLoggedCount: 7,
        points: 14,
      };
    },

    // POST {{baseUrl}}/api/student/habits/toggle
    toggleHabit: async (recordDate: string, categoryId: string | number, itemLabel: string, checked: boolean) => {
      return {
        success: true,
        recordDate,
        categoryId,
        itemLabel,
        checked,
      };
    },
  },

  // ==========================================
  // 17. LITERACY
  // ==========================================
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

    // Dynamic helpers
    loadSample: async (): Promise<LiteracyEntry[]> => {
      inMemoryLiteracyEntries = [DUMMY_LITERACY_ENTRIES[0]];
      return [...inMemoryLiteracyEntries];
    },

    loadAllMock: async (): Promise<LiteracyEntry[]> => {
      inMemoryLiteracyEntries = [...DUMMY_LITERACY_ENTRIES];
      return [...inMemoryLiteracyEntries];
    },

    clearAll: async (): Promise<LiteracyEntry[]> => {
      inMemoryLiteracyEntries = [];
      return [];
    },

    getEntries: async (): Promise<LiteracyEntry[]> => {
      return [...inMemoryLiteracyEntries];
    },
  },

  // ==========================================
  // 18. POINTS
  // ==========================================
  points: {
    // GET {{baseUrl}}/api/student/points/summary?academicYearId={{academicYearId}}&termId={{termId}}
    getSummary: async (academicYearId: number = 7, termId: number = 1) => {
      return {
        total: STUDENT_PROFILE.points,
        discipline: STUDENT_PROFILE.disciplinePts,
        literacy: STUDENT_PROFILE.literacyPts,
        habits: STUDENT_PROFILE.habitsPts,
      };
    },

    // GET {{baseUrl}}/api/student/points/history
    getHistory: async () => {
      return [
        {
          id: 'pt_hist_1',
          title: 'To Kill a Mockingbird',
          date: 'October 22, 2026',
          points: 3,
          category: 'literacy',
        },
        {
          id: 'pt_hist_2',
          title: 'Habit full day (≥5 categories checked)',
          date: 'October 14, 2026',
          points: 2,
          category: 'habits',
        },
      ];
    },
  },

  // ==========================================
  // 19. LEADERBOARD
  // ==========================================
  leaderboard: {
    // GET {{baseUrl}}/api/leaderboard/houses?academicYearId={{academicYearId}}&termId={{termId}}&houseId=
    getHouses: async (academicYearId: number = 7, termId: number = 1): Promise<LeaderboardHouse[]> => {
      return [...LEADERBOARD_HOUSES];
    },

    // GET {{baseUrl}}/api/leaderboard/class?classId={{classId}}&academicYearId={{academicYearId}}&termId={{termId}}
    getClass: async (classId: number = 99, academicYearId: number = 7, termId: number = 1): Promise<LeaderboardStudent[]> => {
      return [...LEADERBOARD_CLASS];
    },

    // GET {{baseUrl}}/api/leaderboard/jenjang?schoolLevel=high_school_igcse&academicYearId={{academicYearId}}&termId={{termId}}
    getJenjang: async (schoolLevel: string = 'high_school_igcse', academicYearId: number = 7, termId: number = 1): Promise<LeaderboardStudent[]> => {
      return [...LEADERBOARD_JENJANG];
    },
  },

  // ==========================================
  // 20. UPLOAD
  // ==========================================
  upload: {
    // POST {{baseUrl}}/api/upload
    uploadFile: async (formDataOrFile: any) => {
      return {
        url: 'https://learn.kreativaglobal.sch.id/uploads/submission_solution.pdf',
        fileName: 'submission_solution.pdf',
        size: 1843200,
        mimeType: 'application/pdf',
      };
    },
  },
};

export default api;
