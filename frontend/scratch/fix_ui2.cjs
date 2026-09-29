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
  
  // Fix double className on Button
  content = content.replace(/<Button\s+className="whitespace-nowrap"([^>]*?)className="([^"]*?)"/gs, '<Button$1className="whitespace-nowrap $2"');
  
  content = content.replace(/p-4 sm:p-5 md:p-6 sm:p-4 sm:p-5 md:p-6/g, 'p-4 sm:p-5 md:p-6');
  content = content.replace(/p-5 sm:p-4 sm:p-5 md:p-6/g, 'p-4 sm:p-5 md:p-6');
  content = content.replace(/p-4 sm:p-5 md:p-6 md:p-6/g, 'p-4 sm:p-5 md:p-6');
  
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
