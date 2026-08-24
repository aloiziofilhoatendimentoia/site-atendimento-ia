const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const regex = /\/\/ Removido redirecionamento forçado para \/configurar para permitir visualização do dashboard/;

const redirectBlock = `    // Redirecionamento autom\\u01EDtico do m\\u011Ddico autenticado para o painel de configura\\u011D\\u01DDo/wizard
    useEffect(() => {
      if (authenticated && data?.empresa?.id) {
        window.location.href = \`/configurar?empresa_id=\${data.empresa.id}\`;
      }
    }, [authenticated, data]);`;

if (code.match(regex)) {
  code = code.replace(regex, redirectBlock);
  fs.writeFileSync('src/app/dashboard/page.tsx', code);
  console.log("Restored forced redirect to /configurar");
} else {
  console.log("Regex didn't match.");
}
