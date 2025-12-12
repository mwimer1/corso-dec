const fg = require('fast-glob');
/* `no-console` is acceptable here because this is a small CLI guard script */
const fs = require('fs');

(async () => {
  const files = await fg(['**/*.module.css', '!**/node_modules/**', '!**/.next/**']);
  let failing = false;

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (/^\s*:global\(/m.test(text)) {
      console.error(`❌ Top-level :global(...) is banned in CSS Modules: ${file}`);
      failing = true;
    }
  }
  if (failing) process.exit(1);
  console.log('✅ CSS Module global guard passed.');
})().catch((e) => { console.error(e); process.exit(1); });


