const fs = require('fs');
const files = [
  'src/pages/app/TrackDetailPage.tsx',
  'src/pages/app/TracksPage.tsx',
  'src/pages/app/MentorDirectoryPage.tsx',
  'src/pages/app/CodingWorkspacePage.tsx',
  'src/pages/admin/content/CapstoneProjectEditor.tsx',
  'src/pages/admin/content/CodeSandboxStarterEditor.tsx',
  'src/pages/admin/content/MarkdownEditor.tsx',
  'src/pages/admin/content/QuizEditor.tsx',
  'src/pages/admin/content/VideoEmbedPreview.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Fix up those weird replaces
  content = content.replace(/p-5 sm:p-4 sm:p-5 md:p-6/g, 'p-4 sm:p-5 md:p-6');
  content = content.replace(/p-4 sm:p-5 md:p-4 sm:p-5 md:p-6/g, 'p-4 sm:p-5 md:p-6'); // in case

  fs.writeFileSync(file, content);
});
