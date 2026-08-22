const fs = require('fs');
let code = fs.readFileSync('src/app/api/empresa/config/route.ts', 'utf8');

code = code.replace(
  '        onboardingData: {',
  '        is_active: siteClinic?.is_active !== false,\n        onboardingData: {'
);

fs.writeFileSync('src/app/api/empresa/config/route.ts', code);
console.log("Injected is_active into config GET response");
