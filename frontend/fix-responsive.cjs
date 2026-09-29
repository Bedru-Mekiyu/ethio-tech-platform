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

  // Buttons/CTAs:
  // "flex gap-3" for buttons -> "flex flex-col sm:flex-row gap-3"
  content = content.replace(/className="([^"]*)flex flex-wrap justify-center gap-3([^"]*)"/g, 'className="$1flex flex-col sm:flex-row flex-wrap justify-center gap-3$2"');
  content = content.replace(/className="([^"]*)flex flex-wrap gap-2\.5([^"]*)"/g, 'className="$1flex flex-col sm:flex-row flex-wrap gap-2.5$2"');
  content = content.replace(/className="([^"]*)flex gap-2\.5([^"]*)"/g, 'className="$1flex flex-col sm:flex-row gap-2.5$2"');
  content = content.replace(/className="([^"]*)flex flex-col gap-3 sm:flex-row([^"]*)"/g, 'className="$1flex flex-col sm:flex-row gap-3$2"');

  // Any standalone CTA buttons: ensure `w-full sm:w-auto`
  content = content.replace(/<Button([^>]*)className="([^"]*)"([^>]*)>/g, (match, p1, p2, p3) => {
    let newClass = p2;
    if (newClass.includes('w-full') && newClass.includes('sm:w-auto')) return match; 
    if (p1.includes('size="lg"') || p3.includes('size="lg"')) {
      if (!newClass.includes('w-full')) newClass += ' w-full sm:w-auto';
    }
    return `<Button${p1}className="${newClass.trim()}"${p3}>`;
  });

  // Card Grids:
  content = content.replace(/md:grid-cols-3/g, 'sm:grid-cols-2 md:grid-cols-3');
  content = content.replace(/([^"]*)lg:grid-cols-4([^"]*)/g, (match, p1, p2) => {
    if (!match.includes('sm:grid-cols-2') && !match.includes('md:grid-cols-2') && !match.includes('md:grid-cols-3') && !match.includes('sm:grid-cols-3')) {
      return match.replace('lg:grid-cols-4', 'sm:grid-cols-2 lg:grid-cols-4');
    }
    return match;
  });
  
  content = content.replace(/grid-cols-2(?! sm:)/g, 'grid-cols-1 sm:grid-cols-2');

  // Text:
  content = content.replace(/text-4xl/g, 'text-3xl sm:text-4xl');
  content = content.replace(/text-5xl/g, 'text-4xl sm:text-5xl');

  content = content.replace(/sm:text-3xl sm:text-4xl/g, 'sm:text-4xl');
  content = content.replace(/text-3xl sm:text-3xl sm:text-4xl/g, 'text-3xl sm:text-4xl');
  content = content.replace(/sm:text-4xl sm:text-5xl/g, 'sm:text-5xl');
  
  content = content.replace(/text-3xl sm:text-4xl lg:text-\[2\.65rem\]/g, 'text-3xl sm:text-4xl lg:text-[2.65rem]');
  
  content = content.replace(/<h1 className="([^"]*)"/g, (m, c) => {
      if (!c.includes('break-words')) return `<h1 className="${c} break-words"`;
      return m;
  });
  content = content.replace(/<h2 className="([^"]*)"/g, (m, c) => {
      if (!c.includes('break-words')) return `<h2 className="${c} break-words"`;
      return m;
  });

  // Other:
  content = content.replace(/min-h-\[440px\]/g, 'min-h-[280px] sm:min-h-[440px]');
  
  fs.writeFileSync(file, content, 'utf8');
}
console.log("Done");
