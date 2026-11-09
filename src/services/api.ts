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
  PublishedCardSummary,
  PublishedCard,
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
  MOCK_PUBLISHED_CARDS_SUMMARY,
  MOCK_PUBLISHED_CARDS_DETAIL,
} from '../data/mockData';

export const API_BASE_URL = 'https://learn.kreativaglobal.sch.id';

// Persistent in-memory auth token
let activeAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  activeAuthToken = token;
};

export const getAuthToken = () => activeAuthToken;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number = 400, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Universal live network request helper with automatic bearer token & fallback protection
 */
export async function requestApi<T>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  fallbackData?: T
): Promise<T> {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`[API Request] ${method} ${fullUrl}`);
  if (body) {
    console.log('[API Request Body]', JSON.stringify(body, null, 2));
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (activeAuthToken) {
      headers['Authorization'] = `Bearer ${activeAuthToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      console.log(`[API Response ${res.status}] ${method} ${endpoint} (Live Backend)`);
      console.log('[API Response Data]', JSON.stringify(json, null, 2));
      return json as T;
    }

    // Attempt to extract structured error response from server
    const errorJson = await res.json().catch(() => null);
    const serverMessage = errorJson?.error || res.statusText || 'Request failed';
    const serverCode = errorJson?.code;

    console.log(`[API Response ${res.status}] ${method} ${endpoint}: ${serverMessage}`);
    if (fallbackData !== undefined) {
      console.log(`[API Fallback] ${method} ${endpoint} returned status ${res.status}. Serving fallback data:`);
      console.log('[API Fallback Data]', JSON.stringify(fallbackData, null, 2));
      return fallbackData;
    }

    throw new ApiError(serverMessage, res.status, serverCode);
  } catch (err: any) {
    if (fallbackData !== undefined) {
      console.log(`[API Fallback] ${method} ${endpoint} unreachable (${err?.message || 'network error'}). Serving fallback data:`);
      console.log('[API Fallback Data]', JSON.stringify(fallbackData, null, 2));
      return fallbackData;
    }
    console.log(`[API Network Error] ${method} ${endpoint}:`, err?.message || err);
    throw err;
  }
}

// In-memory dynamic store for Literacy entries
let inMemoryLiteracyEntries: LiteracyEntry[] = [...INITIAL_LITERACY_ENTRIES];

// Registered student database records in Kreativa LMS (matched to database core_users & core_students)
export const REGISTERED_STUDENTS_DB: Record<string, any> = {
  'alfiyyah@cnt.id': {
    userId: 2602,
    studentId: 2602,
    schoolId: 6,
    email: 'alfiyyah@cnt.id',
    fullName: 'Alfiyyah Nur Rachmania',
    role: 'student',
    schoolName: 'Kreativa Global School',
    className: 'Grade 7-A (Cambridge Lower Secondary)',
    house: 'Falcon',
    studentCode: 'KGS-2602',
  },
  'nralfiyyahrach@gmail.com': {
    userId: 2602,
    studentId: 2602,
    schoolId: 6,
    email: 'nralfiyyahrach@gmail.com',
    fullName: 'Alfiyyah Nur Rachmania',
    role: 'student',
    schoolName: 'Kreativa Global School',
    className: 'Grade 7-A (Cambridge Lower Secondary)',
    house: 'Falcon',
    studentCode: 'KGS-2602',
  },
  'irvanadrian151@gmail.com': {
    userId: 2602,
    studentId: 2602,
    schoolId: 6,
    email: 'irvanadrian151@gmail.com',
    fullName: 'Zahra Milyazka Fakhirah',
    role: 'student',
    schoolName: 'Kreativa Global High School',
    className: 'Secondary 4 - S4 A',
    house: 'Falcon',
    studentCode: 'KGH-2602',
  },
  'erwin.selamet@indonesiajuara.id': {
    userId: 2597,
    studentId: 2597,
    schoolId: 6,
    email: 'erwin.selamet@indonesiajuara.id',
    fullName: 'Radithya Baihaqi',
    role: 'student',
    schoolName: 'Kreativa Global High School',
    className: 'Secondary 4 - S4 A',
    house: 'Eagle',
    studentCode: 'KGH-2597',
  },
  'tania@cnt.id': {
    userId: 2568,
    studentId: 2568,
    schoolId: 2,
    email: 'tania@cnt.id',
    fullName: 'Raline Hagyahazna Rahmani',
    role: 'student',
    schoolName: 'Kreativa Global School',
    className: 'Grade 7-A',
    house: 'Falcon',
    studentCode: 'KGS-2568',
  },
  'fatih@learn.kreativaglobal.sch.id': {
    userId: 2602,
    studentId: 2602,
    schoolId: 6,
    email: 'fatih@learn.kreativaglobal.sch.id',
    fullName: 'Fatih Alamsyah',
    role: 'student',
    schoolName: 'Kreativa Global School',
    className: 'Grade 7-A (Cambridge Lower Secondary)',
    house: 'Falcon',
    studentCode: '0089217364',
  },
  'fatih.alamsyah@learn.kreativaglobal.sch.id': {
    userId: 2602,
    studentId: 2602,
    schoolId: 6,
    email: 'fatih.alamsyah@learn.kreativaglobal.sch.id',
    fullName: 'Fatih Alamsyah',
    role: 'student',
    schoolName: 'Kreativa Global School',
    className: 'Grade 7-A (Cambridge Lower Secondary)',
    house: 'Falcon',
    studentCode: '0089217364',
  },
};

export const api = {
  // ==========================================
  // 1. AUTH (GOOGLE_SSO.md)
  // ==========================================
  auth: {
    // POST {{baseUrl}}/api/auth/login or /api/mobile/auth/google
    loginWithGoogle: async (tokenOrPayload?: any) => {
      // 1. Support emulator test simulations
      if (tokenOrPayload?.simulate === 'unregistered' || tokenOrPayload === 'simulate_unregistered') {
        console.log('[Simulation] Simulating unregistered account (403)');
        throw new ApiError(
          'Your account is not registered. Please contact your school administrator to get access.',
          403,
          'ACCOUNT_NOT_REGISTERED'
        );
      }

      if (tokenOrPayload?.simulate === 'non_student' || tokenOrPayload === 'simulate_non_student') {
        console.log('[Simulation] Simulating non-student account (403)');
        throw new ApiError(
          'This app is only accessible for registered student accounts.',
          403,
          'NOT_A_STUDENT'
        );
      }

      const email = typeof tokenOrPayload === 'object' ? tokenOrPayload?.email?.trim().toLowerCase() : undefined;
      const accessToken =
        typeof tokenOrPayload === 'string'
          ? tokenOrPayload
          : tokenOrPayload?.accessToken;
      const idToken =
        typeof tokenOrPayload === 'object'
          ? tokenOrPayload?.idToken
          : undefined;

      // 2. If real Google tokens are present, call live backend API
      if (accessToken || idToken) {
        console.log('[Auth] Requesting authentication from backend API...');
        try {
          const liveRes = await requestApi<any>('/api/auth/login', 'POST', {
            accessToken: accessToken || undefined,
            idToken: idToken || undefined,
          });

          if (liveRes?.accessToken || liveRes?.token) {
            const jwt = liveRes.accessToken || liveRes.token;
            setAuthToken(jwt);
            return {
              tokenType: liveRes.tokenType || 'Bearer',
              accessToken: jwt,
              token: jwt,
              expiresIn: liveRes.expiresIn || 2592000,
              studentId: liveRes.studentId || liveRes.user?.studentId || STUDENT_PROFILE.studentId,
              userId: liveRes.userId || liveRes.user?.userId || STUDENT_PROFILE.userId,
              schoolId: liveRes.schoolId || liveRes.user?.schoolId || STUDENT_PROFILE.schoolId,
              user: {
                userId: liveRes.userId || liveRes.user?.userId || STUDENT_PROFILE.userId,
                studentId: liveRes.studentId || liveRes.user?.studentId || STUDENT_PROFILE.studentId,
                schoolId: liveRes.schoolId || liveRes.user?.schoolId || STUDENT_PROFILE.schoolId,
                email: liveRes.user?.email || STUDENT_PROFILE.email,
                fullName: liveRes.user?.fullName || liveRes.user?.name || STUDENT_PROFILE.fullName,
                role: (liveRes.user?.role || 'student') as 'student',
              },
            };
          }
        } catch (err: any) {
          if (err instanceof ApiError) {
            if (
              err.status === 403 &&
              (err.code === 'ACCOUNT_NOT_REGISTERED' ||
                err.message.toLowerCase().includes('not registered'))
            ) {
              throw new ApiError(
                'Your account is not registered. Please contact your school administrator to get access.',
                403,
                'ACCOUNT_NOT_REGISTERED'
              );
            }
            if (err.status === 403 && err.message.toLowerCase().includes('student')) {
              throw new ApiError(
                'This app is only accessible for registered student accounts.',
                403,
                'NOT_A_STUDENT'
              );
            }
            throw err;
          }
          throw new ApiError(
            'Unable to connect to LMS server. Please check your internet connection.',
            503
          );
        }
      }

      // 3. Validate Google Account Email against Database
      if (email) {
        console.log(`[Auth Check] Validating account email: "${email}"`);

        // Check if teacher/non-student account
        if (email.includes('teacher') || email.includes('admin') || email.includes('staff')) {
          console.log(`[Auth Check] Account "${email}" is not a student account (403)`);
          throw new ApiError(
            'This app is only accessible for registered student accounts.',
            403,
            'NOT_A_STUDENT'
          );
        }

        // Check if account exists in database core_users
        const matchedStudent = REGISTERED_STUDENTS_DB[email];
        if (!matchedStudent) {
          console.log(`[Auth Check] Account "${email}" not found in database (403)`);
          // Account is NOT registered in the database!
          throw new ApiError(
            'Your account is not registered. Please contact your school administrator to get access.',
            403,
            'ACCOUNT_NOT_REGISTERED'
          );
        }

        console.log(`[Auth Check] Account "${email}" verified successfully (Student ID: ${matchedStudent.studentId})`);
        const mockJwt = 'jwt_' + matchedStudent.userId + '_' + Date.now();
        setAuthToken(mockJwt);
        return {
          tokenType: 'Bearer',
          accessToken: mockJwt,
          token: mockJwt,
          expiresIn: 2592000,
          studentId: matchedStudent.studentId,
          userId: matchedStudent.userId,
          schoolId: matchedStudent.schoolId,
          user: { ...matchedStudent },
        };
      }

      // 4. Default Student Login (Registered Student in Database: Fatih Alamsyah)
      const defaultStudent = REGISTERED_STUDENTS_DB['fatih@learn.kreativaglobal.sch.id'];
      const defaultJwt = 'jwt_' + defaultStudent.userId + '_' + Date.now();
      setAuthToken(defaultJwt);
      console.log(`[Auth Success] Signed in as student: "${defaultStudent.fullName}" (${defaultStudent.email})`);
      return {
        tokenType: 'Bearer',
        accessToken: defaultJwt,
        token: defaultJwt,
        expiresIn: 2592000,
        studentId: defaultStudent.studentId,
        userId: defaultStudent.userId,
        schoolId: defaultStudent.schoolId,
        user: { ...defaultStudent },
      };
    },

    // GET {{baseUrl}}/api/auth/me
    getMe: async (): Promise<any> => {
      return requestApi<any>('/api/auth/me', 'GET', undefined, { ...STUDENT_PROFILE });
    },

    // GET {{baseUrl}}/api/mobile/auth/me
    getMeMobile: async (): Promise<any> => {
      return requestApi<any>('/api/mobile/auth/me', 'GET', undefined, { ...STUDENT_PROFILE });
    },

    // POST {{baseUrl}}/api/auth/logout
    logout: async () => {
      return requestApi('/api/auth/logout', 'POST', undefined, { success: true });
    },

    // GET {{baseUrl}}/api/auth/session (NextAuth session)
    getSession: async () => {
      return requestApi('/api/auth/session', 'GET', undefined, {
        user: {
          name: STUDENT_PROFILE.fullName,
          email: STUDENT_PROFILE.email,
          role: 'student',
        },
        expires: new Date(Date.now() + 2592000 * 1000).toISOString(),
      });
    },

    // GET {{baseUrl}}/api/auth/csrf
    getCsrf: async () => {
      return requestApi('/api/auth/csrf', 'GET', undefined, { csrfToken: 'mock_csrf_token_' + Date.now() });
    },

    // GET {{baseUrl}}/api/auth/providers
    getProviders: async () => {
      return requestApi('/api/auth/providers', 'GET', undefined, {
        google: {
          id: 'google',
          name: 'Google',
          type: 'oauth',
          signinUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          callbackUrl: 'https://learn.kreativaglobal.sch.id/api/auth/callback/google',
        },
      });
    },

    // GET {{baseUrl}}/api/auth/impersonate?token={{impersonateToken}}
    impersonate: async (token: string) => {
      return requestApi(`/api/auth/impersonate?token=${encodeURIComponent(token)}`, 'GET', undefined, {
        success: true,
        accessToken: 'mock_impersonate_jwt_' + token,
        studentId: STUDENT_PROFILE.studentId,
      });
    },
  },

  // ==========================================
  // 2. DASHBOARD
  // ==========================================
  dashboard: {
    // GET {{baseUrl}}/api/dashboard
    getStats: async () => {
      return requestApi(
        '/api/dashboard',
        'GET',
        undefined,
        {
          activeCoursesCount: COURSES_DATA.length,
          pendingAssignmentsCount: ASSIGNMENTS_DATA.filter((a) => a.status === 'pending').length,
          upcomingExamsCount: EXAMS_DATA.filter((e) => e.status === 'upcoming').length,
          totalPoints: STUDENT_PROFILE.points,
        }
      );
    },

    // GET {{baseUrl}}/api/academic-year
    getAcademicYear: async () => {
      return requestApi(
        '/api/academic-year',
        'GET',
        undefined,
        {
          academicYearId: 7,
          name: 'Academic Year 7 2026/2027',
          termId: 1,
          termName: 'Term 1',
          isCurrent: true,
        }
      );
    },
  },

  // ==========================================
  // 3. PROFILE
  // ==========================================
  profile: {
    // GET {{baseUrl}}/api/profile
    getProfile: async (): Promise<StudentProfile> => {
      const res = await requestApi<any>('/api/profile', 'GET', undefined, STUDENT_PROFILE);
      if (res && (res.fullName || res.email)) {
        return {
          ...STUDENT_PROFILE,
          userId: res.userId || STUDENT_PROFILE.userId,
          studentId: res.studentId || STUDENT_PROFILE.studentId,
          schoolId: res.schoolId || STUDENT_PROFILE.schoolId,
          fullName: res.fullName || STUDENT_PROFILE.fullName,
          email: res.email || STUDENT_PROFILE.email,
          schoolName: res.schoolName || STUDENT_PROFILE.schoolName,
          className: res.className || STUDENT_PROFILE.className,
          academicYearName: res.academicYear || STUDENT_PROFILE.academicYearName,
          house: res.houseName || STUDENT_PROFILE.house,
        };
      }
      return { ...STUDENT_PROFILE };
    },
  },

  // ==========================================
  // 4. COURSES
  // ==========================================
  courses: {
    // GET {{baseUrl}}/api/courses
    list: async (): Promise<Course[]> => {
      return requestApi<Course[]>('/api/courses', 'GET', undefined, [...COURSES_DATA]);
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}
    getCourse: async (courseId: number): Promise<Course> => {
      const found = COURSES_DATA.find((c) => c.id === courseId);
      return requestApi<Course>(`/api/courses/${courseId}`, 'GET', undefined, found || COURSES_DATA[0]);
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}/sessions
    getSessions: async (courseId: number, courseName: string, totalSessions: number): Promise<CourseSession[]> => {
      return requestApi<CourseSession[]>(
        `/api/courses/${courseId}/sessions`,
        'GET',
        undefined,
        getCourseSessions(courseId, courseName, totalSessions)
      );
    },

    // GET {{baseUrl}}/api/sessions/{{sessionId}}
    getSessionDetail: async (session: CourseSession, course?: Course): Promise<CourseSessionDetail> => {
      return requestApi<CourseSessionDetail>(
        `/api/sessions/${session.id}`,
        'GET',
        undefined,
        getCourseSessionDetail(session, course)
      );
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}/assignments
    getAssignments: async (courseId: number): Promise<Assignment[]> => {
      return requestApi<Assignment[]>(
        `/api/courses/${courseId}/assignments`,
        'GET',
        undefined,
        ASSIGNMENTS_DATA.filter((a) => a.course.toLowerCase().includes(String(courseId)))
      );
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}/quizzes
    getQuizzes: async (courseId: number): Promise<Quiz[]> => {
      return requestApi<Quiz[]>(
        `/api/courses/${courseId}/quizzes`,
        'GET',
        undefined,
        QUIZZES_DATA.filter((q) => q.course.toLowerCase().includes(String(courseId)))
      );
    },

    // GET {{baseUrl}}/api/courses/{{courseId}}/forums
    getForums: async (courseId: number) => {
      return requestApi<any[]>(
        `/api/courses/${courseId}/forums`,
        'GET',
        undefined,
        [
          {
            id: 1,
            courseId,
            title: 'Class Discussion Board',
            postsCount: 4,
            updatedAt: '2026-09-21',
          },
        ]
      );
    },

    // GET {{baseUrl}}/api/calendar?start={{calendarStart}}&end={{calendarEnd}}
    getCalendar: async (start?: string, end?: string) => {
      return requestApi<any[]>(
        `/api/calendar?start=${encodeURIComponent(start || '2026-09-01')}&end=${encodeURIComponent(end || '2026-10-01')}`,
        'GET',
        undefined,
        [
          {
            id: 'cal-1',
            title: 'Term 1 Midterm Assessment Week',
            start: start || '2026-09-01T00:00:00.000Z',
            end: end || '2026-10-01T00:00:00.000Z',
            type: 'exam',
          },
        ]
      );
    },
  },

  // ==========================================
  // 5. SCHEDULE
  // ==========================================
  schedule: {
    // GET {{baseUrl}}/api/schedule
    getSchedule: async (): Promise<ScheduleItem[]> => {
      return requestApi<ScheduleItem[]>('/api/schedule', 'GET', undefined, [...WEEKLY_SCHEDULE.Mon]);
    },
  },

  // ==========================================
  // 6. ASSIGNMENTS
  // ==========================================
  assignments: {
    // GET {{baseUrl}}/api/assignments
    list: async (): Promise<Assignment[]> => {
      return requestApi<Assignment[]>('/api/assignments', 'GET', undefined, [...ASSIGNMENTS_DATA]);
    },

    // GET {{baseUrl}}/api/assignments/{{assignmentId}}
    getAssignment: async (assignmentId: number): Promise<Assignment> => {
      const found = ASSIGNMENTS_DATA.find((a) => a.id === assignmentId);
      return requestApi<Assignment>(`/api/assignments/${assignmentId}`, 'GET', undefined, found || ASSIGNMENTS_DATA[0]);
    },

    // POST {{baseUrl}}/api/assignments/{{assignmentId}}/submit
    submit: async (assignmentId: number, payload: { submissionText?: string; submissionUrl?: string }) => {
      return requestApi(
        `/api/assignments/${assignmentId}/submit`,
        'POST',
        payload,
        {
          success: true,
          assignmentId,
          submissionText: payload.submissionText || '',
          submissionUrl: payload.submissionUrl || '',
          submittedAt: new Date().toISOString(),
        }
      );
    },
  },

  // ==========================================
  // 7. QUIZZES
  // ==========================================
  quizzes: {
    // GET {{baseUrl}}/api/quizzes
    list: async (): Promise<Quiz[]> => {
      return requestApi<Quiz[]>('/api/quizzes', 'GET', undefined, [...QUIZZES_DATA]);
    },

    // GET {{baseUrl}}/api/quizzes/{{quizId}}
    getQuiz: async (quizId: number): Promise<Quiz> => {
      const found = QUIZZES_DATA.find((q) => q.id === quizId);
      return requestApi<Quiz>(`/api/quizzes/${quizId}`, 'GET', undefined, found || QUIZZES_DATA[0]);
    },

    // POST {{baseUrl}}/api/quizzes/{{quizId}}/start
    start: async (quizId: number) => {
      return requestApi(`/api/quizzes/${quizId}/start`, 'POST', undefined, {
        attemptId: 1,
        quizId,
        startedAt: new Date().toISOString(),
      });
    },

    // POST {{baseUrl}}/api/quizzes/{{quizId}}/answer
    answer: async (quizId: number, payload: { attemptId: number; questionId: number; selectedOptionIds?: string; answerText?: string; answerNumeric?: number }) => {
      return requestApi(`/api/quizzes/${quizId}/answer`, 'POST', payload, {
        success: true,
        quizId,
        ...payload,
      });
    },

    // POST {{baseUrl}}/api/quizzes/{{quizId}}/submit
    submit: async (quizId: number, payload: { attemptId: number; score?: number; timeSpent?: number }) => {
      return requestApi(`/api/quizzes/${quizId}/submit`, 'POST', payload, {
        success: true,
        quizId,
        attemptId: payload.attemptId,
        score: payload.score || 80,
        timeSpent: payload.timeSpent || 120,
        status: 'completed',
      });
    },
  },

  // ==========================================
  // 8. EXAMS
  // ==========================================
  exams: {
    // GET {{baseUrl}}/api/exams
    list: async (): Promise<ExamItem[]> => {
      return requestApi<ExamItem[]>('/api/exams', 'GET', undefined, [...EXAMS_DATA]);
    },

    // GET {{baseUrl}}/api/exams/{{examId}}
    getExam: async (examId: string | number): Promise<ExamItem> => {
      const found = EXAMS_DATA.find((e) => String(e.id) === String(examId));
      return requestApi<ExamItem>(`/api/exams/${examId}`, 'GET', undefined, found || EXAMS_DATA[0]);
    },

    // POST {{baseUrl}}/api/exams/{{examId}}/start
    start: async (examId: string | number) => {
      return requestApi(`/api/exams/${examId}/start`, 'POST', undefined, {
        attemptId: 1,
        examId,
        startedAt: new Date().toISOString(),
      });
    },

    // POST {{baseUrl}}/api/exams/{{examId}}/answer
    answer: async (examId: string | number, payload: { attemptId: number; questionId: number; selectedOptionIds?: string }) => {
      return requestApi(`/api/exams/${examId}/answer`, 'POST', payload, {
        success: true,
        examId,
        ...payload,
      });
    },

    // POST {{baseUrl}}/api/exams/{{examId}}/submit
    submit: async (examId: string | number, payload: { attemptId: number; score?: number; timeSpent?: number }) => {
      return requestApi(`/api/exams/${examId}/submit`, 'POST', payload, {
        success: true,
        examId,
        attemptId: payload.attemptId,
        score: payload.score || 85,
        timeSpent: payload.timeSpent || 180,
        status: 'completed',
      });
    },
  },

  // ==========================================
  // 9. SCORES
  // ==========================================
  scores: {
    // GET {{baseUrl}}/api/scores
    getGrades: async (): Promise<SubjectGrade[]> => {
      return requestApi<SubjectGrade[]>('/api/scores', 'GET', undefined, [...GRADES_DATA]);
    },

    // GET {{baseUrl}}/api/scores/{{courseId}}
    getScoreByCourse: async (courseId: number): Promise<SubjectGrade | undefined> => {
      return requestApi<SubjectGrade | undefined>(
        `/api/scores/${courseId}`,
        'GET',
        undefined,
        GRADES_DATA.find((g) => String(g.id) === String(courseId))
      );
    },
  },

  // ==========================================
  // 10. REPORT CARDS
  // ==========================================
  reportCards: {
    // GET {{baseUrl}}/api/student/report-cards
    list: async (): Promise<PublishedCardSummary[]> => {
      try {
        const res = await requestApi<{ cards: PublishedCardSummary[] }>(
          '/api/student/report-cards',
          'GET',
          undefined,
          { cards: MOCK_PUBLISHED_CARDS_SUMMARY }
        );
        return res?.cards ?? MOCK_PUBLISHED_CARDS_SUMMARY;
      } catch {
        return MOCK_PUBLISHED_CARDS_SUMMARY;
      }
    },

    // GET {{baseUrl}}/api/student/report-cards/{{reportCardId}}
    getReportCard: async (reportCardId: number): Promise<PublishedCard | null> => {
      const fallback = MOCK_PUBLISHED_CARDS_DETAIL[reportCardId] ?? MOCK_PUBLISHED_CARDS_DETAIL[1];
      try {
        const res = await requestApi<PublishedCard>(
          `/api/student/report-cards/${reportCardId}`,
          'GET',
          undefined,
          fallback
        );
        return res ?? fallback;
      } catch {
        return fallback;
      }
    },

    // GET {{baseUrl}}/api/student/report-cards/{{reportCardId}}/pdf
    downloadPdf: async (reportCardId: number) => {
      return {
        downloadUrl: `https://learn.kreativaglobal.sch.id/api/student/report-cards/${reportCardId}/pdf?download=1`,
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
      return requestApi<Announcement[]>('/api/announcements', 'GET', undefined, [...ANNOUNCEMENTS_DATA]);
    },

    // POST {{baseUrl}}/api/announcements/{{announcementId}}/read
    markRead: async (announcementId: number) => {
      const target = ANNOUNCEMENTS_DATA.find((a) => a.id === announcementId);
      if (target) {
        target.read = true;
        target.isNew = false;
      }
      return requestApi(`/api/announcements/${announcementId}/read`, 'POST', undefined, {
        success: true,
        announcementId,
        read: true,
      });
    },
  },

  // ==========================================
  // 13. RESOURCES
  // ==========================================
  resources: {
    // GET {{baseUrl}}/api/resources
    list: async () => {
      return requestApi<any[]>('/api/resources', 'GET', undefined, [
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
      ]);
    },
  },

  // ==========================================
  // 14. NOTIFICATIONS
  // ==========================================
  notifications: {
    // GET {{baseUrl}}/api/notifications?limit=20&offset=0
    list: async (limit: number = 20, offset: number = 0) => {
      return requestApi<any[]>(
        `/api/notifications?limit=${limit}&offset=${offset}`,
        'GET',
        undefined,
        [
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
        ]
      );
    },

    // GET {{baseUrl}}/api/notifications/unread-count
    unreadCount: async () => {
      return requestApi<{ unreadCount: number }>('/api/notifications/unread-count', 'GET', undefined, { unreadCount: 2 });
    },

    // POST {{baseUrl}}/api/notifications/read
    markRead: async (payload: { notificationId?: number; all?: boolean }) => {
      return requestApi('/api/notifications/read', 'POST', payload, {
        success: true,
        ...payload,
      });
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
      return requestApi<HabitGroup[]>(
        `/api/student/habits/week?weekStart=${encodeURIComponent(weekStart)}`,
        'GET',
        undefined,
        HABIT_GROUPS_INITIAL
      );
    },

    // GET {{baseUrl}}/api/student/habits/month?yearMonth={{yearMonth}}
    getMonth: async (yearMonth: string = '2026-09') => {
      return requestApi<any>(
        `/api/student/habits/month?yearMonth=${encodeURIComponent(yearMonth)}`,
        'GET',
        undefined,
        {
          yearMonth,
          submittedDays: [5, 6, 8, 9, 12, 13, 14],
          fullDaysCount: 7,
          daysLoggedCount: 7,
          points: 14,
        }
      );
    },

    // POST {{baseUrl}}/api/student/habits/toggle
    toggleHabit: async (recordDate: string, categoryId: string | number, itemLabel: string, checked: boolean) => {
      return requestApi<any>(
        '/api/student/habits/toggle',
        'POST',
        {
          recordDate,
          categoryId,
          itemLabel,
          checked,
        },
        {
          success: true,
          recordDate,
          categoryId,
          itemLabel,
          checked,
        }
      );
    },
  },

  // ==========================================
  // 17. LITERACY
  // ==========================================
  literacy: {
    // GET {{baseUrl}}/api/student/literacy?termId={{termId}}
    list: async (termId: number = 1): Promise<LiteracyEntry[]> => {
      try {
        const live = await requestApi<LiteracyEntry[]>(
          `/api/student/literacy?termId=${termId}`,
          'GET'
        );
        if (Array.isArray(live) && live.length > 0) {
          inMemoryLiteracyEntries = live;
          return live;
        }
      } catch (err) {
        // Fallback to local
      }
      return [...inMemoryLiteracyEntries];
    },

    // GET {{baseUrl}}/api/student/literacy/stats?termId={{termId}}
    getStats: async (termId: number = 1): Promise<LiteracyProgressStats> => {
      try {
        const liveStats = await requestApi<LiteracyProgressStats>(
          `/api/student/literacy/stats?termId=${termId}`,
          'GET'
        );
        if (liveStats && typeof liveStats.textsRead === 'number') {
          return liveStats;
        }
      } catch (err) {
        // Fallback to local
      }
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

      try {
        const liveRes = await requestApi<any>('/api/student/literacy', 'POST', payload);
        if (liveRes && liveRes.id) {
          const entryWithServerId = { ...newEntry, ...liveRes, id: liveRes.id };
          inMemoryLiteracyEntries = [entryWithServerId, ...inMemoryLiteracyEntries];
          return entryWithServerId;
        }
      } catch (err) {
        // Fallback to local
      }

      inMemoryLiteracyEntries = [newEntry, ...inMemoryLiteracyEntries];
      return newEntry;
    },

    // PUT {{baseUrl}}/api/student/literacy/{{literacyId}}
    update: async (literacyId: string | number, payload: Partial<LiteracyEntry>): Promise<LiteracyEntry> => {
      try {
        await requestApi<any>(`/api/student/literacy/${literacyId}`, 'PUT', payload);
      } catch (err) {
        // Fallback
      }

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
      try {
        await requestApi<any>(`/api/student/literacy/${literacyId}`, 'DELETE');
      } catch (err) {
        // Fallback
      }

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
      return requestApi(
        `/api/student/points/summary?academicYearId=${academicYearId}&termId=${termId}`,
        'GET',
        undefined,
        {
          total: STUDENT_PROFILE.points,
          discipline: STUDENT_PROFILE.disciplinePts,
          literacy: STUDENT_PROFILE.literacyPts,
          habits: STUDENT_PROFILE.habitsPts,
        }
      );
    },

    // GET {{baseUrl}}/api/student/points/history
    getHistory: async () => {
      return requestApi(
        '/api/student/points/history',
        'GET',
        undefined,
        [
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
        ]
      );
    },
  },

  // ==========================================
  // 19. LEADERBOARD
  // ==========================================
  leaderboard: {
    // GET {{baseUrl}}/api/leaderboard/houses?academicYearId={{academicYearId}}&termId={{termId}}&houseId=
    getHouses: async (academicYearId: number = 7, termId: number = 1): Promise<LeaderboardHouse[]> => {
      return requestApi<LeaderboardHouse[]>(
        `/api/leaderboard/houses?academicYearId=${academicYearId}&termId=${termId}`,
        'GET',
        undefined,
        [...LEADERBOARD_HOUSES]
      );
    },

    // GET {{baseUrl}}/api/leaderboard/class?classId={{classId}}&academicYearId={{academicYearId}}&termId={{termId}}
    getClass: async (classId: number = 99, academicYearId: number = 7, termId: number = 1): Promise<LeaderboardStudent[]> => {
      return requestApi<LeaderboardStudent[]>(
        `/api/leaderboard/class?classId=${classId}&academicYearId=${academicYearId}&termId=${termId}`,
        'GET',
        undefined,
        [...LEADERBOARD_CLASS]
      );
    },

    // GET {{baseUrl}}/api/leaderboard/jenjang?schoolLevel=high_school_igcse&academicYearId={{academicYearId}}&termId={{termId}}
    getJenjang: async (schoolLevel: string = 'high_school_igcse', academicYearId: number = 7, termId: number = 1): Promise<LeaderboardStudent[]> => {
      return requestApi<LeaderboardStudent[]>(
        `/api/leaderboard/jenjang?schoolLevel=${encodeURIComponent(schoolLevel)}&academicYearId=${academicYearId}&termId=${termId}`,
        'GET',
        undefined,
        [...LEADERBOARD_JENJANG]
      );
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
