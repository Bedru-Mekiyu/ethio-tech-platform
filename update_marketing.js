const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/AFRO-EAGLE/ethio-tech-platform/frontend/src/pages/marketing';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  
  content = content.replace(/className="([^"]*(?:bg-blue-50(?:\/70)?|bg-indigo-50|bg-slate-100|bg-slate-50)[^"]*)"/g, (match, classes) => {
    if (classes.includes('dark:bg-white/[0.04]') || classes.includes('dark:bg-slate-900') || classes.includes('dark:bg-transparent')) return match;
    
    if (classes.includes('text-[var(--secondary)]') || classes.includes('bg-slate-100') || classes.includes('bg-blue-50') || classes.includes('bg-indigo-50')) {
       return `className="${classes} dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300"`;
    }
    
    return match;
  });
  
  content = content.replace(/className="([^"]*bg-slate-50\/50[^"]*)"/g, (match, classes) => {
    if (!classes.includes('dark:')) return `className="${classes} dark:bg-transparent"`;
    return match;
  });
  content = content.replace(/className="([^"]*bg-slate-50\/70[^"]*)"/g, (match, classes) => {
    if (!classes.includes('dark:')) return `className="${classes} dark:bg-transparent"`;
    return match;
  });
  content = content.replace(/className="([^"]*bg-\[radial-gradient[^"]*)"/g, (match, classes) => {
    if (!classes.includes('dark:')) return `className="${classes} dark:opacity-20"`;
    return match;
  });
  
  content = content.replace(/dark:bg-white\/\[0\.04\] dark:border-white\/10 dark:text-slate-300 dark:bg-white\/\[0\.04\] dark:border-white\/10 dark:text-slate-300/g, 'dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300');
  
  fs.writeFileSync(p, content, 'utf8');
}
console.log('Done');
