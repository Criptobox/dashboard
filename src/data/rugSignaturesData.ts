import { SuspiciousSignature, ScannedContract } from '../types';

export const SUSPICIOUS_SIGNATURES_DB: SuspiciousSignature[] = [
  {
    id: 'sig-mint-unlimited',
    selector: '0x40c10f19',
    name: 'mint(address,uint256) [Sin Límite / Privilegio Oculto]',
    category: 'mint_abuse',
    categoryLabel: 'Emisión Inflacionaria Ilimitada',
    severity: 'critical',
    description:
      'Función de minteo sin límite de suministro máximo invocable exclusivamente por el creador o rol no verificado, permitiendo dilución instantánea del 100%.',
    exploitMechanism:
      'El atacante ejecuta la llamada para generar miles de millones de tokens y los dumpea en el pool de Uniswap/Raydium drenando toda la liquidez en ETH/SOL.',
    historicalRugExamples: ['SQUID Game Token (2021)', 'AnubisDAO Dilution', 'SafeMoon Clone v2'],
    detectionCount: 1420,
  },
  {
    id: 'sig-honeypot-tax',
    selector: '0x7e2c9183',
    name: 'setSellTax(uint256) [Impuesto Arbitrario hasta 100%]',
    category: 'honeypot_tax',
    categoryLabel: 'Honeypot de Impuesto de Venta',
    severity: 'critical',
    description:
      'Modificador de tarifa de transferencia que no tiene tope codificado en Solidity (ej. maxTax <= 10%), permitiendo elevar el impuesto de venta al 99% o 100%.',
    exploitMechanism:
      'Los usuarios compran con tasa normal (ej. 1%). Al intentar vender en DEX, el contrato deduce el 99% o revierte la transacción por slippage inalcanzable.',
    historicalRugExamples: ['DayOfDefeat Honeypot', 'PepeGold Trap', 'ArbitrumAI Token Drain'],
    detectionCount: 3892,
  },
  {
    id: 'sig-drain-liquidity',
    selector: '0x128acb08',
    name: 'emergencyWithdrawLP() [Drenado de Liquidez Sin Bloqueo]',
    category: 'liquidity_drain',
    categoryLabel: 'Retiro Forzado de Liquidez (Hard Rug)',
    severity: 'critical',
    description:
      'Método de emergencia que permite transferir tokens LP de Uniswap/PancakeSwap desde el contrato hacia la billetera del propietario sin pasar por un timelock.',
    exploitMechanism:
      'El desarrollador remueve unilateralmente los fondos del par comercial, dejando el token con valor $0.00 de manera irreversible.',
    historicalRugExamples: ['TurtleDex Exit', 'Compounder Finance Rug', 'Meerkat Finance Hack'],
    detectionCount: 2105,
  },
  {
    id: 'sig-blacklist-freeze',
    selector: '0xf9f92be4',
    name: 'blacklist(address,bool) [Congelamiento de Billeteras]',
    category: 'blacklist_freeze',
    categoryLabel: 'Lista Negra / Restricción de Venta',
    severity: 'high',
    description:
      'Función que permite al dueño añadir direcciones arbitrarias a una lista de bloqueo dentro de la lógica de _beforeTokenTransfer().',
    exploitMechanism:
      'Cualquier billetera que compre tokens con éxito es inmediatamente añadida a la lista negra por un bot del creador, imposibilitando tomar ganancias.',
    historicalRugExamples: ['MetaDog Blacklist Rug', 'FlokiShiba Trap', 'AlphaDoge Freeze'],
    detectionCount: 4710,
  },
  {
    id: 'sig-proxy-unprotected',
    selector: '0x3659cfe6',
    name: 'upgradeTo(address) [Proxy Sin Timelock ni Multi-Firma]',
    category: 'proxy_takeover',
    categoryLabel: 'Proxy con Actualización Insegura',
    severity: 'high',
    description:
      'Patrón ERC-1967 UUPS o Transparent Upgradeable Proxy controlado por una clave privada única (EOA) sin delay de gobernanza ni timelock de 48h.',
    exploitMechanism:
      'El creador despliega un contrato aparentemente seguro y legítimo. Días después reemplaza la lógica por bytecode malicioso que drena balances.',
    historicalRugExamples: ['Audius Governance Exploit', 'Rari Capital Proxy Hijack'],
    detectionCount: 890,
  },
  {
    id: 'sig-fake-renounce',
    selector: '0x715018a6',
    name: 'renounceOwnership() [Falsa Renuncia / Backdoor Operativo]',
    category: 'fake_renounce',
    categoryLabel: 'Falsa Renuncia de Propiedad',
    severity: 'high',
    description:
      'El evento OwnershipRenounced es emitido para engañar a los rastreadores de seguridad (como DexScreener o Tokensniffer), pero un operador secundario retiene privilegios.',
    exploitMechanism:
      'Se delega el rol de "manager" o "operator" a una dirección alternativa mientras se hace creer a la comunidad que el contrato es completamente inmutable.',
    historicalRugExamples: ['BabyMusk False Renounce', 'SafeYield Shadow Operator'],
    detectionCount: 1640,
  },
  {
    id: 'sig-cooldown-trap',
    selector: '0x8da5cb5b',
    name: 'setCooldownTimer(uint256) [Tiempo de Enfriamiento Extremo]',
    category: 'honeypot_tax',
    categoryLabel: 'Bloqueo por Cooldown Artificial',
    severity: 'medium',
    description:
      'Configura un intervalo de espera obligatorio entre compras y ventas de un mismo holder, permitiendo ajustar el temporizador a valores de días o meses.',
    exploitMechanism:
      'El creador ajusta el cooldown a 999999 segundos. Las transacciones de venta de los usuarios fallan con error "Cooldown active".',
    historicalRugExamples: ['ShibaRocket Cooldown Trap', 'ElonMars Delay Trap'],
    detectionCount: 975,
  },
  {
    id: 'sig-max-tx-block',
    selector: '0xec26da9a',
    name: 'setMaxTxPercent(uint256) [Tope Máximo de Venta al 0.001%]',
    category: 'honeypot_tax',
    categoryLabel: 'Restricción Máxima de Transacción',
    severity: 'medium',
    description:
      'Función que restringe la cantidad máxima de tokens transferibles por bloque a un porcentaje minúsculo del suministro total.',
    exploitMechanism:
      'Los holders solo pueden vender fracciones de centavos en cada transacción, mientras las comisiones de gas superan el valor recuperable.',
    historicalRugExamples: ['DogeMini MaxTx Lock', 'SafeMoon MiniTrap'],
    detectionCount: 1820,
  },
];

