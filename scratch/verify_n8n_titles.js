async function getLatestExecDetails() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjk4ZTU0MTgtOWMzOC00YTg2LTg0ZjItYWFkMWRjYmNiNDhkIiwiaWF0IjoxNzgyNTA3NTE4fQ.3xG3rHwcp5-psm9WPWUP4DOaepgkiOgz-mzebJ9wl9I';
  const workflowId = '8P6rcD7M9QvYG7jg';

  const listRes = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/executions?workflowId=${workflowId}&limit=2`, {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const list = await listRes.json();

  if (list.data) {
    for (const exec of list.data) {
      console.log(`\n========================================`);
      console.log(`Execução ID: ${exec.id} | Status: ${exec.status} | Início: ${exec.startedAt}`);
      console.log(`========================================`);

      const detailRes = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/executions/${exec.id}?includeData=true`, {
        headers: { 'X-N8N-API-KEY': apiKey }
      });
      const detail = await detailRes.json();

      const runData = detail.data?.resultData?.runData;
      if (runData && runData['Enviar Config WhatsApp']) {
        const nodeRun = runData['Enviar Config WhatsApp'][0];
        console.log('Mensagem enviada pelo nó:');
        console.log(nodeRun.data?.main?.[0]?.[0]?.json || 'Sem JSON');
      }
    }
  }
}

getLatestExecDetails();
