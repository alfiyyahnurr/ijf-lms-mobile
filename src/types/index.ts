export interface StudentProfile {
  userId: number;
  studentId: number;
  schoolId: number;
  fullName: string;
  email: string;
  role: 'student';
  schoolName: string;
  schoolLevel: string;
  classId: number;
  className: string;
  academicYearName: string;
  house: string | null;
  points: number;
  disciplinePts: number;
  literacyPts: number;
  habitsPts: number;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  teacher: string;
  sessions: number;
  status: 'active' | 'archived';
  class?: string;
  description?: string;
  curriculum?: string;
}

export interface Assignment {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  score: string;
  status: 'pending' | 'submitted' | 'graded';
}

export interface QuizOption {
  id: number;
  optionLabel: string;
  optionText: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: number;
  question_type: string;
  question_text: string;
  points: number;
  options: QuizOption[];
  explanation?: string | null;
}

export interface Quiz {
  id: number;
  title: string;
  course: string;
  duration: string;
  questions: number;
  score: string;
  status: 'not started' | 'in progress' | 'completed';
}

export interface HabitItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface HabitGroup {
  id: string;
  title: string;
  items: HabitItem[];
}

export interface ClassHabitRankItem {
  rank: number;
  name: string;
  points: number;
  isCurrentUser?: boolean;
}

export interface LiteracyEntry {
  id: number | string;
  title: string;
  author: string;
  readingType?: string;
  type: string;
  language: string;
  genre: string;
  pagesOrLength: string;
  finishedDate?: string;
  dateFinished: string;
  rating: string | number;
  vocabulary?: string;
  vocab?: string[];
  // 3-Tier Reflection Prompts & Texts
  claim?: string;
  claimPrompt?: string;
  reflectionClaim?: string;
  reflectionText?: string;
  evidence?: string;
  evidencePrompt?: string;
  sowhat?: string;
  sowhatPrompt?: string;
  connection?: string;
  createdAt?: string;
  // Backward compatibility fields
  bookTitle?: string;
  pagesRead?: number;
  minutesSpent?: number;
  reflection?: string;
  claimType?: string;
  date?: string;
}

export interface LiteracyFormData {
  title: string;
  author: string;
  type: string;
  language: string;
  genre: string;
  pagesOrLength: string;
  dateFinished: string;
  rating: string;
  vocabulary: string;
  // Step 1: Claim
  reflectionClaimPrompt: string;
  reflectionClaimText: string;
  // Step 2: Evidence
  reflectionEvidencePrompt: string;
  reflectionEvidenceText: string;
  // Step 3: So What?
  reflectionSoWhatPrompt: string;
  reflectionSoWhatText: string;
  // Step 4: Connection
  connection: string;
  // Backward compatibility
  reflectionClaim?: string;
  reflectionText?: string;
}

export interface LiteracyProgressStats {
  textsRead: number;
  textsTarget: number;
  genreVariety: number;
  genreTarget: number;
  avgRating: string;
  englishPercentage: number;
  englishTargetPercentage: number;
  level: string;
  schoolLevel?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  isNew: boolean;
  read: boolean;
}

export interface LeaderboardHouse {
  rank: number;
  name: string;
  color: string;
  points: number;
  members: number;
  disciplinePts?: number;
  literacyPts?: number;
  habitsPts?: number;
}

export interface LeaderboardStudent {
  rank: number;
  name: string;
  class?: string;
  house: string | null;
  points: number;
  disciplinePts?: number;
  literacyPts?: number;
  habitsPts?: number;
  isCurrent?: boolean;
}

export interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  room: string;
  teacher: string;
  type: string;
}

export interface ExamItem {
  id: string;
  course: string;
  code: string;
  type: string;
  date: string;
  time: string;
  room: string;
  seatNumber: string;
  status: 'upcoming' | 'completed';
}

export interface SubjectGrade {
  id: string;
  subject: string;
  code: string;
  score: number;
  grade: string;
  attendance: string;
  comment: string;
}

export interface CourseSession {
  id: string;
  courseId: number;
  sessionNumber: number;
  title: string;
  date: string;
  hasPreLearning: boolean;
  hasPostLearning: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface SessionBeforeClass {
  activityType: string;
  duration: string;
  prompt: string;
  resourceUrl?: string;
}

export interface SessionAfterClass {
  activityType: string;
  duration: string;
  prompt: string;
}

export interface SessionInfoMeta {
  fullDate: string;
  timeSlot: string;
  location: string;
  independentStudy: string[];
}

export interface CourseSessionDetail extends CourseSession {
  courseName: string;
  classCode: string;
  academicYear: string;
  beforeClass: SessionBeforeClass;
  learningObjectives: string;
  inClassContent: string;
  materials: string[];
  afterClass: SessionAfterClass;
  sessionInfo: SessionInfoMeta;
}

export interface WeeklyPlanSession {
  sessionId: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  sessionNumber: number;
  title: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri
  time: string; // e.g. "08:00 - 09:30"
  room: string;
  teacher: string;
  preDone: boolean;
  postDone: boolean;
  preQuestion?: string;
  postNote?: string;
  materials?: string[];
  status: 'completed' | 'in_progress' | 'scheduled';
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'points' | 'info';
  points?: number;
  message: string;
  duration?: number;
}

export interface PointHistoryItem {
  id: string;
  title: string;
  date: string;
  points: number;
}

export type SshsAspectItem = {
  id: number;
  item_key: string;
  label: string;
  score_kind: 'abc' | 'text';
  sort_order: number;
  description: string | null;
  score: string | null;
};

export type SshsAspectBlock = {
  id: number;
  code: string;
  title: string;
  sort_order: number;
  items: SshsAspectItem[];
};

export type SshsSubjectRow = {
  subject_id: number;
  subject_name: string;
  sort_order: number;
  key_learning_focus: string | null;
  ca: number | null;
  ma: number | null;
  term_average: number | null;
};

export type PublishedCardSummary = {
  id: number;
  class_name: string;
  term_name: string;
  term_number: number;
  academic_year_name: string;
  published_at: string | null;
};

export type PublishedCard = {
  id: number;
  school_level: 'secondary' | 'high_school';
  homeroom_comment: string | null;
  area_for_development: string | null;
  student_name: string;
  student_nis: string;
  class_name: string;
  phase: string | null;
  term_name: string;
  term_number: number;
  academic_year_name: string;
  school_name: string;
  school_logo_url: string | null;
  school_address: string | null;
  school_tagline: string | null;
  school_phone: string | null;
  school_email: string | null;
  school_website: string | null;
  principal_name: string | null;
  homeroom_teacher: string | null;
  subjects: SshsSubjectRow[];
  aspects: SshsAspectBlock[];
};

