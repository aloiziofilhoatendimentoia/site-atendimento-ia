const fs = require("fs");
const file = "src/app/api/empresa/config/route.ts";
let content = fs.readFileSync(file, "utf8");

const bugStart = "let isUpdate = false;";
const bugEnd = "const empresa = await saveEmpresa(user.id, {";

const replacement = `
        if (previousDraft || existing) {
          eventType = 'alteracao_cadastro';
          
          const cleanObj = (obj) => ({
            clinica: obj?.clinica || {},
            integracoes: obj?.integracoes || {},
            horarios: obj?.horarios || {}
          });

          let baseParaComparar = previousDraft;
          if (!baseParaComparar && existing?.dados_completos_json) {
             baseParaComparar = typeof existing.dados_completos_json === 'string' ? JSON.parse(existing.dados_completos_json) : existing.dados_completos_json;
          }

          if (baseParaComparar) {
             const oldSig = JSON.stringify(cleanObj(baseParaComparar));
             const newSig = JSON.stringify(cleanObj(payload));
             hasChanges = (oldSig !== newSig);
          } else {
             hasChanges = true;
          }
        } else {
          eventType = 'novo_cadastro';
          hasChanges = true;
        }

        if (!hasChanges) {
          supabaseStatus = 'Pulado (Sem alterações)';
        } else {
          // SALVAR NO SUPABASE
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
        }

        // Salvar em segundo plano nos modelos de fallback para compatibilidade interna
        const empresa = await saveEmpresa(user.id, {`;

const startIdx = content.indexOf(bugStart);
const endIdx = content.indexOf(bugEnd);

if (startIdx !== -1 && endIdx !== -1) {
  // Replace the typescript 'any' requirement manually here before we write
  let repWithAny = replacement.replace(/let payloadDB = \{/, "let payloadDB: any = {");
  repWithAny = repWithAny.replace(/const cleanObj = \(obj\)/, "const cleanObj = (obj: any)");
  
  content = content.substring(0, startIdx) + repWithAny + content.substring(endIdx + bugEnd.length);
  fs.writeFileSync(file, content, "utf8");
  console.log("File fixed successfully!");
} else {
  console.log("Could not find blocks to replace.");
}
