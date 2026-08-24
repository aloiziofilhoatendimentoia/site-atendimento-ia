const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const regex = /\/\/ Verificar sess.o e carregar dados[\s\S]*?checkSession\(\);\s*\}, \[\]\);/;

const replacement = `    // EXIGÊNCIA DO USUÁRIO: SEMPRE deslogar ao acessar esta página para forçar o OTP
    useEffect(() => {
      async function forceLogout() {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (e) {}
        setAuthenticated(false);
        setLoading(false);
      }
      forceLogout();
    }, []);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/dashboard/page.tsx', code);
  console.log("Replaced checkSession with forceLogout");
} else {
  console.log("Regex didn't match.");
}
