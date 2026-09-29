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

  // Replace text-slate-400 and text-slate-500
  content = content.replace(/text-slate-400/g, 'text-slate-600 font-medium');
  content = content.replace(/text-slate-500/g, 'text-slate-600 font-medium');

  // Replace p-6 on cards
  content = content.replace(/p-6/g, 'p-4 sm:p-5 md:p-6');
  
  // ensure flex-wrap for skill tags/badges/chips
  content = content.replace(/className="flex gap-2"/g, 'className="flex flex-wrap gap-2"');
  content = content.replace(/className="flex gap-3"/g, 'className="flex flex-wrap gap-3"');
  content = content.replace(/className="flex gap-1.5"/g, 'className="flex flex-wrap gap-1.5"');
  content = content.replace(/className="flex items-center gap-2"/g, 'className="flex flex-wrap items-center gap-2"');
  content = content.replace(/className="flex items-center gap-3"/g, 'className="flex flex-wrap items-center gap-3"');
  
  // Grid layout fixes - if grid-cols-X is used without sm:, add sm: or make it responsive
  content = content.replace(/grid-cols-2(?! sm:| md:| lg:)/g, 'grid-cols-1 sm:grid-cols-2');
  content = content.replace(/grid-cols-3(?! sm:| md:| lg:)/g, 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3');

  fs.writeFileSync(file, content);
});
console.log('Done processing files.');
