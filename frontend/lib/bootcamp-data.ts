export const BOOTCAMP_YOUTUBE = "https://www.youtube.com/@CPSAcademy";

export const bootcampHighlights = [
  {
    title: "20 live classes",
    description: "Interactive sessions with expert instructors",
  },
  {
    title: "100+ problems & video solutions",
    description: "Hands-on coding practice with detailed video explanations",
  },
  {
    title: "Multiple contests",
    description: "11 long contests and 2 short contests",
  },
  {
    title: "Free scholarships",
    description: "Top 10 performers get full course access",
  },
];

export const bootcampAudience = [
  "First-year university students",
  "HSC pass-outs waiting for admission",
  "Anyone eager to begin coding",
  "Complete beginners with no experience",
];

export const bootcampBenefits = [
  "20 interactive classes",
  "Access to all recorded sessions",
  "Contest participation & rankings",
  "Direct mentorship from experts",
  "Certificate of completion",
  "Chance to win full scholarships",
];

export const trainerReasons = [
  {
    title: "Industry experience",
    description: "Real-world software development expertise",
  },
  {
    title: "ICPC performance",
    description: "Proven competitive programming skills",
  },
  {
    title: "Teaching excellence",
    description: "Passionate about mentoring beginners",
  },
];

export type BootcampTrainer = {
  name: string;
  role: string;
  company: string;
  subtitle?: string;
  achievements: string[];
  codeforces: { handle: string; rating: number };
};

export const bootcampTrainers: BootcampTrainer[] = [
  {
    name: "Adnan Zawad Toky",
    role: "Lead Trainer",
    company: "Cefalo",
    achievements: [
      "5th in ICPC West Continent Finals, 2021",
      "ICPC World Finalist, 2022",
      "Codeforces Master",
    ],
    codeforces: { handle: "adnan_toky", rating: 2269 },
  },
  {
    name: "Sayeef Mahmud",
    role: "Lead Trainer",
    company: "Cefalo",
    subtitle: "Associate Software Engineer",
    achievements: [
      "5th in ICPC West Continent Finals, 2021",
      "ICPC World Finalist, 2022",
      "Codeforces Master",
    ],
    codeforces: { handle: "thisIsMorningstar", rating: 2183 },
  },
  {
    name: "Md. Rakib Hossain",
    role: "Lead Trainer",
    company: "Inverse.AI",
    achievements: [
      "4th ICPC Dhaka Regional, 2024",
      "Asia West Continent Finalist, 2025",
      "Codeforces Master",
    ],
    codeforces: { handle: "RakibJoy", rating: 2136 },
  },
  {
    name: "Nafiul Islam",
    role: "Lead Trainer",
    company: "Samsung",
    subtitle: "BUET, CSE",
    achievements: [
      "5th in ICPC Preliminary, 2022",
      "Codeforces Candidate Master",
    ],
    codeforces: { handle: "Ami_Nafi", rating: 2034 },
  },
  {
    name: "Sajjad Sadi",
    role: "Lead Trainer",
    company: "AppsCode",
    achievements: [
      "3× ICPC West Finalist",
      "8th Dhaka Regional, 2023",
      "Codeforces Candidate Master",
    ],
    codeforces: { handle: "Sadi_74", rating: 1994 },
  },
  {
    name: "Muhammad Shahriar",
    role: "Lead Trainer",
    company: "Enosis (Ex Senior Software Engineer)",
    achievements: [
      "17th in Dhaka Regional, ICPC 2020",
      "Codeforces max: 1830",
      "Senior Software Engineer experience",
    ],
    codeforces: { handle: "_Muhammad", rating: 1830 },
  },
];

export type BootcampDay = {
  day: number;
  title: string;
  note?: string;
};

export const bootcampPhase1: BootcampDay[] = [
  { day: 1, title: "Intro to Programming, Problem-Solving & CP" },
  { day: 2, title: "Hello World, Data Types, Scanf", note: "Basic I/O Contest (10 problems, 2 days)" },
  { day: 3, title: "Practice Session with Real Problems" },
  { day: 4, title: "Conditional Statements", note: "Conditions Contest (10 problems, 2 days)" },
  { day: 5, title: "Practice on Conditions" },
  { day: 6, title: "Loops (while, for, nested)", note: "Loops Contest (10 problems, 2 days)" },
  { day: 7, title: "Loop Practice Problems" },
  { day: 8, title: "Arrays and Strings", note: "Arrays & Strings Contest (10 problems, 2 days)" },
  { day: 9, title: "Array & String Practice" },
  { day: 10, title: "Functions & Intro to C++", note: "Final Contest (10 problems, 5 hours)" },
];

export const bootcampPhase2: BootcampDay[] = [
  { day: 11, title: "C++ Basics & STL Overview" },
  { day: 12, title: "Vectors, Pairs & Iterators", note: "STL Basics Contest" },
  { day: 13, title: "Maps, Sets & Unordered Containers" },
  { day: 14, title: "String & Algorithm Headers" },
  { day: 15, title: "Sorting, Binary Search & Two Pointers", note: "Techniques Contest" },
  { day: 16, title: "Practice — Implementation Problems" },
  { day: 17, title: "Greedy & Prefix Techniques" },
  { day: 18, title: "Intro to Graphs & BFS/DFS", note: "Graph Contest" },
  { day: 19, title: "Contest Strategy & Problem Reading" },
  { day: 20, title: "Bootcamp Finale & Next Steps", note: "Final Long Contest" },
];
