"use client";

import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, RefreshCw, CheckCircle } from 'lucide-react';

export default function BotMasterConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'qr' | 'pairing'>('qr');
  const [initLoading, setInitLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);

  const INSTANCE_NAME = '81995462240';
  const PAIRING_PHONE = '5581995462240';

  const loadQr = async () => {
    setQrLoading(true);
    try {
      const res = await fetch('/api/empresa/gerar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: INSTANCE_NAME, webhookUrl: 'https://n8n.atendimentoiaclinicas.tech/webhook/mensagem' })
      });
      const data = await res.json();
      if (res.ok && data.evolutionQrCode) {
        setQrBase64(data.evolutionQrCode);
      }
    } catch (e) {
      console.error('Error generating QR', e);
    } finally {
      setInitLoading(false);
      setQrLoading(false);
    }
  };

  useEffect(() => {
    let statusInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/empresa/status-conexao?instance=${INSTANCE_NAME}`);
        if (res.ok) {
          const data = await res.json();
          if (data.state === 'open') {
            setIsConnected(true);
            setInitLoading(false);
            return true;
          }
        }
        setIsConnected(false);
        return false;
      } catch (e) {
        return false;
      }
    };

    const init = async () => {
      const open = await checkStatus();
      if (!open && connectionMode === 'qr') {
        await loadQr();
      } else if (!open) {
        setInitLoading(false);
      }
    };

    init();

    statusInterval = setInterval(checkStatus, 5000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [isConnected, connectionMode]);

  const handleGeneratePairingCode = async () => {
    setPairingLoading(true);
    try {
      const res = await fetch('/api/empresa/gerar-pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: INSTANCE_NAME, phoneNumber: PAIRING_PHONE, webhookUrl: 'https://n8n.atendimentoiaclinicas.tech/webhook/mensagem' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
    } catch (e) {
      alert('Erro ao gerar código');
    } finally {
      setPairingLoading(false);
    }
  };

  return (
    <div className="bg-[#121417] border border-[#27272a] rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8">
      <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center">
            <Smartphone className="w-5 h-5 mr-2 text-teal-400" /> 
            Robô Oficial (Atendimento IA)
          </h2>
          <p className="text-gray-400 text-sm max-w-xl">
            Este é o painel de conexão da secretária virtual oficial da sua empresa. A instância fixa atrelada a este painel é a <strong>{INSTANCE_NAME}</strong>.
          </p>
          
          <div className="mt-4 flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              isConnected 
                ? 'bg-green-950/30 text-green-400 border-green-900/50' 
                : 'bg-red-950/30 text-red-400 border-red-900/50'
            }`}>
              {initLoading ? 'Verificando...' : isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </span>
          </div>
        </div>

        {!isConnected && !initLoading && (
          <div className="bg-[#0c0d0f] p-4 rounded-xl border border-[#27272a] min-w-[300px]">
            <div className="flex bg-[#18181b] p-1 rounded-lg mb-4">
              <button 
                onClick={() => setConnectionMode('qr')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center transition-colors ${connectionMode === 'qr' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <QrCode className="w-3.5 h-3.5 mr-1" /> QR Code
              </button>
              <button 
                onClick={() => setConnectionMode('pairing')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center transition-colors ${connectionMode === 'pairing' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Smartphone className="w-3.5 h-3.5 mr-1" /> Código
              </button>
            </div>

            {connectionMode === 'qr' && (
              <div className="flex flex-col items-center justify-center space-y-3">
                <button
                  onClick={loadQr}
                  disabled={qrLoading}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center"
                >
                  {qrLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Gerar QR Code Novo"}
                </button>
                {qrBase64 ? (
                  <div className="bg-white p-2 rounded-xl mt-2">
                    <img src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`} alt="QR Code" className="w-32 h-32" />
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center mt-2">
                    <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
                  </div>
                )}
              </div>
            )}

            {connectionMode === 'pairing' && (
              <div className="flex flex-col items-center justify-center space-y-3">
                <button
                  onClick={handleGeneratePairingCode}
                  disabled={pairingLoading}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center"
                >
                  {pairingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Gerar Código Numérico"}
                </button>
                {pairingCode && (
                  <div className="bg-[#181a1f] w-full p-3 rounded-lg border border-teal-500/30 text-center">
                    <span className="text-xs text-gray-400 block mb-1">Código do WhatsApp:</span>
                    <span className="text-2xl font-mono font-bold tracking-[0.2em] text-white">{pairingCode}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}