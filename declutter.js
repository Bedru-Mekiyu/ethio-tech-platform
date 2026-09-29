const fs = require('fs');
const path = require('path');

const files = [
  "frontend/src/pages/app/StudentDashboardPage.tsx",
  "frontend/src/pages/app/ProgressPage.tsx",
  "frontend/src/pages/app/CalendarPage.tsx",
  "frontend/src/pages/app/CodingWorkspacePage.tsx",
  "frontend/src/pages/app/SquadPage.tsx",
  "frontend/src/pages/app/SquadsListPage.tsx",
  "frontend/src/pages/app/LessonPage.tsx",
  "frontend/src/pages/app/NotificationsPage.tsx",
  "frontend/src/pages/app/SessionFeedbackPage.tsx",
  "frontend/src/pages/app/CertificatesPage.tsx",
  "frontend/src/pages/app/TracksPage.tsx",
  "frontend/src/pages/app/TrackDetailPage.tsx",
  "frontend/src/pages/app/MentorDirectoryPage.tsx",
  "frontend/src/pages/app/ProfilePage.tsx",
  "frontend/src/pages/app/SettingsPage.tsx",
  "frontend/src/pages/app/AssignedProjectsPage.tsx",
  "frontend/src/pages/app/ProjectSubmitPage.tsx",
  "frontend/src/pages/app/SessionHistoryPage.tsx"
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file}, not found`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Rule 1: Decorative icon containers
  content = content.replace(/className="([^"]*\bbg-blue-50\b[^"]*\btext-\[var\(--secondary\)\]\b[^"]*\bborder-blue-100\b[^"]*)"/g, (match, p1) => {
    if (!p1.includes('dark:bg-white/[0.04]')) {
      return `className="${p1} dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300"`;
    }
    return match;
  });
  
  content = content.replace(/className="([^"]*\bbg-amber-50\b[^"]*\btext-amber-600\b[^"]*\bborder-amber-100\b[^"]*)"/g, (match, p1) => {
    if (!p1.includes('dark:bg-white/[0.04]')) {
      return `className="${p1} dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300"`;
    }
    return match;
  });

  content = content.replace(/className="([^"]*\bbg-slate-100\b[^"]*\btext-slate-600\b[^"]*\bborder-slate-200\b[^"]*)"/g, (match, p1) => {
    if (!p1.includes('dark:bg-white/[0.04]')) {
      return `className="${p1} dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300"`;
    }
    return match;
  });

  // Rule 3: Nested sub-panels inside cards
  content = content.replace(/className="([^"]*\bbg-slate-50\/(?:70|80|60|40|50)\b[^"]*)"/g, (match, p1) => {
    if (!p1.includes('dark:bg-white/[0.02]')) {
      return `className="${p1} dark:bg-white/[0.02] dark:border-white/10"`;
    }
    return match;
  });

  // Rule 2: Double-signaled state
  // E.g. in ProgressPage ~558: "border-blue-200/80 bg-blue-50/50"
  content = content.replace(/"border-blue-200\/80 bg-blue-50\/50"/g, `"border-blue-200/80 bg-blue-50/50 dark:bg-slate-900 dark:border-white/10"`);
  
  content = content.replace(/"border-slate-200 bg-slate-50\/60 opacity-70"/g, `"border-slate-200 bg-slate-50/60 opacity-70 dark:bg-white/[0.02] dark:border-white/10"`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
console.log("Done");
