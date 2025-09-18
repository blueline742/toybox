const fs = require('fs');
const content = fs.readFileSync('C:/Users/samta/OneDrive/Desktop/Websites/toybox/src/components/Battle3D/BoardgamePvP.jsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
let componentDepth = 0;

for(let i = 0; i < Math.min(410, lines.length); i++) {
  const line = lines[i];
  const prevDepth = depth;

  for(const char of line) {
    if(char === '{') depth++;
    if(char === '}') depth--;
  }

  if(i === 9) {
    componentDepth = depth;
    console.log('Line 10 (ToyboxBoard starts): depth =', depth);
  }

  if(depth < componentDepth && i > 10 && i < 632) {
    console.log(`ERROR: ToyboxBoard closes early at line ${i+1}`);
    console.log(`Line content: ${lines[i].trim()}`);
    console.log(`Depth before: ${prevDepth}, after: ${depth}`);
  }

  if(i === 370) {
    console.log(`Line 371: depth = ${depth} (should be ${componentDepth} if still in ToyboxBoard)`);
  }

  if(i === 404) {
    console.log(`Line 405 (return statement): depth = ${depth} (should be ${componentDepth} if still in ToyboxBoard)`);
  }
}