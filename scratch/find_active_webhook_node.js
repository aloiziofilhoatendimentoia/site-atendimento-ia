async function findActive() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
  const activeIds = ['OLsd2Rtp3wQ3gHeB', '8P6rcD7M9QvYG7jg', 'X7a388u2Ze8uoxVn'];
  
  for (const id of activeIds) {
    try {
      const res = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${id}`, {
        headers: { 'X-N8N-API-KEY': apiKey }
      });
      const data = await res.json();
      console.log(`Verificando workflow ID: "${id}" | Nome: "${data.name}"`);
      
      const webhookNode = data.nodes?.find(n => n.type === 'n8n-nodes-base.webhook' && n.parameters?.path === 'config-empresa');
      if (webhookNode) {
        console.log(`🌟 ENCONTRADO! O workflow "${data.name}" (ID: ${id}) possui o webhook "config-empresa"!`);
        console.log('Node Webhook:', webhookNode);
        
        // Procurar o node de Enviar Config WhatsApp no mesmo workflow
        const sendNode = data.nodes?.find(n => n.name === 'Enviar Config WhatsApp');
        if (sendNode) {
          console.log('Encontrado Enviar Config WhatsApp node no mesmo workflow:', sendNode);
        }
        return;
      }
    } catch (err) {
      console.error(`Erro ao buscar workflow ${id}:`, err);
    }
  }
  console.log('Nenhum dos workflows ativos possui o webhook "config-empresa"!');
}

findActive();
