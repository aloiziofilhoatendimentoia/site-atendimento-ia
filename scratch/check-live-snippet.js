async function checkCode() {
  const res = await fetch('https://atendimentoiaclinicas.tech/_next/static/chunks/0j.kam66jp6jp.js');
  const text = await res.text();
  const idx = text.indexOf('/sucesso');
  console.log('Snippet around /sucesso on live site:');
  console.log(text.substring(Math.max(0, idx - 200), idx + 200));
}

checkCode().catch(console.error);
