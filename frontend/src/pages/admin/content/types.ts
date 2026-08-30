export interface Track {
  _id: string;
  title: string;
  description?: string;
  category?: "web" | "mobile" | "cloud" | "ai" | "security" | "design" | "awareness" | "beginner" | "intermediate" | "advanced" | string;
  isActive?: boolean;
  xpReward?: number;
  estimatedWeeks?: number;
  modules?: Array<{ _id: string; title: string; lessons?: Array<{ _id: string; title?: string }> }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Module {
  _id: string;
  title: string;
  description?: string;
  track: string;
  order?: number;
  lessons?: Array<{ _id: string; title?: string; order?: number } | Lesson>;
  createdAt?: string;
  updatedAt?: string;
}

export type LessonType = "video" | "code-lab" | "quiz" | "project" | "concept" | "hands-on" | "project-checkpoint";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Lesson {
  _id: string;
  title: string;
  content?: string;
  summary?: string;
  type?: LessonType;
  videoUrl?: string;
  codeSandboxUrl?: string;
  starterCode?: string;
  challengeTask?: string;
  xpReward?: number;
  module: string;
  durationMinutes?: number;
  order?: number;
  quiz?: QuizQuestion[];
  prerequisites?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CapstoneProjectItem {
  _id: string;
  title: string;
  description?: string;
  track: string;
  difficulty?: "easy" | "medium" | "hard" | "Intermediate" | "Advanced" | "Production-Grade";
  xpReward?: number;
  githubTemplate?: string;
  requirements?: string[];
  deliverables?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type ContentSelection =
  | { type: "track"; trackId: string }
  | { type: "module"; trackId: string; moduleId: string }
  | { type: "lesson"; trackId: string; moduleId: string; lessonId: string }
  | { type: "new-track" }
  | { type: "new-module"; trackId: string }
  | { type: "new-lesson"; trackId: string; moduleId: string };

export interface CategoryOption {
  value: string;
  label: string;
  iconName: string;
  badgeColor: "cyan" | "purple" | "success" | "warning" | "default";
}

export const CATEGORY_FILTERS: CategoryOption[] = [
  { value: "all", label: "All Categories", iconName: "Layers", badgeColor: "default" },
  { value: "web", label: "Web", iconName: "Globe", badgeColor: "cyan" },
  { value: "mobile", label: "Mobile", iconName: "Smartphone", badgeColor: "purple" },
  { value: "cloud", label: "Cloud", iconName: "Cloud", badgeColor: "success" },
  { value: "ai", label: "AI & ML", iconName: "Cpu", badgeColor: "warning" },
  { value: "security", label: "Security", iconName: "Shield", badgeColor: "default" },
  { value: "design", label: "Design", iconName: "Palette", badgeColor: "purple" },
];

export const TRACK_CATEGORY_OPTIONS: Array<{ value: string; label: string; group: string }> = [
  { value: "web", label: "Fullstack Web Development", group: "Technical Domain" },
  { value: "mobile", label: "Mobile App Development", group: "Technical Domain" },
  { value: "cloud", label: "Cloud & DevOps Engineering", group: "Technical Domain" },
  { value: "ai", label: "Data Science & AI", group: "Technical Domain" },
  { value: "security", label: "Cyber Security", group: "Technical Domain" },
  { value: "design", label: "UI/UX Engineering", group: "Technical Domain" },
  { value: "beginner", label: "Beginner Foundations", group: "Skill Level" },
  { value: "intermediate", label: "Intermediate", group: "Skill Level" },
  { value: "advanced", label: "Advanced Mastery", group: "Skill Level" },
  { value: "awareness", label: "Awareness & Literacy", group: "Skill Level" },
];

export const LESSON_TYPES: Array<{
  value: LessonType;
  label: string;
  description: string;
  iconName: string;
  badgeVariant: "default" | "cyan" | "purple" | "success" | "warning";
}> = [
  {
    value: "video",
    label: "Video Lecture",
    description: "Streamed lecture or guided walkthrough with rich notes",
    iconName: "PlayCircle",
    badgeVariant: "purple",
  },
  {
    value: "code-lab",
    label: "Hands-on Code Lab",
    description: "Interactive coding exercises with starter sandbox code",
    iconName: "Code2",
    badgeVariant: "success",
  },
  {
    value: "concept",
    label: "Concept Guide",
    description: "Comprehensive written guide, architecture diagrams & theory",
    iconName: "BookOpen",
    badgeVariant: "cyan",
  },
  {
    value: "quiz",
    label: "Knowledge Quiz",
    description: "Multiple-choice checkpoints to test retention",
    iconName: "HelpCircle",
    badgeVariant: "warning",
  },
  {
    value: "project",
    label: "Capstone Checkpoint",
    description: "Major milestone or project submission requirement",
    iconName: "Award",
    badgeVariant: "default",
  },
];
