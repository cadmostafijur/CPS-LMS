import type { RoleLike, RoleName } from "@/lib/roles";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type BlogStatus = "DRAFT" | "PUBLISHED";
export type LessonType = "TEXT" | "VIDEO" | "PDF" | "URL" | "AUDIO";
export type CourseDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface CourseCategory {
  id: number | string;
  documentId?: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  courseCount?: number;
}

export interface CourseModule {
  id: number | string;
  documentId?: string;
  title: string;
  description?: string | null;
  order?: number;
}

export interface User {
  id: number | string;
  documentId?: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: RoleLike;
  avatarUrl?: string | null;
  isActive?: boolean | null;
  blocked?: boolean | null;
}

export interface Course {
  id: number | string;
  documentId?: string;
  title: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  status: CourseStatus;
  isFree?: boolean;
  price?: number | null;
  discountPrice?: number | null;
  currency?: string | null;
  difficulty?: CourseDifficulty | null;
  language?: string | null;
  requirements?: string | null;
  outcomes?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags?: string | null;
  publishedAt?: string | null;
  category?: CourseCategory | null;
  modules?: CourseModule[];
  instructor?: User | null;
  createdByUser?: User | null;
  lessons?: Lesson[];
  quizzes?: Quiz[];
  enrollments?: Enrollment[];
  moduleGates?: ModuleGate[];
  lessonCount?: number;
  quizCount?: number;
  enrolled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: number | string;
  documentId?: string;
  title: string;
  slug: string;
  content?: string | null;
  videoUrl?: string | null;
  captionsUrl?: string | null;
  documentUrl?: string | null;
  externalUrl?: string | null;
  lessonType?: LessonType;
  order?: number;
  isPreview?: boolean;
  durationMinutes?: number;
  module?: CourseModule | null;
  course?: Course | number | string | null;
}

export interface QuizOption {
  id: number | string;
  documentId?: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: number | string;
  documentId?: string;
  question: string;
  order?: number;
  options?: QuizOption[];
}

export interface Quiz {
  id: number | string;
  documentId?: string;
  title: string;
  description?: string | null;
  passPercent?: number | null;
  timeLimitMinutes?: number | null;
  course?: Course | null;
  module?: CourseModule | null;
  questions?: QuizQuestion[];
  createdByUser?: User | null;
}

export interface Enrollment {
  id: number | string;
  documentId?: string;
  enrolledAt?: string;
  completedAt?: string | null;
  course?: Course | null;
  student?: User | null;
  progress?: CourseProgressSummary;
  certificate?: Certificate | null;
}

export interface Certificate {
  id: number | string;
  documentId?: string;
  code: string;
  issuedAt: string;
  studentName: string;
  courseTitle: string;
  status?: "ISSUED" | "REVOKED" | null;
  student?: User | null;
  course?: {
    id: number | string;
    documentId?: string;
    title?: string;
    slug?: string;
  } | null;
}

export interface CourseProgressSummary {
  totalLessons: number;
  completedCount: number;
  percentage: number;
}

export interface LessonProgress {
  id: number | string;
  completed?: boolean;
  completedAt?: string | null;
  lesson?: Lesson | null;
}

export interface ModuleGate {
  moduleId: number | string;
  moduleDocumentId?: string;
  moduleTitle?: string;
  order?: number;
  unlocked: boolean;
  quizId?: number | string | null;
  quizDocumentId?: string | null;
  quizTitle?: string | null;
  passPercent?: number;
  bestScore?: number | null;
  quizPassed?: boolean;
}

export interface CourseProgress {
  course: { id: number | string; documentId?: string; title: string };
  totalLessons: number;
  completedCount: number;
  percentage: number;
  lessons: LessonProgress[];
  moduleGates?: ModuleGate[];
  passRule?: { requiredPercent: number; description: string };
}

export interface QuizAttempt {
  id: number | string;
  documentId?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  submittedAt?: string;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: number | string;
  isCorrect?: boolean;
  question?: QuizQuestion | null;
  selectedOption?: QuizOption | null;
}

