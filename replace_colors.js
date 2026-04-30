const fs = require('fs');
const path = require('path');
const mapping = {
  '#536878': 'var(--color-text-muted)',
  '#CCDAE4': 'var(--color-border)',
  '#C47E2A': 'var(--color-amber)',
  '#3B6B7C': 'var(--color-primary)',
  '#E6F4EA': 'var(--color-green-bg)',
  '#CDE9D6': 'var(--color-green-border)',
  '#2E6B52': 'var(--color-green)'
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [hex, cssVar] of Object.entries(mapping)) {
        // Replace '#HEX' in quotes
        const styleRegex = new RegExp(`'${hex}'`, 'gi');
        if (styleRegex.test(content)) {
          content = content.replace(styleRegex, `'${cssVar}'`);
          changed = true;
        }
        
        // Replace Tailwind classes like bg-[#HEX]
        const twRegex = new RegExp(`\\[${hex}\\]`, 'gi');
        if (twRegex.test(content)) {
          content = content.replace(twRegex, `[${cssVar}]`);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir('app');
processDir('components');
