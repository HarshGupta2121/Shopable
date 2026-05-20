const { ESLint } = require("eslint");
const fs = require('fs');

(async function main() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(["src/**/*.js", "src/**/*.jsx"]);
  const issues = results
    .filter(r => r.errorCount > 0 || r.warningCount > 0)
    .map(r => ({
      file: r.filePath,
      errors: r.messages.map(m => `${m.line}:${m.column} - ${m.ruleId} - ${m.message}`)
    }));
  
  fs.writeFileSync('eslint-output.json', JSON.stringify(issues, null, 2));
  console.log("Done");
})().catch(console.error);