export interface BlogPost {
  id: number | string;
  documentId?: string;
  title: string;
  slug: string;
  body?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  status: BlogStatus;
  author?: User | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface ApiListResponse<T> {
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface ApiDataResponse<T> {
  data: T;
}

export interface StudentDashboard {
  user: User | null;
  enrolledCount: number;
  completedCourses: number;
  quizAttempts: number;
  courses: Array<{
    enrollment: Enrollment;
    progress: { percentage: number } & Partial<CourseProgressSummary>;
  }>;
}

export interface InstructorDashboard {
  user: User | null;
  courseCount: number;
  enrollmentCount: number;
  courses: Array<{
    id: number | string;
    documentId?: string;
    title: string;
    status: CourseStatus;
    lessonCount: number;
    quizCount: number;
    enrollmentCount: number;
  }>;
}

export interface ContentManagerDashboard {
  user: User | null;
  courses: number;
  publishedCourses?: number;
  draftCourses?: number;
  blogPosts: number;
  publishedBlog: number;
  draftBlog: number;
  categories?: number;
  lessons?: number;
  quizzes?: number;
  activeBanners?: number;
  recentCourses?: Array<{
    id: number | string;
    documentId?: string;
    title: string;
    status: CourseStatus;
    instructor?: User | null;
    updatedAt?: string;
  }>;
}

export interface AdminDashboard {
  user: User | null;
  users: number;
  courses: number;
  enrollments: number;
  blogPosts: number;
  quizzes: number;
  certificates?: number;
  bannedUsers?: number;
  students?: number;
  activeStudents?: number;
  instructors?: number;
  publishedCourses?: number;
  draftCourses?: number;
  completedEnrollments?: number;
  completionRate?: number;
  revenue?: number;
  activeCoupons?: number;
  activeBanners?: number;
  usersByRole: Record<string, number>;
}

export interface Banner {
  id: number | string;
  documentId?: string;
  title: string;
  subtitle?: string | null;
  eyebrow?: string | null;
  personRole?: string | null;
  ctaLabel?: string | null;
  linkUrl?: string | null;
  imageUrl?: string | null;
  placement?: "HOME" | "CATALOG" | "BOTH";
  style?: "HERO" | "STRIP" | "STORY";
  showTitle?: boolean;
  showSubtitle?: boolean;
  showCta?: boolean;
  showBrowseCourses?: boolean;
  showAuthButton?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface Coupon {
  id: number | string;
  documentId?: string;
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  isActive?: boolean;
  maxUses?: number | null;
  usedCount?: number;
  expiresAt?: string | null;
  minAmount?: number;
}

export interface CourseReview {
  id: number | string;
  documentId?: string;
  rating: number;
  body?: string | null;
  student?: { name?: string | null } | null;
}

export interface LiveSession {
  id: number | string;
  documentId?: string;
  title: string;
  startsAt?: string;
  meetingUrl?: string;
  attendeeIds?: Array<number | string>;
}

export interface CourseAnnouncement {
  id: number | string;
  documentId?: string;
  title: string;
  content?: string | null;
}

export interface WishlistItem {
  id: number | string;
  documentId?: string;
  course?: Pick<Course, "id" | "documentId" | "title" | "slug" | "shortDescription"> | null;
}

export interface SupportTicket {
  id: number | string;
  documentId?: string;
  ticketNumber: string;
  subject: string;
  body?: string | null;
  status?: string;
  priority?: string;
  createdAt?: string;
}

export interface TranscriptCourseRow {
  courseTitle: string;
  courseSlug?: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  bestQuizPercent?: number | null;
  completedAt?: string | null;
}

export interface StudentTranscript {
  student?: User;
  generatedAt?: string;
  courses: TranscriptCourseRow[];
}

export interface StrapiListResponse<T> {
  data: Array<{
    id: number;
    documentId?: string;
    attributes?: T;
  } & T>;
  meta?: {
    pagination?: PaginationMeta;
  };
}

export type AuthUser = User & { role?: RoleLike };

export type { RoleName };