export const INITIAL_SCANNED_CONTRACTS: ScannedContract[] = [
  {
    id: 'sc-1',
    address: '0x94b3c8f8b1a7071295b3d994328b9821a719001a',
    name: 'PepeMoon Hyper Yield',
    symbol: 'PEPEY',
    chain: 'eth',
    chainLabel: 'Ethereum',
    deployedAt: 'Hace 4 minutos (Bloque #20847990)',
    deployerAddress: '0x99Fa...88e1',
    initialLiquidityUsd: 142000,
    liquidityLocked: false,
    verifiedSource: false,
    safetyScore: 11,
    riskLevel: 'critical',
    matchedSignatures: [
      SUSPICIOUS_SIGNATURES_DB[0], // mint unlimited
      SUSPICIOUS_SIGNATURES_DB[1], // honeypot tax 99%
      SUSPICIOUS_SIGNATURES_DB[3], // blacklist freeze
    ],
    simulation: {
      canBuy: true,
      canSell: false,
      buyTaxPct: 1.5,
      sellTaxPct: 99.4,
      honeypotDetected: true,
      isBlacklistCapable: true,
      isMaxWalletRestricted: true,
      simulationGasUnits: 412000,
      simulationResultNote:
        'Honeypot Crítico Detectado: La función de venta aplica un impuesto destructivo del 99.4% y añade el remitente a una lista negra automática.',
    },
    aiSummary:
      'ALERTA RUG-PULL CRÍTICA: Código no verificado con función de emisión ilimitada y tarifa de venta confiscatoria del 99.4%. La liquidez inicial no está bloqueada en ningún casillero de custodia.',
    status: 'quarantined',
  },
  {
    id: 'sc-2',
    address: '0x7e29a55c2f9012a819b1308a9f029384b1028341',
    name: 'SafeVault DAO Protocol',
    symbol: 'SVAULT',
    chain: 'arbitrum',
    chainLabel: 'Arbitrum One',
    deployedAt: 'Hace 18 minutos (Bloque #25419902)',
    deployerAddress: '0x4cd7...9921',
    initialLiquidityUsd: 450000,
    liquidityLocked: true,
    lockDuration: '365 días en Unicrypt Locker',
    verifiedSource: true,
    safetyScore: 94,
    riskLevel: 'safe',
    matchedSignatures: [],
    simulation: {
      canBuy: true,
      canSell: true,
      buyTaxPct: 0.1,
      sellTaxPct: 0.1,
      honeypotDetected: false,
      isBlacklistCapable: false,
      isMaxWalletRestricted: false,
      simulationGasUnits: 128000,
      simulationResultNote:
        'Auditoría Aprobada: Venta y compra fluidas en Uniswap v3 sin tasas abusivas ni ganchos de lista negra.',
    },
    aiSummary:
      'Contrato auditado y verificado con OpenZeppelin v5.0. Liquidez asegurada en casillero institucional por 1 año y propiedad delegada en Safe Gnosis Multi-Sig.',
    status: 'safe',
  },
  {
    id: 'sc-3',
    address: '0x1092834b91823746a8109283746b1029384b1028',
    name: 'MetaElon AI Doge',
    symbol: 'MELON',
    chain: 'base',
    chainLabel: 'Base',
    deployedAt: 'Hace 32 minutos (Bloque #19821034)',
    deployerAddress: '0x181a...33df',
    initialLiquidityUsd: 89000,
    liquidityLocked: false,
    verifiedSource: false,
    safetyScore: 18,
    riskLevel: 'critical',
    matchedSignatures: [
      SUSPICIOUS_SIGNATURES_DB[0], // mint unlimited
      SUSPICIOUS_SIGNATURES_DB[2], // drain liquidity
      SUSPICIOUS_SIGNATURES_DB[5], // fake renounce
    ],
    simulation: {
      canBuy: true,
      canSell: false,
      buyTaxPct: 2.0,
      sellTaxPct: 95.0,
      honeypotDetected: true,
      isBlacklistCapable: false,
      isMaxWalletRestricted: true,
      simulationGasUnits: 380000,
      simulationResultNote:
        'Falla en Revert de Transferencia: El creador mantiene permisos ocultos para retirar tokens LP directamente a su billetera.',
    },
    aiSummary:
      'Falsa renuncia de propiedad detectada (evento falso con dirección alternativa en almacenamiento). Posible retiro abrupto de liquidez en las próximas horas.',
    status: 'quarantined',
  },
  {
    id: 'sc-4',
    address: '0x3847291834710928374619028374610928374610',
    name: 'Quantum Arbitrum Vault',
    symbol: 'QARB',
    chain: 'arbitrum',
    chainLabel: 'Arbitrum One',
    deployedAt: 'Hace 1 hora (Bloque #25419400)',
    deployerAddress: '0x627e...ea90',
    initialLiquidityUsd: 210000,
    liquidityLocked: true,
    lockDuration: '30 días',
    verifiedSource: true,
    safetyScore: 62,
    riskLevel: 'moderate',
    matchedSignatures: [
      SUSPICIOUS_SIGNATURES_DB[4], // proxy unprotected
    ],
    simulation: {
      canBuy: true,
      canSell: true,
      buyTaxPct: 1.0,
      sellTaxPct: 1.5,
      honeypotDetected: false,
      isBlacklistCapable: false,
      isMaxWalletRestricted: true,
      simulationGasUnits: 175000,
      simulationResultNote:
        'Comercio funcional, pero la lógica del contrato puede modificarse unilateralmente mediante upgradeTo() sin período de gracia.',
    },
    aiSummary:
      'Riesgo Moderado: Arquitectura de proxy actualizable sin timelock. Se aconseja monitorear cambios en la implementación antes de incrementar exposición.',
    status: 'monitoring',
  },
];

