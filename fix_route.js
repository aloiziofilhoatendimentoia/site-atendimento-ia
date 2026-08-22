const fs = require("fs");
const file = "src/app/api/empresa/config/route.ts";
let content = fs.readFileSync(file, "utf8");

// Fix Mojibake
content = content.replace(/Y"< \*ALTERAǟO DE CADASTRO DE CL\?NICA\*/g, "🔄 *ALTERAÇÃO DE CADASTRO DE CLÍNICA*");
content = content.replace(/Y"< \*NOVO CADASTRO DE CL\?NICA\*/g, "🆕 *NOVO CADASTRO DE CLÍNICA*");
content = content.replace(/o\./g, "OK.");
content = content.replace(/Nǜo/g, "Não");
content = content.replace(/alteraes/g, "alterações");
content = content.replace(/Alteraǜo/g, "Alteração");
content = content.replace(/Configuraes/g, "Configurações");
content = content.replace(/MǸdico/g, "Médico");
content = content.replace(/produǜo/g, "produção");
content = content.replace(/Conexǜo/g, "Conexão");
content = content.replace(/instǽncia/g, "instância");
content = content.replace(/Jǭ/g, "Já");

// Fix Supabase Bug
const bugStart = "if (existing || previousDraft) {";
const bugEnd = "const empresa = await saveEmpresa(user.id, {";

const replacement = `
        let isUpdate = false;
        
        if (previousDraft || existing) {
          eventType = 'alteracao_cadastro';
          hasChanges = true; // Forçar update se houver algo
        } else {
          eventType = 'novo_cadastro';
          hasChanges = true;
        }

        // SEMPRE SALVAR NO SUPABASE
        let payloadDB = {
          nome_clinica: nomeClinica,
          telefone_principal: cleanPhone || whatsappClinica,
          endereco: endereco,
          especialistas: especialistasStr,
          canais_escolhidos: canaisStr,
          dados_completos_json: fullJsonString,
          email: ownerEmail
        };

        if (existing) {
          // Atualiza
          let { error: updateError } = await supabaseAdmin
            .from('CLIENTES ATENDIMENTO IA SITE')
            .update(payloadDB)
            .eq('id', existing.id);
            
          if (updateError && (updateError.message.includes('dados_completos_json') || updateError.message.includes('email'))) {
             delete payloadDB.dados_completos_json; delete payloadDB.email;
             const retry = await supabaseAdmin.from('CLIENTES ATENDIMENTO IA SITE').update(payloadDB).eq('id', existing.id);
             updateError = retry.error;
          }
          if (updateError) { supabaseStatus = 'Erro update: ' + updateError.message; }
          else { supabaseStatus = 'Sucesso (Atualizado)'; console.log("OK. Cliente atualizado na tabela CLIENTES ATENDIMENTO IA SITE"); }
        } else {
          // Insere
          let { error: insertError } = await supabaseAdmin
            .from('CLIENTES ATENDIMENTO IA SITE')
            .insert([payloadDB]);
            
          if (insertError && (insertError.message.includes('dados_completos_json') || insertError.message.includes('email'))) {
             delete payloadDB.dados_completos_json; delete payloadDB.email;
             const retry = await supabaseAdmin.from('CLIENTES ATENDIMENTO IA SITE').insert([payloadDB]);
             insertError = retry.error;
          }
          if (insertError) { supabaseStatus = 'Erro insert: ' + insertError.message; }
          else { supabaseStatus = 'Sucesso (Inserido)'; console.log("OK. Novo cliente inserido na tabela CLIENTES ATENDIMENTO IA SITE"); }
        }

        // Salvar em segundo plano nos modelos de fallback para compatibilidade interna
        const empresa = await saveEmpresa(user.id, {`;

// Replace the buggy block
const startIdx = content.indexOf(bugStart);
const endIdx = content.indexOf(bugEnd);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx + bugEnd.length);
  fs.writeFileSync(file, content, "utf8");
  console.log("File fixed successfully!");
} else {
  console.log("Could not find blocks to replace.");
}
