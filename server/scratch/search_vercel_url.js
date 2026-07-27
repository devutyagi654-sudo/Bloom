const fs = require('fs');
const path = require('path');

const logPath = 'C:/Users/nikhi/.gemini/antigravity-ide/brain/2246beba-362f-4d76-aec2-11d99e7712db/.system_generated/logs/transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const urls = new Set();
  
  lines.forEach(line => {
    if (!line.trim()) return;
    const matches = line.match(/https?:\/\/[^\s"']+/g);
    if (matches) {
      matches.forEach(url => {
        // clean trailing punctuation
        const cleanUrl = url.replace(/[.,`*()]$/, '');
        if (!cleanUrl.includes('github.com') && 
            !cleanUrl.includes('unsplash.com') && 
            !cleanUrl.includes('npmjs.com') && 
            !cleanUrl.includes('npm') && 
            !cleanUrl.includes('vite') && 
            !cleanUrl.includes('localhost')) {
          urls.add(cleanUrl);
        }
      });
    }
  });
  
  console.log('--- FOUND URLS ---');
  console.log(Array.from(urls));
} catch (err) {
  console.error(err);
}
