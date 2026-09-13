export type ScreenTab = 'dashboard' | 'rescue' | 'airdrops' | 'nfts' | 'alertas-ia' | 'settings';

export interface NotificationSettings {
  // Push Master & Channels
  pushEnabled: boolean;
  browserPush: boolean;
  soundAlerts: boolean;
  hapticFeedback: boolean;
  telegramSync: boolean;

  // Wallet Alerts
  incomingTransfers: boolean;
  outgoingTransfers: boolean;
  minTransferThresholdUsd: number;
  unlimitedApprovals: boolean;
  priceVolatilityAlerts: boolean;
  volatilityThresholdPercent: number;
  gasPriceAlerts: boolean;
  gasThresholdGwei: number;
  newAirdropsEligible: boolean;

  // Security Alerts
  phishingProtection: boolean;
  sandwichMevProtection: boolean;
  vulnerableContractRevocation: boolean;
  unknownDappConnections: boolean;
  fundRescueFound: boolean;
}

export interface NotificationLogItem {
  id: string;
  type: 'wallet' | 'security' | 'gas';
  title: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
}

export interface AirdropCriterion {
  id: string;
  label: string;
  completed: boolean;
  scoreWeight?: string;
}

export interface AirdropItem {
  id: string;
  name: string;
  symbol: string;
  network: string;
  networkBadge: string;
  status: 'ready' | 'near' | 'claimed';
  allocatedTokens: number;
  estimatedUsd: number;
  claimDeadline?: string;
  progressPercent: number; // 0 to 100
  criteria: AirdropCriterion[];
  category: 'L2 Rollup' | 'Interoperabilidad' | 'DeFi Perp' | 'EVM Paralela' | 'Restaking';
  description: string;
  gasCostEstimateUsd: number;
  officialClaimContract: string;
}

export interface TokenItem {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chainLabel: string;
  priceUsd: number;
  change24h: number;
  balance: number;
  valueUsd: number;
  iconType: 'eth' | 'sol' | 'usd' | 'pol' | 'link';
}

export interface RecoverableContract {
  id: string;
  title: string;
  category: string;
  categoryType: 'warning' | 'alert' | 'success' | 'neutral';
  description: string;
  chain: string;
  chainBadge: string;
  amountUsd: number;
  contractHash: string;
  fullHash: string;
  gasCost: string;
  originNetwork: string;
  protocol: string;
  explorerUrl: string;
  selected: boolean;
  rescued?: boolean;
}

export interface NftItem {
  id: string;
  title: string;
  tokenId: string;
  collection: string;
  chain: string;
  imageUrl: string;
  floorPrice: string;
  floorUsd: string;
  rarityBadge?: string;
  receivedOfferBadge?: string;
  huddleBadge?: string;
  alertThreshold?: string;
  alertActive: boolean;
  marketplaces: {
    name: string;
    price: string;
    isBest?: boolean;
    note?: string;
    dotColor: string;
  }[];
  instantBid?: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
}

export interface AiAction {
  id: string;
  type: 'security' | 'yield' | 'gas';
  typeLabel: string;
  chain: string;
  title: string;
  description: string;
  metricBadge: string;
  highlightVal?: string;
  actionButtonText: string;
  completed: boolean;
}

export interface PushSentinel {
  id: string;
  title: string;
  subtitle: string;
  metaInfo: string;
  enabled: boolean;
  locked?: boolean;
  icon: string;
  iconColor: string;
  tokenSymbol?: string;
  currentPrice?: number;
  targetPrice?: number;
  condition?: 'above' | 'below';
  triggered?: boolean;
  triggeredAt?: string;
  notificationChannel?: 'websocket' | 'push' | 'sound';
}

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase';

export interface WalletState {
  isConnected: boolean;
  provider: WalletProvider | null;
  address: string;
}

export type TransactionInteractionType =
  | 'send'
  | 'receive'
  | 'swap'
  | 'rescue'
  | 'approval'
  | 'airdrop'
  | 'staking';

export type TransactionStatus = 'confirmed' | 'pending' | 'failed';

export interface TransactionRecord {
  id: string;
  hash: string;
  chain: string;
  chainLabel: string;
  type: TransactionInteractionType;
  typeLabel: string;
  title: string;
  description: string;
  status: TransactionStatus;
  confirmations: number;
  requiredConfirmations: number;
  timestamp: string;
  blockNumber: number;
  fromAddress: string;
  fromLabel?: string;
  toAddress: string;
  toLabel?: string;
  amountDisplay: string;
  amountUsdDisplay: string;
  isPositive: boolean;
  gasFeeEth: string;
  gasFeeUsd: string;
  gasUsed: string;
  gasPriceGwei: number;
  savedWithEcoGasUsd?: string;
  contractMethod?: string;
  mevProtected?: boolean;
  explorerUrl: string;
  explorerName: string;
}
