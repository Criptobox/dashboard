import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Search,
  Zap,
  Lock,
  Unlock,
  Layers,
  Activity,
  FileCode2,
  CheckCircle2,
  XCircle,
  Database,
  Radio,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  Sliders,
  X,
  Info,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { SuspiciousSignature, ScannedContract } from '../types';
import {
  SUSPICIOUS_SIGNATURES_DB,
  INITIAL_SCANNED_CONTRACTS,
  scanContractCustom,
  generateMempoolDeploymentSample,
} from '../data/rugSignaturesData';

interface ContractRugScannerWidgetProps {
  onShowToast: (title: string, msg: string) => void;
  onOpenSwap?: (tokenSymbol?: string) => void;
}

export const ContractRugScannerWidget: React.FC<ContractRugScannerWidgetProps> = ({
  onShowToast,
  onOpenSwap,
}) => {
  const [scannedContracts, setScannedContracts] = useState<ScannedContract[]>(
    INITIAL_SCANNED_CONTRACTS
  );
  const [selectedContract, setSelectedContract] = useState<ScannedContract>(
    INITIAL_SCANNED_CONTRACTS[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<'eth' | 'arbitrum' | 'base'>('eth');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [showSignaturesModal, setShowSignaturesModal] = useState(false);
  const [signaturesFilter, setSignaturesFilter] = useState<string>('all');
  const [signatureSearch, setSignatureSearch] = useState<string>('');

  // Auto-scan simulator effect (every 22 seconds simulates a new contract detected in mempool)
  useEffect(() => {
    if (!autoScanEnabled) return;

    const interval = setInterval(() => {
      const newContract = generateMempoolDeploymentSample();
      setScannedContracts((prev) => [newContract, ...prev.slice(0, 7)]);
      if (newContract.riskLevel === 'critical') {
        onShowToast(
          '🚨 Rug-Pull Detectado en Mempool',
          `${newContract.symbol} interceptado con firma maliciosa. Cuarentena preventiva activada.`
        );
      }
    }, 22000);

    return () => clearInterval(interval);
  }, [autoScanEnabled, onShowToast]);

  // Execute manual scan simulation
  const handlePerformScan = (inputAddress: string) => {
    if (!inputAddress.trim()) {
      onShowToast('Ingresa un Contrato', 'Introduce una dirección 0x o nombre de token.');
      return;
    }

    setIsScanning(true);
    setScanStep('Extrayendo bytecode desde mempool y nodos RPC...');

    setTimeout(() => {
      setScanStep('Desensamblando opcodes y cotejando con base de firmas sospechosas...');
    }, 600);

    setTimeout(() => {
      setScanStep('Simulando transacciones de compra/venta en sandbox EVM...');
    }, 1200);

    setTimeout(() => {
      const result = scanContractCustom(inputAddress, selectedChain);
      setScannedContracts((prev) => {
        const filtered = prev.filter((c) => c.id !== result.id && c.address !== result.address);
        return [result, ...filtered];
      });
      setSelectedContract(result);
      setIsScanning(false);
      setScanStep('');

      if (result.riskLevel === 'critical') {
        onShowToast(
          '⚠️ ALERTA: Vulnerabilidad Crítica',
          `El contrato ${result.symbol} coincide con firmas de Rug-Pull/Honeypot.`
        );
      } else if (result.riskLevel === 'safe') {
        onShowToast(
          '✅ Contrato Verificado',
          `${result.symbol} superó las pruebas de sandbox sin firmas maliciosas.`
        );
      } else {
        onShowToast(
          'Advertencia de Riesgo',
          `El contrato ${result.symbol} presenta configuraciones que requieren cautela.`
        );
      }
    }, 1800);
  };

  // Quick select sample contracts
  const handleQuickSelect = (contract: ScannedContract) => {
    setSelectedContract(contract);
    setSearchQuery(contract.symbol);
  };

  // Toggle quarantine on selected contract
  const handleToggleQuarantine = (contractId: string) => {
    setScannedContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId) {
          const nextStatus = c.status === 'quarantined' ? 'monitoring' : 'quarantined';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );

    setSelectedContract((prev) => {
      if (prev.id === contractId) {
        const nextStatus = prev.status === 'quarantined' ? 'monitoring' : 'quarantined';
        return { ...prev, status: nextStatus };
      }
      return prev;
    });

    const isNowQuarantined = selectedContract.status !== 'quarantined';
    if (isNowQuarantined) {
      onShowToast(
        'Contrato en Cuarentena',
        `Transacciones con ${selectedContract.symbol} bloqueadas preventivamente en el enrutador.`
      );
    } else {
      onShowToast('Cuarentena Removida', `${selectedContract.symbol} reestablecido a monitorización.`);
    }
  };

  // Filtered signatures for modal
  const filteredSignatures = SUSPICIOUS_SIGNATURES_DB.filter((sig) => {
    const matchesCategory =
      signaturesFilter === 'all' || sig.category === signaturesFilter;
    const matchesSearch =
      sig.name.toLowerCase().includes(signatureSearch.toLowerCase()) ||
      sig.selector.toLowerCase().includes(signatureSearch.toLowerCase()) ||
      sig.description.toLowerCase().includes(signatureSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRiskBadgeStyles = (risk: ScannedContract['riskLevel']) => {
    switch (risk) {
      case 'critical':
        return {
          label: 'CRÍTICO: RUG-PULL',
          bg: 'bg-[#ff5449]/15',
          border: 'border-[#ff5449]/40',
          text: 'text-[#ff5449]',
          icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0" />,
        };
      case 'high':
        return {
          label: 'RIESGO ALTO',
          bg: 'bg-[#ff9500]/15',
          border: 'border-[#ff9500]/40',
          text: 'text-[#ff9500]',
          icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
        };
      case 'moderate':
        return {
          label: 'RIESGO MODERADO',
          bg: 'bg-[#d0bcff]/15',
          border: 'border-[#d0bcff]/40',
          text: 'text-[#d0bcff]',
          icon: <Activity className="w-3.5 h-3.5 shrink-0" />,
        };
      case 'safe':
      default:
        return {
          label: 'AUDITADO / SEGURO',
          bg: 'bg-[#4edea3]/15',
          border: 'border-[#4edea3]/40',
          text: 'text-[#4edea3]',
          icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
        };
    }
  };

  const currentRisk = getRiskBadgeStyles(selectedContract.riskLevel);

  return (
    <div className="space-y-4">
      {/* 1. SECTION HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161922] via-[#1d1f27] to-[#11131a] border border-[#3d494c]/50 p-4 shadow-xl">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff5449]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#4cd7f6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff5449]/20 border border-[#ff5449]/40 flex items-center justify-center text-[#ff5449] shrink-0 shadow-lg shadow-[#ff5449]/10">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-code-sm font-bold uppercase tracking-wider text-[#4cd7f6] bg-[#4cd7f6]/15 px-2 py-0.5 rounded-full border border-[#4cd7f6]/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Sentinel Anti-Rugpull Engine</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-code-sm text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded-full border border-[#4edea3]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                  Mempool Guard Activo
                </span>
              </div>
              <h2 className="font-headline-md text-base sm:text-lg text-[#e1e2ec] font-bold tracking-tight mt-0.5">
                Escáner & Auditoría de Contratos Nuevos
              </h2>
            </div>
          </div>

          {/* Quick controls: Signatures DB Modal Trigger & Auto-Scan Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSignaturesModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ec] text-xs font-code-sm font-semibold border border-[#3d494c]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span>Base de Firmas ({SUSPICIOUS_SIGNATURES_DB.length})</span>
            </button>

            <button
              onClick={() => {
                setAutoScanEnabled(!autoScanEnabled);
                onShowToast(
                  !autoScanEnabled ? 'Auto-Escaneo Activado' : 'Auto-Escaneo Pausado',
                  !autoScanEnabled
                    ? 'Monitoreando mempool L1/L2 por nuevos despliegues de tokens.'
                    : 'Modo pasivo activado.'
                );
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-code-sm font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoScanEnabled
                  ? 'bg-[#4edea3]/15 border-[#4edea3]/30 text-[#4edea3]'
                  : 'bg-[#272a32] border-[#3d494c]/40 text-[#869397]'
              }`}
              title="Alternar escaneo continuo de nuevos contratos en mempool"
            >
              <Radio className={`w-3.5 h-3.5 ${autoScanEnabled ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Auto-Escaneo:</span>
              <span>{autoScanEnabled ? 'EN VIVO' : 'PAUSADO'}</span>
            </button>
          </div>
        </div>

        <p className="relative z-10 text-xs text-[#bcc9cd] mt-2.5 leading-relaxed">
          Analiza el bytecode EVM antes de interactuar. Coteja firmas de función (4bytes), funciones de minteo ocultas, honeypots de tarifas 99% y simula compra/venta en sandbox.
        </p>

        {/* Search / Scan Input Box */}
        <div className="relative z-10 mt-3.5 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#869397]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePerformScan(searchQuery);
              }}
              placeholder="Pegar dirección 0x de contrato nuevo o símbolo (ej. 0x94b3...)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#10131a] border border-[#272a32] text-xs sm:text-sm text-white placeholder-[#869397] font-code-sm focus:outline-none focus:border-[#4cd7f6] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value as any)}
              className="px-2.5 py-2.5 rounded-xl bg-[#10131a] border border-[#272a32] text-xs font-code-sm text-[#bcc9cd] focus:outline-none focus:border-[#4cd7f6]"
            >
              <option value="eth">Ethereum L1</option>
              <option value="arbitrum">Arbitrum One</option>
              <option value="base">Base L2</option>
            </select>

            <button
              onClick={() => handlePerformScan(searchQuery || selectedContract.symbol)}
              disabled={isScanning}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5449] to-[#ff7966] hover:brightness-110 text-white font-sans text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#ff5449]/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isScanning ? 'Escaneando...' : 'Escanear Bytecode'}</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Selector Chips */}
        <div className="relative z-10 flex items-center gap-1.5 mt-2.5 flex-wrap text-[11px] font-code-sm">
          <span className="text-[#869397] font-medium mr-1">Muestras rápidas:</span>
          {INITIAL_SCANNED_CONTRACTS.map((c) => (
            <button
              key={c.id}
              onClick={() => handleQuickSelect(c)}
              className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                selectedContract.id === c.id
                  ? 'bg-[#272a32] text-white border-[#4cd7f6]'
                  : 'bg-[#10131a]/80 text-[#bcc9cd] border-[#272a32] hover:border-[#3d494c]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  c.riskLevel === 'critical'
                    ? 'bg-[#ff5449]'
                    : c.riskLevel === 'safe'
                    ? 'bg-[#4edea3]'
                    : 'bg-[#d0bcff]'
                }`}
              />
              <span>{c.symbol}</span>
              <span className="opacity-70 text-[9px]">
                ({c.riskLevel === 'critical' ? 'Rug' : c.riskLevel === 'safe' ? 'Seguro' : 'Proxy'})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Scan Progress Bar Animation */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-xl bg-[#10131a] border border-[#4cd7f6]/40 shadow-lg space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-code-sm">
              <span className="text-[#4cd7f6] flex items-center gap-2 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{scanStep}</span>
              </span>
              <span className="text-[#869397]">Simulador EVM v2.4</span>
            </div>
            <div className="w-full h-1.5 bg-[#272a32] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#4cd7f6] via-[#d0bcff] to-[#4edea3] rounded-full"
                initial={{ width: '15%' }}
                animate={{ width: '92%' }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN ACTIVE CONTRACT AUDIT DASHBOARD */}
      <div className="rounded-2xl bg-[#1d1f27] border border-[#3d494c]/60 p-4 shadow-xl space-y-4">
        {/* Top bar with Contract Identity & Safety Score */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#272a32]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white font-headline-lg">
                {selectedContract.name} ({selectedContract.symbol})
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full border text-xs font-code-sm font-bold flex items-center gap-1 ${currentRisk.bg} ${currentRisk.border} ${currentRisk.text}`}
              >
                {currentRisk.icon}
                <span>{currentRisk.label}</span>
              </span>

              {selectedContract.status === 'quarantined' && (
                <span className="px-2 py-0.5 rounded-full bg-[#ff5449]/20 border border-[#ff5449]/40 text-[#ff5449] text-[10px] font-code-sm font-extrabold flex items-center gap-1">
                  <Ban className="w-2.5 h-2.5" />
                  EN CUARENTENA
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-code-sm text-[#869397] flex-wrap">
              <span className="text-[#4cd7f6]">{selectedContract.chainLabel}</span>
              <span>•</span>
              <span className="truncate max-w-[180px] sm:max-w-none text-[#bcc9cd]">
                {selectedContract.address}
              </span>
              <span>•</span>
              <span>{selectedContract.deployedAt}</span>
            </div>
          </div>

          {/* Safety Gauge Indicator */}
          <div className="flex items-center gap-3 self-start sm:self-auto p-2.5 rounded-xl bg-[#10131a] border border-[#272a32]">
            <div className="text-right">
              <span className="text-[10px] text-[#869397] font-code-sm uppercase tracking-wider block">
                Índice de Seguridad
              </span>
              <span className="text-xl font-extrabold font-code-md text-white">
                {selectedContract.safetyScore}
                <span className="text-xs text-[#869397] font-normal">/100</span>
              </span>
            </div>
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border font-code-md ${
                selectedContract.safetyScore >= 80
                  ? 'bg-[#4edea3]/20 border-[#4edea3]/40 text-[#4edea3]'
                  : selectedContract.safetyScore >= 50
                  ? 'bg-[#d0bcff]/20 border-[#d0bcff]/40 text-[#d0bcff]'
                  : 'bg-[#ff5449]/20 border-[#ff5449]/40 text-[#ff5449]'
              }`}
            >
              {selectedContract.safetyScore >= 80
                ? 'A+'
                : selectedContract.safetyScore >= 50
                ? 'B'
                : 'F-'}
            </div>
          </div>
        </div>

        {/* AI Forensic Summary Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            selectedContract.riskLevel === 'critical'
              ? 'bg-[#ff5449]/10 border-[#ff5449]/30 text-[#ffb4ab]'
              : selectedContract.riskLevel === 'safe'
              ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#8cf8c3]'
              : 'bg-[#d0bcff]/10 border-[#d0bcff]/30 text-[#e1d5ff]'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {selectedContract.riskLevel === 'critical' ? (
              <ShieldAlert className="w-5 h-5 text-[#ff5449]" />
            ) : selectedContract.riskLevel === 'safe' ? (
              <ShieldCheck className="w-5 h-5 text-[#4edea3]" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#d0bcff]" />
            )}
          </div>
          <div className="text-xs leading-relaxed space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] block opacity-90">
              Diagnóstico del Centinela IA:
            </span>
            <p className="text-white font-medium">{selectedContract.aiSummary}</p>
          </div>
        </div>

        {/* Key Forensic Matrix: 4 Metrics (Buy/Sell, Taxes, Liquidity Lock, Source) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-code-sm">
          {/* Honeypot Swap Ability */}
          <div className="p-3 rounded-xl bg-[#10131a] border border-[#272a32] space-y-1">
            <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
              Simulación de Swap
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 font-bold">
              {selectedContract.simulation.canSell ? (
                <span className="text-[#4edea3] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Compra & Venta OK
                </span>
              ) : (
                <span className="text-[#ff5449] flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Venta Bloqueada (Honeypot)
                </span>
              )}
            </div>
          </div>

          {/* Taxes Comparison */}
          <div className="p-3 rounded-xl bg-[#10131a] border border-[#272a32] space-y-1">
            <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
              Impuestos Compra / Venta
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 font-bold">
              <span className="text-white">
                {selectedContract.simulation.buyTaxPct}% C /{' '}
              </span>
              <span
                className={
                  selectedContract.simulation.sellTaxPct > 10
                    ? 'text-[#ff5449]'
                    : 'text-[#4edea3]'
                }
              >
                {selectedContract.simulation.sellTaxPct}% V
              </span>
              {selectedContract.simulation.sellTaxPct > 50 && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-[#ff5449]/20 text-[#ff5449]">
                  🚨 99%
                </span>
              )}
            </div>
          </div>

          {/* Liquidity Lock */}
          <div className="p-3 rounded-xl bg-[#10131a] border border-[#272a32] space-y-1">
            <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
              Custodia de Liquidez
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 font-bold">
              {selectedContract.liquidityLocked ? (
                <span className="text-[#4edea3] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bloqueada ({selectedContract.lockDuration || 'Activo'})</span>
                </span>
              ) : (
                <span className="text-[#ff5449] flex items-center gap-1">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Sin Bloqueo (Riesgo Retiro)</span>
                </span>
              )}
            </div>
          </div>

          {/* Source Code Verification */}
          <div className="p-3 rounded-xl bg-[#10131a] border border-[#272a32] space-y-1">
            <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
              Código Fuente
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 font-bold">
              {selectedContract.verifiedSource ? (
                <span className="text-[#4edea3] flex items-center gap-1">
                  <FileCode2 className="w-3.5 h-3.5" /> Verificado ABI
                </span>
              ) : (
                <span className="text-[#ff9500] flex items-center gap-1">
                  <FileCode2 className="w-3.5 h-3.5" /> Bytecode Ofuscado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. SUSPICIOUS SIGNATURES DETECTED TABLE / CARDS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-code-sm font-bold text-[#869397] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span>Coincidencias en Base de Datos de Firmas Sospechosas</span>
            </span>
            <span
              className={`text-[10px] font-code-sm px-2 py-0.5 rounded font-bold ${
                selectedContract.matchedSignatures.length > 0
                  ? 'bg-[#ff5449]/20 text-[#ff5449]'
                  : 'bg-[#4edea3]/20 text-[#4edea3]'
              }`}
            >
              {selectedContract.matchedSignatures.length} Coincidencias
            </span>
          </div>

          {selectedContract.matchedSignatures.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#10131a] border border-[#272a32] text-center space-y-1">
              <ShieldCheck className="w-6 h-6 text-[#4edea3] mx-auto" />
              <p className="text-xs font-semibold text-white">
                Ninguna firma maliciosa detectada
              </p>
              <p className="text-[11px] text-[#869397]">
                El bytecode no contiene selectores de honeypot, emisión ilimitada, listas negras ni puertas traseras conocidas.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedContract.matchedSignatures.map((sig) => (
                <div
                  key={sig.id}
                  className="p-3 rounded-xl bg-[#10131a] border border-[#ff5449]/30 space-y-2 hover:border-[#ff5449]/60 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#ff5449]/20 border border-[#ff5449]/40 text-[#ff5449] font-code-sm text-[10px] font-bold">
                        {sig.severity.toUpperCase()}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {sig.selector}
                      </span>
                      <span className="text-xs text-[#bcc9cd] font-semibold">
                        {sig.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-code-sm text-[#869397]">
                      {sig.categoryLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#e1e2ec] font-sans leading-relaxed">
                    {sig.description}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-[#272a32] text-[10px] font-code-sm text-[#869397]">
                    <span>
                      <strong className="text-[#ffb4ab]">Vector:</strong> {sig.exploitMechanism}
                    </span>
                    <span className="shrink-0 text-[#ff5449]">
                      {sig.detectionCount.toLocaleString()} rugs históricos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls for Active Contract */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleQuarantine(selectedContract.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedContract.status === 'quarantined'
                  ? 'bg-[#272a32] text-[#e1e2ec] hover:bg-[#32353d] border border-[#3d494c]'
                  : 'bg-[#ff5449]/20 hover:bg-[#ff5449]/30 text-[#ff5449] border border-[#ff5449]/40'
              }`}
            >
              <Ban className="w-4 h-4" />
              <span>
                {selectedContract.status === 'quarantined'
                  ? 'Desbloquear de Cuarentena'
                  : 'Poner en Cuarentena Inmediata'}
              </span>
            </button>

            <button
              onClick={() => {
                onShowToast(
                  'Reporte de Auditoría Generado',
                  `Hash SHA-256 verificado. Análisis forense de ${selectedContract.symbol} exportado.`
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-[#272a32] hover:bg-[#32353d] text-[#bcc9cd] hover:text-white text-xs font-sans font-semibold border border-[#3d494c]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCode2 className="w-4 h-4 text-[#4cd7f6]" />
              <span>Exportar Reporte Forense</span>
            </button>
          </div>

          {selectedContract.riskLevel === 'safe' && onOpenSwap && (
            <button
              onClick={() => onOpenSwap(selectedContract.symbol)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00a572] to-[#4edea3] text-[#002113] font-sans text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#4edea3]/20 hover:brightness-105 transition-all cursor-pointer"
            >
              <span>Swap Seguro Verificado</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. RECENTLY SCANNED CONTRACTS STREAM */}
      <div className="rounded-2xl bg-[#1d1f27] border border-[#3d494c]/60 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-headline-lg flex items-center gap-2">
              <span>Feed de Despliegues Monitoreados en Mempool</span>
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
            </h3>
            <p className="text-[11px] text-[#869397] mt-0.5">
              Últimos contratos detectados en Ethereum, Arbitrum y Base evaluados en tiempo real.
            </p>
          </div>
          <span className="text-xs font-code-sm text-[#bcc9cd] px-2 py-0.5 rounded bg-[#10131a] border border-[#272a32]">
            {scannedContracts.length} Registros
          </span>
        </div>

        <div className="space-y-2">
          {scannedContracts.map((contract) => {
            const risk = getRiskBadgeStyles(contract.riskLevel);
            const isSelected = selectedContract.id === contract.id;

            return (
              <div
                key={contract.id}
                onClick={() => setSelectedContract(contract)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-[#10131a] border-[#4cd7f6] ring-1 ring-[#4cd7f6]/30 shadow-lg'
                    : 'bg-[#14161f] border-[#272a32] hover:bg-[#1a1c25] hover:border-[#3d494c]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${risk.bg} ${risk.border} ${risk.text}`}
                  >
                    {risk.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {contract.name} ({contract.symbol})
                      </h4>
                      <span className="px-1.5 py-0.2 rounded bg-[#272a32] text-[#bcc9cd] text-[10px] font-code-sm">
                        {contract.chainLabel}
                      </span>
                      <span
                        className={`text-[10px] font-code-sm px-2 py-0.2 rounded-full font-bold ${risk.bg} ${risk.text} border ${risk.border}`}
                      >
                        {risk.label}
                      </span>
                      {contract.status === 'quarantined' && (
                        <span className="px-1.5 py-0.2 rounded bg-[#ff5449]/20 text-[#ff5449] text-[9px] font-code-sm font-bold">
                          BLOQUEADO
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-code-sm text-[#869397] mt-1 flex-wrap">
                      <span>{contract.deployedAt}</span>
                      <span>•</span>
                      <span>
                        Liquidez: ${contract.initialLiquidityUsd.toLocaleString()} USD
                      </span>
                      <span>•</span>
                      <span
                        className={
                          contract.matchedSignatures.length > 0
                            ? 'text-[#ff5449]'
                            : 'text-[#4edea3]'
                        }
                      >
                        {contract.matchedSignatures.length > 0
                          ? `${contract.matchedSignatures.length} firmas sospechosas`
                          : 'Limpio'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-[#869397] font-code-sm block">Seguridad</span>
                    <span
                      className={`text-xs font-bold font-code-md ${
                        contract.safetyScore >= 80
                          ? 'text-[#4edea3]'
                          : contract.safetyScore >= 50
                          ? 'text-[#d0bcff]'
                          : 'text-[#ff5449]'
                      }`}
                    >
                      {contract.safetyScore}/100
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#869397]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DATABASE OF SUSPICIOUS SIGNATURES MODAL */}
      <AnimatePresence>
        {showSignaturesModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setShowSignaturesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#1d1f27] border border-[#3d494c] shadow-2xl overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#272a32] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4cd7f6]/20 border border-[#4cd7f6]/40 flex items-center justify-center text-[#4cd7f6]">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-headline-lg flex items-center gap-2">
                      Base de Datos de Firmas Sospechosas
                      <span className="px-2 py-0.5 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6] text-[10px] font-code-sm border border-[#4cd7f6]/20">
                        {SUSPICIOUS_SIGNATURES_DB.length} Firmas EVM
                      </span>
                    </h3>
                    <p className="text-xs text-[#869397]">
                      Reglas heurísticas y selectores 4byte auditados para neutralizar trampas rug-pull.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSignaturesModal(false)}
                  className="p-1.5 rounded-lg bg-[#10131a] hover:bg-[#272a32] text-[#869397] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters and Search within Modal */}
              <div className="p-4 border-b border-[#272a32] bg-[#14161f] space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#869397]" />
                  <input
                    type="text"
                    value={signatureSearch}
                    onChange={(e) => setSignatureSearch(e.target.value)}
                    placeholder="Buscar por selector (ej. 0x40c10f19), nombre o tipo de vulnerabilidad..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#10131a] border border-[#272a32] text-xs text-white placeholder-[#869397] font-code-sm focus:outline-none focus:border-[#4cd7f6]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-code-sm">
                  {[
                    { id: 'all', label: 'Todas las Categorías' },
                    { id: 'mint_abuse', label: 'Minteo Ilimitado' },
                    { id: 'honeypot_tax', label: 'Honeypot / Tasas' },
                    { id: 'liquidity_drain', label: 'Drenado Liquidez' },
                    { id: 'blacklist_freeze', label: 'Listas Negras' },
                    { id: 'proxy_takeover', label: 'Proxies' },
                    { id: 'fake_renounce', label: 'Falsa Renuncia' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSignaturesFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                        signaturesFilter === cat.id
                          ? 'bg-[#4cd7f6] text-[#003640] font-bold'
                          : 'bg-[#10131a] text-[#bcc9cd] hover:text-white border border-[#272a32]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list of signatures */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {filteredSignatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3.5 rounded-xl bg-[#10131a] border border-[#272a32] space-y-2 hover:border-[#3d494c] transition-colors text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-code-sm font-bold ${
                            sig.severity === 'critical'
                              ? 'bg-[#ff5449]/20 text-[#ff5449] border border-[#ff5449]/30'
                              : sig.severity === 'high'
                              ? 'bg-[#ff9500]/20 text-[#ff9500] border border-[#ff9500]/30'
                              : 'bg-[#d0bcff]/20 text-[#d0bcff] border border-[#d0bcff]/30'
                          }`}
                        >
                          {sig.severity.toUpperCase()}
                        </span>
                        <code className="px-1.5 py-0.5 rounded bg-[#272a32] text-[#4cd7f6] font-mono text-xs font-bold">
                          {sig.selector}
                        </code>
                        <span className="text-xs font-bold text-white">
                          {sig.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-code-sm text-[#869397]">
                        {sig.categoryLabel}
                      </span>
                    </div>

                    <p className="text-xs text-[#bcc9cd] leading-relaxed">
                      {sig.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-[#14161f] border border-[#272a32]/60 text-[11px] text-[#e1e2ec] font-code-sm space-y-1">
                      <div>
                        <span className="text-[#ffb4ab] font-bold">Mecanismo de Explotación: </span>
                        <span>{sig.exploitMechanism}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#272a32]/40 text-[10px] text-[#869397]">
                        <span>
                          <strong>Casos Históricos: </strong>
                          {sig.historicalRugExamples.join(', ')}
                        </span>
                        <span className="text-[#4edea3]">
                          {sig.detectionCount.toLocaleString()} veces interceptado
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredSignatures.length === 0 && (
                  <div className="p-8 text-center text-[#869397] text-xs">
                    No se encontraron firmas que coincidan con los filtros aplicados.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#272a32] bg-[#14161f] flex items-center justify-between text-xs font-code-sm">
                <span className="text-[#869397] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  Base de firmas sincronizada con feed de oráculos de seguridad EVM.
                </span>
                <button
                  onClick={() => setShowSignaturesModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#272a32] hover:bg-[#32353d] text-white font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
