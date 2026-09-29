const fs = require('fs');

const files = [
  'src/pages/app/StudentDashboardPage.tsx',
  'src/pages/app/ProgressPage.tsx',
  'src/pages/app/SessionHistoryPage.tsx',
  'src/pages/app/ProfilePage.tsx',
  'src/pages/app/NotificationsPage.tsx',
  'src/pages/app/CertificatesPage.tsx',
  'src/pages/app/SquadsListPage.tsx',
  'src/pages/app/SquadPage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Typography
  // Instead of a blind replace of 400/500 to 600, let's also ensure font-medium is added where appropriate
  // We can just replace text-slate-400 and text-slate-500 with text-slate-600 font-medium.
  // Then we clean up any duplicate font-medium, font-bold, font-semibold
  content = content.replace(/text-slate-[45]00/g, 'text-slate-600 font-medium');
  content = content.replace(/font-medium\s+font-medium/g, 'font-medium');
  content = content.replace(/font-semibold\s+font-medium/g, 'font-semibold');
  content = content.replace(/font-medium\s+font-semibold/g, 'font-semibold');
  content = content.replace(/font-bold\s+font-medium/g, 'font-bold');
  content = content.replace(/font-medium\s+font-bold/g, 'font-bold');
  
  // 2. Card padding p-6 -> p-4 sm:p-5 md:p-6
  content = content.replace(/(<Card[^>]*className="[^"]*?)\bp-6\b([^"]*")/g, '$1p-4 sm:p-5 md:p-6$2');

  // 3. Button whitespace-nowrap
  content = content.replace(/(<Button[^>]*className="[^"]*?)"/g, (match, p1) => {
    if (!p1.includes('whitespace-nowrap')) {
       return p1 + ' whitespace-nowrap"';
    }
    return match;
  });
  
  // Also Button without className
  content = content.replace(/<Button(?![^>]*className=)([^>]*)>/g, '<Button className="whitespace-nowrap"$1>');
  
  // 4. Grid/flex layouts on mobile
  content = content.replace(/className="([^"]*?)\bgrid-cols-2\b([^"]*?)"/g, (match, p1, p2) => {
      // If it doesn't already have responsive breakpoints
      if (!p1.includes('sm:') && !p1.includes('md:') && !p1.includes('lg:') && !p2.includes('sm:') && !p2.includes('md:') && !p2.includes('lg:')) {
         return 'className="' + p1 + 'grid-cols-1 sm:grid-cols-2' + p2 + '"';
      }
      return match;
  });
  
  content = content.replace(/className="([^"]*?)\bgrid-cols-3\b([^"]*?)"/g, (match, p1, p2) => {
      if (!p1.includes('sm:') && !p1.includes('md:') && !p1.includes('lg:') && !p2.includes('sm:') && !p2.includes('md:') && !p2.includes('lg:')) {
         return 'className="' + p1 + 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' + p2 + '"';
      }
      return match;
  });
  
  content = content.replace(/className="([^"]*?)\bgrid-cols-4\b([^"]*?)"/g, (match, p1, p2) => {
      if (!p1.includes('sm:') && !p1.includes('md:') && !p1.includes('lg:') && !p2.includes('sm:') && !p2.includes('md:') && !p2.includes('lg:')) {
         return 'className="' + p1 + 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' + p2 + '"';
      }
      return match;
  });
  
  fs.writeFileSync(file, content);
  console.log('Processed', file);
});
