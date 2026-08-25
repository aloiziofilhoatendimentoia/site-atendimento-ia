const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/otp/send/route.ts', 'utf8');

code = code.replace(
  "if (parsed.is_active === false) isActive = false;",
  "if (parsed.is_active === false) isActive = false;\n              if (parsed.is_deleted === true) isActive = false;"
);

fs.writeFileSync('src/app/api/auth/otp/send/route.ts', code);
console.log("Updated otp send route for deleted clinics.");
