const fs = require('fs');

const content = fs.readFileSync('c:/Users/nikhi/OneDrive/Desktop/BLM/client/src/components/Common/Navbar.jsx', 'utf8');

// A simple parser to count JSX tags in the return block of Navbar
// The return block starts with "return (" and ends before the component exports
const startIdx = content.indexOf('return (');
const endIdx = content.indexOf('export default Navbar;');

if (startIdx === -1) {
  console.log('Could not find return block start');
  process.exit(1);
}

const renderBlock = content.slice(startIdx, endIdx);

let openDivs = 0;
let lines = renderBlock.split('\n');

lines.forEach((line, i) => {
  const lineNum = i + 1;
  // Match <div ... > (ignoring comments)
  // Simple regex matches
  const openMatches = line.match(/<div(\s|>)/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];

  openDivs += openMatches.length;
  openDivs -= closeMatches.length;

  if (openMatches.length > 0 || closeMatches.length > 0) {
    console.log(`L${lineNum}: ${line.trim()} | Open divs: ${openDivs} (delta: +${openMatches.length} -${closeMatches.length})`);
  }
});

console.log('Final open divs:', openDivs);
