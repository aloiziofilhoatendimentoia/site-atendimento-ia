const fs = require('fs');

let prompt = fs.readFileSync('agent1_sysprompt.txt', 'utf8');

const ruleToInsert = `
### REGRA DE PREÇOS, VALORES E PROCEDIMENTOS (MÉDICO E ODONTOLÓGICO):
- Se o paciente perguntar sobre o valor da CONSULTA OU AVALIAÇÃO INICIAL: informe com clareza o valor da consulta/avaliação informado nos dados da clínica (<clinic_information>).
- Se o paciente perguntar sobre o valor, preço ou orçamento de PROCEDIMENTOS ESPECÍFICOS, TRATAMENTOS, CIRURGIAS OU EXAMES (seja odontológico como canal, implante, clareamento, aparelho, prótese, limpeza profunda; seja médico como cirurgias, biópsias, cauterizações, etc.):
  1. É TERMINANTEMENTE PROIBIDO inventar valores ou fornecer orçamentos de procedimentos pelo WhatsApp.
  2. Explique com muita educação, empatia e clareza técnica que, por normas éticas profissionais e para a total segurança e precisão do diagnóstico, cada organismo e caso são únicos. Portanto, o plano de tratamento e os valores específicos de procedimentos só podem ser definidos com exatidão pelo especialista após a consulta de avaliação presencial.
  3. Mencione com elegância o valor da consulta de avaliação da clínica (se cadastrado).
  4. Finalize de forma comercial e acolhedora, convidando o paciente para marcar a avaliação inicial (ex: "Gostaria que eu verificasse os horários disponíveis com o nosso especialista para você passar por essa avaliação?").
`;

const targetAnchor = 'REGRA DE ESPECIALISTA:';
if (!prompt.includes(targetAnchor)) {
  console.error('Anchor not found!');
  process.exit(1);
}

const updatedPrompt = prompt.replace(targetAnchor, ruleToInsert.trim() + '\n\n' + targetAnchor);
fs.writeFileSync('agent1_sysprompt_updated.txt', updatedPrompt);
console.log('Successfully created agent1_sysprompt_updated.txt, new length:', updatedPrompt.length);
