import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acesso de IPs locais na rede Wi-Fi durante o desenvolvimento
  // Permite acesso de IPs locais na rede Wi-Fi durante o desenvolvimento
  // @ts-ignore
  allowedDevOrigins: ['192.168.1.10', '192.168.1.11', '192.168.1.4', '192.168.1.2', '192.168.1.3', '192.168.1.5', 'localhost'],
};

export default nextConfig;
