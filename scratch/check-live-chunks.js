async function inspectChunks() {
  const htmlRes = await fetch('https://atendimentoiaclinicas.tech/configurar');
  const html = await htmlRes.text();
  const chunkPaths = [...html.matchAll(/_next\/static\/chunks\/[^"]+/g)].map(m => m[0]);
  
  console.log('Found JS Chunks on live site:', chunkPaths);

  for (const path of chunkPaths) {
    try {
      const res = await fetch(`https://atendimentoiaclinicas.tech/${path}`);
      const text = await res.text();
      if (text.includes('sucesso') || text.includes('evolutionQrCode')) {
        console.log('FOUND MATCH IN CHUNK:', path);
        if (text.includes('/sucesso')) console.log('Contains /sucesso redirect string!');
        if (text.includes('setShowQrModal')) console.log('Contains setShowQrModal!');
      }
    } catch (e) {
      console.error('Error fetching chunk:', path, e.message);
    }
  }
}

inspectChunks().catch(console.error);
