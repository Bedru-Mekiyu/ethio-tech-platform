const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\AFRO-EAGLE\\ethio-tech-platform';
const files = [
  'frontend/src/pages/mentor/MentorDashboardPage.tsx',
  'frontend/src/pages/mentor/MentorSessionsPage.tsx',
  'frontend/src/pages/mentor/MentorStudentsPage.tsx',
  'frontend/src/pages/mentor/MentorReviewPage.tsx',
  'frontend/src/pages/mentor/MentorAvailabilityPage.tsx',
  'frontend/src/pages/mentor/MentorOnboardingPage.tsx',
  'frontend/src/pages/mentor/control-center/EngagementPanel.tsx',
  'frontend/src/pages/mentor/control-center/WaitingRoomPanel.tsx',
  'frontend/src/pages/mentor/control-center/SessionOverviewPanel.tsx',
  'frontend/src/pages/mentor/control-center/ChatPanel.tsx',
  'frontend/src/pages/mentor/control-center/NotesPanel.tsx',
  'frontend/src/pages/mentor/control-center/NotificationsPanel.tsx',
  'frontend/src/pages/mentor/control-center/ParticipantPanel.tsx',
  'frontend/src/pages/mentor/control-center/PollsPanel.tsx',
  'frontend/src/pages/mentor/control-center/QuestionsPanel.tsx',
  'frontend/src/pages/mentor/control-center/RaisedHandsPanel.tsx',
  'frontend/src/pages/mentor/control-center/RecordingsPanel.tsx',
  'frontend/src/pages/mentor/control-center/ResourcesPanel.tsx',
  'frontend/src/pages/admin/AdminPage.tsx',
  'frontend/src/pages/admin/AdminUsersPage.tsx',
  'frontend/src/pages/admin/AdminModerationPage.tsx',
  'frontend/src/pages/admin/AdminMentorDetailPage.tsx',
  'frontend/src/pages/admin/AdminOperationsPage.tsx',
  'frontend/src/pages/admin/AdminMeetingsPage.tsx',
  'frontend/src/pages/admin/AdminGamificationPage.tsx',
  'frontend/src/pages/admin/AdminContentPage.tsx',
  'frontend/src/components/admin/UserTable.tsx',
  'frontend/src/components/admin/MentorDetailsDrawer.tsx'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Decorative icon containers (non-semantic) e.g. blue, slate
  content = content.replace(/(bg-blue-50(?!.*dark:)[^"']*border-blue-100[^"']*text-\[var\(--secondary\)\])/g, '$1 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300');
  content = content.replace(/(bg-slate-100(?!.*dark:)[^"']*text-slate-900[^"']*border-slate-200)/g, '$1 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300');

  // 2. Amber/warning semantic icon containers (single signal)
  content = content.replace(/(bg-amber-50(?!.*dark:)[^"']*text-amber-[678]00[^"']*border-amber-[12]00(?:\/80)?)/g, '$1 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400');
  content = content.replace(/(bg-amber-100(?!.*dark:)[^"']*text-amber-[67]00)/g, '$1 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400');
  // Specific catch for amber icon wrappers
  content = content.replace(/(bg-amber-50(?!.*dark:)[^"']*border-amber-200 text-amber-600)/g, '$1 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400');

  // 3. Double-signaled state (parent container)
  // Usually border-amber-200 bg-amber-50/50 -> dark:bg-slate-900 dark:border-white/10
  content = content.replace(/(border-amber-200(?!.*dark:)[^"']*bg-amber-50\/50)/g, '$1 dark:bg-slate-900 dark:border-white/10');
  content = content.replace(/(bg-amber-50\/50(?!.*dark:)[^"']*border-amber-200)/g, '$1 dark:bg-slate-900 dark:border-white/10');

  // 4. Error state panels (red)
  content = content.replace(/(border-red-200(?!.*dark:)[^"']*bg-red-50)/g, '$1 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400');
  content = content.replace(/(bg-red-50(?!.*dark:)[^"']*border-red-200)/g, '$1 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400');

  // 5. Top-3 rank chips (amber/gold highlight)
  content = content.replace(/(border-amber-200(?!.*dark:)[^"']*bg-amber-50\/40)/g, '$1 dark:bg-amber-950/30 dark:text-amber-300');

  // 6. Nested sub-panels inside cards (slate-50/50, slate-50/60)
  content = content.replace(/(bg-slate-50\/[56]0(?!.*dark:)[^"']*border-slate-200(?:\/80)?)/g, '$1 dark:bg-white/[0.02] dark:border-white/10');
  content = content.replace(/(border-slate-200(?:\/80)?(?!.*dark:)[^"']*bg-slate-50\/[56]0)/g, '$1 dark:bg-white/[0.02] dark:border-white/10');
  content = content.replace(/(bg-slate-50\/[56]0(?!.*dark:))/g, (match, p1) => {
    if (!match.includes('border-slate-200')) {
      return p1 + ' dark:bg-white/[0.02]';
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

for (const relPath of files) {
  const fullPath = path.join(root, relPath);
  if (fs.existsSync(fullPath)) {
    processFile(fullPath);
  } else {
    console.warn(`File not found: ${fullPath}`);
  }
}
