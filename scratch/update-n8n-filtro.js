const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';

const workflowIds = ['8P6rcD7M9QvYG7jg', 'OLsd2Rtp3wQ3gHeB'];

async function updateFiltroNodes() {
  for (const id of workflowIds) {
    try {
      const res = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${id}`, {
        headers: { 'X-N8N-API-KEY': API_KEY }
      });
      if (!res.ok) continue;
      const wf = await res.json();
      const filtroNode = wf.nodes.find(n => n.name === 'Filtro');
      
      if (filtroNode && filtroNode.parameters && filtroNode.parameters.conditions) {
        const conditions = filtroNode.parameters.conditions.conditions || [];
        
        // Verifica se a condição fromMe já existe
        const hasFromMe = conditions.some(c => c.leftValue && c.leftValue.includes('fromMe'));
        if (!hasFromMe) {
          conditions.push({
            id: 'filter-from-me-out',
            leftValue: "={{ $json.body.data?.key?.fromMe || $json.body.fromMe || $json.data?.key?.fromMe || false }}",
            rightValue: "",
            operator: {
              type: "boolean",
              operation: "false",
              singleValue: true
            }
          });
          filtroNode.parameters.conditions.conditions = conditions;
        }

        const updateRes = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${id}`, {
          method: 'PUT',
          headers: {
            'X-N8N-API-KEY': API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: wf.name,
            nodes: wf.nodes,
            connections: wf.connections,
            settings: { executionOrder: 'v1' }
          })
        });

        console.log(`Updated workflow ${id} Filtro node status:`, updateRes.status);
      }
    } catch (e) {
      console.error(`Error updating workflow ${id}:`, e);
    }
  }
}

updateFiltroNodes().catch(console.error);