export const scanContractCustom = (
  input: string,
  chain: string = 'eth'
): ScannedContract => {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // Check if matches known samples
  const known = INITIAL_SCANNED_CONTRACTS.find(
    (c) =>
      c.address.toLowerCase() === lower ||
      c.symbol.toLowerCase() === lower ||
      c.name.toLowerCase().includes(lower)
  );
  if (known) return known;

  // Generate dynamic algorithmic scan based on address hash characters
  const isSuspicious =
    lower.includes('pepe') ||
    lower.includes('doge') ||
    lower.includes('moon') ||
    lower.includes('elon') ||
    lower.includes('pump') ||
    lower.includes('yield') ||
    lower.endsWith('rug') ||
    lower.endsWith('bad');

  const randomHash =
    trimmed.startsWith('0x') && trimmed.length >= 10
      ? trimmed
      : `0x${Math.random().toString(16).substring(2, 10)}${Math.random()
          .toString(16)
          .substring(2, 10)}${Math.random().toString(16).substring(2, 10)}99b2`;

  if (isSuspicious) {
    const matched = [
      SUSPICIOUS_SIGNATURES_DB[1], // honeypot sell tax
      SUSPICIOUS_SIGNATURES_DB[3], // blacklist
    ];
    return {
      id: `sc-custom-${Date.now()}`,
      address: randomHash,
      name: `${trimmed.toUpperCase() || 'UNKNOWN'} Token Protocol`,
      symbol: (trimmed.substring(0, 5) || 'TOKEN').toUpperCase(),
      chain,
      chainLabel: chain === 'arbitrum' ? 'Arbitrum' : chain === 'base' ? 'Base' : 'Ethereum',
      deployedAt: 'Detectado en Mempool hace 1 minuto',
      deployerAddress: '0x' + Math.random().toString(16).substring(2, 10) + '...',
      initialLiquidityUsd: 48000,
      liquidityLocked: false,
      verifiedSource: false,
      safetyScore: 16,
      riskLevel: 'critical',
      matchedSignatures: matched,
      simulation: {
        canBuy: true,
        canSell: false,
        buyTaxPct: 3.5,
        sellTaxPct: 98.0,
        honeypotDetected: true,
        isBlacklistCapable: true,
        isMaxWalletRestricted: true,
        simulationGasUnits: 450000,
        simulationResultNote:
          'Simulación Revertida: La venta en Uniswap falla con error "Pancake: TRANSFER_FAILED" debido a impuesto confiscatorio del 98%.',
      },
      aiSummary:
        'VULNERABILIDAD CRÍTICA RUG-PULL: Firmas de Honeypot y Lista Negra detectadas en el bytecode. Los inversores no podrán retirar capital.',
      status: 'quarantined',
    };
  }

  // Otherwise, realistic audited contract
  return {
    id: `sc-custom-${Date.now()}`,
    address: randomHash,
    name: `${trimmed.toUpperCase() || 'CUSTOM'} Network Token`,
    symbol: (trimmed.substring(0, 5) || 'CSTM').toUpperCase(),
    chain,
    chainLabel: chain === 'arbitrum' ? 'Arbitrum' : chain === 'base' ? 'Base' : 'Ethereum',
    deployedAt: 'Detectado en Mempool hace 8 minutos',
    deployerAddress: '0x' + Math.random().toString(16).substring(2, 10) + '...',
    initialLiquidityUsd: 320000,
    liquidityLocked: true,
    lockDuration: '180 días en Team Finance',
    verifiedSource: true,
    safetyScore: 88,
    riskLevel: 'safe',
    matchedSignatures: [],
    simulation: {
      canBuy: true,
      canSell: true,
      buyTaxPct: 0.5,
      sellTaxPct: 0.5,
      honeypotDetected: false,
      isBlacklistCapable: false,
      isMaxWalletRestricted: false,
      simulationGasUnits: 145000,
      simulationResultNote:
        'Simulación Exitosa: Ambos flujos de compra y venta operan normalmente sin firmas de captura de liquidez.',
    },
    aiSummary:
      'Código verificado con buenas prácticas de seguridad. Sin métodos de minteo ilimitado ni listas negras activas.',
    status: 'safe',
  };
};

