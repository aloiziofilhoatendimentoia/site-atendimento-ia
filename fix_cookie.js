const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/otp/verify/route.ts', 'utf8');

const regex = /maxAge: 60 \* 60 \* 24 \* 7, \/\/ 7 dias\r?\n\s*/;

if (code.match(regex)) {
  code = code.replace(regex, '');
  fs.writeFileSync('src/app/api/auth/otp/verify/route.ts', code);
  console.log("Removed maxAge from cookie");
} else {
  console.log("Regex didn't match.");
}
