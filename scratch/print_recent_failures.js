async function printFailures() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjk4ZTU0MTgtOWMzOC00YTg2LTg0ZjItYWFkMWRjYmNiNDhkIiwiaWF0IjoxNzgyNTA3NTE4fQ.3xG3rHwcp5-psm9WPWUP4DOaepgkiOgz-mzebJ9wl9I';
  const workflowId = '8P6rcD7M9QvYG7jg';

  try {
    const res = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/executions?workflowId=${workflowId}&limit=10`, {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    const data = await res.json();
    if (data.data) {
      console.log('Últimas 10 execuções:');
      for (const exec of data.data) {
        console.log(`ID: ${exec.id} | Status: ${exec.status} | Started: ${exec.startedAt}`);
        if (exec.status === 'error') {
          // Buscar os detalhes do erro
          const detailRes = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/executions/${exec.id}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
          });
          const detail = await detailRes.json();
          console.log('  -> StoppedAt:', detail.stoppedAt);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

printFailures();