export const generateMempoolDeploymentSample = (): ScannedContract => {
  const isMalicious = Math.random() > 0.4;
  const chainOptions = [
    { chain: 'eth', chainLabel: 'Ethereum' },
    { chain: 'arbitrum', chainLabel: 'Arbitrum One' },
    { chain: 'base', chainLabel: 'Base' },
  ];
  const chosenChain = chainOptions[Math.floor(Math.random() * chainOptions.length)];

  if (isMalicious) {
    const names = [
      { name: 'TurboShiba AI Yield', symbol: 'TSHIBA' },
      { name: 'Quantum Pepe Drainer', symbol: 'QPEPE' },
      { name: 'Arbitrum Rocket Moon', symbol: 'ARMOON' },
      { name: 'FastSwap 100x Protocol', symbol: 'FSWAP' },
    ];
    const picked = names[Math.floor(Math.random() * names.length)];
    const matched = [
      SUSPICIOUS_SIGNATURES_DB[1], // sell tax
      SUSPICIOUS_SIGNATURES_DB[0], // mint
    ];

    return {
      id: `sc-auto-${Date.now()}`,
      address: `0x${Math.random().toString(16).substring(2, 10)}${Math.random()
        .toString(16)
        .substring(2, 10)}${Math.random().toString(16).substring(2, 10)}dead`,
      name: picked.name,
      symbol: picked.symbol,
      chain: chosenChain.chain,
      chainLabel: chosenChain.chainLabel,
      deployedAt: 'Justo ahora (Mempool en Vivo)',
      deployerAddress: `0x${Math.random().toString(16).substring(2, 8)}...`,
      initialLiquidityUsd: Math.floor(Math.random() * 80000 + 20000),
      liquidityLocked: false,
      verifiedSource: false,
      safetyScore: Math.floor(Math.random() * 18 + 5),
      riskLevel: 'critical',
      matchedSignatures: matched,
      simulation: {
        canBuy: true,
        canSell: false,
        buyTaxPct: 2.0,
        sellTaxPct: 99.0,
        honeypotDetected: true,
        isBlacklistCapable: true,
        isMaxWalletRestricted: true,
        simulationGasUnits: 430000,
        simulationResultNote:
          'Honeypot Interceptado: Se detectó firma 0x7e2c9183 con tarifa confiscatoria del 99%.',
      },
      aiSummary:
        'ALERTA RUG-PULL EN MEMPOOL: Nuevo contrato detectado con firma de bloqueo de venta e impuesto letal. Se recomienda cuarentena inmediata.',
      status: 'quarantined',
    };
  } else {
    const names = [
      { name: 'Nexus Liquid Staking', symbol: 'NEXUS' },
      { name: 'Aetheria DePIN Network', symbol: 'AETH' },
      { name: 'Synthetix Arbitrum v3', symbol: 'SNX3' },
    ];
    const picked = names[Math.floor(Math.random() * names.length)];

    return {
      id: `sc-auto-${Date.now()}`,
      address: `0x${Math.random().toString(16).substring(2, 10)}${Math.random()
        .toString(16)
        .substring(2, 10)}${Math.random().toString(16).substring(2, 10)}beef`,
      name: picked.name,
      symbol: picked.symbol,
      chain: chosenChain.chain,
      chainLabel: chosenChain.chainLabel,
      deployedAt: 'Justo ahora (Mempool en Vivo)',
      deployerAddress: `0x${Math.random().toString(16).substring(2, 8)}...`,
      initialLiquidityUsd: Math.floor(Math.random() * 300000 + 150000),
      liquidityLocked: true,
      lockDuration: '180 días en PinkLock',
      verifiedSource: true,
      safetyScore: Math.floor(Math.random() * 10 + 88),
      riskLevel: 'safe',
      matchedSignatures: [],
      simulation: {
        canBuy: true,
        canSell: true,
        buyTaxPct: 0.2,
        sellTaxPct: 0.2,
        honeypotDetected: false,
        isBlacklistCapable: false,
        isMaxWalletRestricted: false,
        simulationGasUnits: 132000,
        simulationResultNote: 'Contrato legítimo verificado con liquidez bloqueada y bajas comisiones.',
      },
      aiSummary:
        'Código auditado y verificado. Sin anomalías en la simulación de compra/venta.',
      status: 'safe',
    };
  }
};
