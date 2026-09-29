const fs = require('fs');
const path = require('path');

const files = [
  'HomePage.tsx',
  'AboutPage.tsx',
  'HowItWorksPage.tsx',
  'MentorsPage.tsx',
  'MentorRecruitmentPage.tsx',
  'HubsPage.tsx',
  'TracksPage.tsx',
  'MarketingTrackDetailPage.tsx',
  'LeaderboardPage.tsx',
  'PartnersPage.tsx',
  'DonationPage.tsx',
  'InfoPages.tsx',
].map(f => path.join('C:\\Users\\AFRO-EAGLE\\ethio-tech-platform\\frontend\\src\\pages\\marketing', f));
files.push('C:\\Users\\AFRO-EAGLE\\ethio-tech-platform\\frontend\\src\\pages\\NotFoundPage.tsx');

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} - not found`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');

  // Fix mistakes from previous regex
  content = content.replace(/md:grid-cols-1 sm:grid-cols-2/g, 'sm:grid-cols-2'); // previously md:grid-cols-2
  content = content.replace(/grid-cols-1 sm:grid-cols-2 gap-2\.5 sm:grid-cols-3/g, 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5'); // fix duplicate sm
  
  // also need to handle lg:grid-cols-1 sm:grid-cols-2 if it happened
  content = content.replace(/lg:grid-cols-1 sm:grid-cols-2/g, 'sm:grid-cols-2 lg:grid-cols-2');
  
  // sm:grid-cols-1 sm:grid-cols-2
  content = content.replace(/sm:grid-cols-1 sm:grid-cols-2/g, 'sm:grid-cols-2');
  
  fs.writeFileSync(file, content, 'utf8');
}
console.log("Fixes applied");
