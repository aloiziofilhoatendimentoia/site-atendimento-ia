import fs from 'fs';
import path from 'path';
import os from 'os';

const OTP_FILE_PATH = path.join(os.tmpdir(), 'local_otps.json');

interface OTPData {
  email: string;
  code: string;
  expiresAt: number; // timestamp em ms
}

function readOTPs(): OTPData[] {
  if (!fs.existsSync(OTP_FILE_PATH)) {
    return [];
  }
  try {
    const content = fs.readFileSync(OTP_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Erro ao ler local_otps.json:', e);
    return [];
  }
}

function writeOTPs(otps: OTPData[]) {
  try {
    fs.writeFileSync(OTP_FILE_PATH, JSON.stringify(otps, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erro ao gravar local_otps.json:', e);
  }
}

export function saveOTP(email: string, code: string): void {
  const otps = readOTPs();
  
  // Limpar OTPs antigos ou expirados para o mesmo email
  const now = Date.now();
  const cleanOTPs = otps.filter(o => o.email.toLowerCase() !== email.toLowerCase() && o.expiresAt > now);
  
  // Código expira em 10 minutos
  const expiresAt = now + 10 * 60 * 1000;
  
  cleanOTPs.push({
    email: email.toLowerCase(),
    code,
    expiresAt
  });
  
  writeOTPs(cleanOTPs);
}

export function verifyOTP(email: string, code: string): boolean {
  const otps = readOTPs();
  const now = Date.now();
  
  const matchIdx = otps.findIndex(o => 
    o.email.toLowerCase() === email.toLowerCase() && 
    o.code === code && 
    o.expiresAt > now
  );
  
  if (matchIdx === -1) {
    return false;
  }
  
  // Excluir o código usado para evitar reutilização
  otps.splice(matchIdx, 1);
  writeOTPs(otps);
  return true;
}
