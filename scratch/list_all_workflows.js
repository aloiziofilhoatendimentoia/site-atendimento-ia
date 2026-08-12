async function listAll() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';
  
  try {
    const res = await fetch('https://n8n.atendimentoiaclinicas.tech/api/v1/workflows', {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    const data = await res.json();
    console.log('Status HTTP:', res.status);
    
    if (data.data) {
      console.log('--- Resumo dos Workflows ---');
      data.data.forEach(w => {
        console.log(`ID: "${w.id}" | Name: "${w.name}" | Active: ${w.active} | Archived: ${w.isArchived}`);
      });
    } else {
      console.log('Nenhum dado retornado:', data);
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

listAll();
