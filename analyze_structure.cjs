const fs = require('fs');
const content = fs.readFileSync('C:/Users/samta/OneDrive/Desktop/Websites/toybox/src/components/Battle3D/BoardgamePvP.jsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
let inString = false;
let inComment = false;
let componentStack = [];

for(let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let charBefore = '';

  for(let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1] || '';

    // Handle comments
    if(!inString && char === '/' && nextChar === '/') {
      break; // Rest of line is comment
    }

    // Handle strings
    if(char === '"' || char === "'") {
      if(charBefore !== '\\') {
        inString = !inString;
      }
    }

    if(!inString) {
      if(char === '{') {
        depth++;
        // Check if this starts a component or function
        const trimmed = line.substring(0, j).trim();
        if(trimmed.includes('const ToyboxBoard') || trimmed.includes('const BoardgamePvP')) {
          componentStack.push({name: trimmed.split(' ')[1], startLine: i + 1, startDepth: depth});
        }
      }
      if(char === '}') {
        depth--;
        // Check if this closes a component
        if(componentStack.length > 0 && depth < componentStack[componentStack.length - 1].startDepth) {
          const comp = componentStack.pop();
          console.log(`Component ${comp.name} closes at line ${i + 1} (started at line ${comp.startLine})`);
        }
      }
    }

    charBefore = char;
  }

  // Log important lines
  if(i === 9) console.log(`Line 10: depth = ${depth} (ToyboxBoard starts)`);
  if(i === 370) console.log(`Line 371: depth = ${depth}`);
  if(i === 377) console.log(`Line 378: depth = ${depth}`);
  if(i === 389) console.log(`Line 390: depth = ${depth}`);
  if(i === 401) console.log(`Line 402: depth = ${depth}`);
  if(i === 403) console.log(`Line 404: depth = ${depth}`);
  if(i === 404) console.log(`Line 405 (return): depth = ${depth}`);

  if(i === 404 && depth === 0) {
    console.log('ERROR: Return statement at line 405 is at module level!');
  }
}

console.log(`\nFinal depth: ${depth}`);
if(componentStack.length > 0) {
  console.log('Unclosed components:', componentStack);
}