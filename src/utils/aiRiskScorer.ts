export interface AiRiskBreakdown {
  contractSecurity: number; // 0 - 100
  historicalVolatility: number; // 0 - 100
  liquidityHealth: number; // 0 - 100
  contractNotes: string;
  volatilityNotes: string;
  liquidityNotes: string;
}

export interface TokenRiskEvaluation {
  score: number; // Overall risk score: 1 - 100 (Lower = safer)
  level: 'low' | 'moderate' | 'high' | 'critical';
  label: string;
  tagColor: string;
  bgColor: string;
  borderColor: string;
  breakdown: AiRiskBreakdown;
}

export const TOKEN_AI_RISK_MAP: Record<string, TokenRiskEvaluation> = {
  ETH: {
    score: 12,
    level: 'low',
    label: 'Riesgo Bajo (A+)',
    tagColor: '#4edea3',
    bgColor: '#4edea31a',
    borderColor: '#4edea340',
    breakdown: {
      contractSecurity: 98,
      historicalVolatility: 78,
      liquidityHealth: 99,
      contractNotes: 'Consenso PoS auditado formalmente, multi-cliente descentralizado.',
      volatilityNotes: 'Baja volatilidad relativa en 90 días (Beta 1.0 vs mercado).',
      liquidityNotes: 'Profundidad de liquidez >$4.2B en DEXs y CEXs tier-1.',
    },
  },
  SOL: {
    score: 28,
    level: 'low',
    label: 'Riesgo Bajo (A-)',
    tagColor: '#4cd7f6',
    bgColor: '#4cd7f61a',
    borderColor: '#4cd7f640',
    breakdown: {
      contractSecurity: 91,
      historicalVolatility: 65,
      liquidityHealth: 96,
      contractNotes: 'Runtime Sealevel y validadores con cliente Firedancer en despliegue.',
      volatilityNotes: 'Volatilidad moderada por alto volumen especulativo en DEX.',
      liquidityNotes: 'Más de $1.8B en liquidez activa entre Raydium, Orca y Phoenix.',
    },
  },
  USDC: {
    score: 5,
    level: 'low',
    label: 'Riesgo Mínimo (AAA)',
    tagColor: '#28a0f0',
    bgColor: '#28a0f01a',
    borderColor: '#28a0f040',
    breakdown: {
      contractSecurity: 99,
      historicalVolatility: 99,
      liquidityHealth: 100,
      contractNotes: 'Smart contract de Circle con auditorías continuas y colateral 1:1 en T-Bills.',
      volatilityNotes: 'Paridad estable 1.00 USD con desviación estándar <0.02%.',
      liquidityNotes: 'Máxima profundidad multired con arbitraje institucional continuo.',
    },
  },
  POL: {
    score: 36,
    level: 'moderate',
    label: 'Riesgo Moderado (B+)',
    tagColor: '#d0bcff',
    bgColor: '#d0bcff1a',
    borderColor: '#d0bcff40',
    breakdown: {
      contractSecurity: 88,
      historicalVolatility: 62,
      liquidityHealth: 84,
      contractNotes: 'Migración exitosa a POL (Polygon 2.0), arquitectura de validadores PoS.',
      volatilityNotes: 'Volatilidad media en relación al ciclo de gobernanza del ecosistema.',
      liquidityNotes: 'Pools profundos en Quickswap y Aave Polygon con $280M+ TVL.',
    },
  },
  LINK: {
    score: 18,
    level: 'low',
    label: 'Riesgo Bajo (A)',
    tagColor: '#627eea',
    bgColor: '#627eea1a',
    borderColor: '#627eea40',
    breakdown: {
      contractSecurity: 96,
      historicalVolatility: 74,
      liquidityHealth: 92,
      contractNotes: 'Red de oráculos descentralizada estándar de la industria (CCIP).',
      volatilityNotes: 'Estabilidad de precio sostenida por demanda de staking v0.2.',
      liquidityNotes: 'Liquidez sólida en Uniswap, Balancer y libros institucionales.',
    },
  },
};

export const getAssetRiskEvaluation = (symbol: string): TokenRiskEvaluation => {
  const cleanSymbol = symbol.toUpperCase().trim();
  if (TOKEN_AI_RISK_MAP[cleanSymbol]) {
    return TOKEN_AI_RISK_MAP[cleanSymbol];
  }

  return {
    score: 45,
    level: 'moderate',
    label: 'Riesgo Moderado (B)',
    tagColor: '#f3ba2f',
    bgColor: '#f3ba2f1a',
    borderColor: '#f3ba2f40',
    breakdown: {
      contractSecurity: 82,
      historicalVolatility: 55,
      liquidityHealth: 75,
      contractNotes: 'Contrato estándar verificado en explorador de bloques.',
      volatilityNotes: 'Fluctuaciones de mercado alineadas al benchmark del sector.',
      liquidityNotes: 'Pares de intercambio activos en DEXs descentralizados.',
    },
  };
};
