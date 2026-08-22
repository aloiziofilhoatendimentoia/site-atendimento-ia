const fs = require('fs');
let code = fs.readFileSync('src/app/configurar/page.tsx', 'utf8');

code = code.replace(
  '          .then(resData => {',
  `          .then(resData => {\n            if (resData && resData.is_active === false) {\n              alert('Sua assinatura encontra-se inativa, contate o suporte. Redirecionando para pagamento...');\n              window.location.replace('/pagamento');\n              return;\n            }`
);

fs.writeFileSync('src/app/configurar/page.tsx', code);
console.log("Injected redirect in configurar page");
