/** Public-facing English copy for CPS Academy. */
export const copy = {
  nav: {
    signIn: "Sign in",
    createAccount: "Create account",
    dashboard: "Dashboard",
    profile: "My profile",
    notifications: "Notifications",
    signOut: "Sign out",
    signOutConfirm: "Sign out?",
    account: "Account",
  },
  footer: {
    links: "Links",
    tradeLicense: "Trade license",
    paymentAlt: "Accepted payment methods — verified by SSLCommerz",
    copyright: "All rights reserved.",
  },
  home: {
    catalogEyebrow: "Course catalog",
    featuredTitle: "Featured courses",
    featuredDesc:
      "Structured tracks for hands-on learning — from fundamentals to contest-ready skills.",
    viewAll: "View all",
    coursesUnavailable: "Courses unavailable.",
    noCourses:
      "No published courses yet. Check back soon or browse the catalog once new tracks go live.",
    platformEyebrow: "Platform",
    whyTitle: "Why CPS Academy",
    whyDesc:
      "A professional learning environment with courses, practice, progress tracking, and Sage — your AI study partner.",
    faqTitle: "Frequently asked questions",
    faqDesc: "Quick answers about learning on CPS Academy.",
    ctaTitle: "Ready to start learning?",
    ctaDesc:
      "Browse the catalog, enroll for free, and track your progress from day one.",
    browseCourses: "Browse courses",
    goDashboard: "Go to dashboard",
    createFreeAccount: "Create free account",
    placementsEyebrow: "Career outcomes",
    placementsTitle: "Where our students work",
    placementsDesc:
      "Graduates join top tech teams in Bangladesh and worldwide — from local offices to fully remote roles at companies like WellDev, Rokomari, Vivasoft, and CholoBD.",
    features: [
      {
        title: "Sage AI assistant",
        text: "Get guided help from Sage to understand concepts, debug approaches, and learn problem-solving step by step.",
      },
      {
        title: "Progress tracking",
        text: "Mark lessons complete and watch your course percentage stay in sync across sessions.",
      },
      {
        title: "Auto-graded quizzes",
        text: "Submit answers and get server-side scoring with full attempt history.",
      },
      {
        title: "Expert-led courses",
        text: "Structured lessons with text and video content designed for real skill growth.",
      },
      {
        title: "Academy operations",
        text: "Role-based workspaces for students, instructors, content managers, and admins.",
      },
    ],
    faqs: [
      {
        q: "Who is CPS Academy for?",
        a: "Students preparing for competitive programming and software engineering roles, plus instructors and admins who manage content and enrollments.",
      },
      {
        q: "What is Sage?",
        a: "Sage is your AI learning assistant. It helps you understand topics, work through problems, and study more effectively — without doing the work for you.",
      },
      {
        q: "How do quizzes work?",
        a: "Quizzes are graded on the server. Review attempt history and learn from your results.",
      },
      {
        q: "Do I need an account to browse courses?",
        a: "You can browse the public catalog freely. Sign in to enroll, use Sage, take quizzes, and save progress.",
      },
    ],
  },
  trust: {
    text: "Trusted by learners preparing for software engineering interviews and contests",
    courses: (n: number) => (n > 0 ? `${n} courses` : "Course catalog"),
    learnerFirst: "Learner-first platform",
    progress: "Progress & certificates",
  },
  success: {
    eyebrow: "Success stories",
    title: "Learners who grew with CPS Academy",
    desc: "Real students, real progress — structured learning that helps them level up.",
    noPhoto: "No photo",
    defaultLearner: "A CPS Academy learner",
    readStory: "Read their story",
  },
  courses: {
    allDesc: "Explore published courses and enroll to start learning.",
    bootcampDesc:
      "20-day free programming and C++ STL bootcamp — live classes, contests, and scholarships.",
    unavailable: "Courses unavailable",
    apiHint: "Start the API with",
    apiHint2: "from the project root, then refresh.",
    search: "Search courses…",
    allCategories: "All",
    noResults: "No courses found",
    noResultsDesc: "Try a different search term or category.",
  },
  blog: {
    eyebrow: "CPS Academy Blog",
    title: "Learn, grow, and stay inspired",
    desc: "Guides, career tips, and platform updates for aspiring software engineers.",
    noPosts: "No posts yet",
    noPostsDesc: "Published articles will appear here.",
    latest: "Latest articles",
    latestDesc: "Fresh reads from the CPS Academy team",
    exploreCourses: "Explore courses",
    newsletterTitle: "Stay up to date",
    newsletterDesc:
      "Get new blog posts, course launches, and learning tips from CPS Academy.",
    yourName: "Your name",
    email: "Email address",
    subscribe: "Subscribe",
    createFree: "Create free account",
    emailRequired: "Please enter your email address.",
    subscribeThanks:
      "Thanks! Create a free account to get course updates and blog alerts.",
  },
} as const;
