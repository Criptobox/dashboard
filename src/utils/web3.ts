/**
 * Minimal EIP-1193 helpers for talking to a real injected wallet (MetaMask,
 * Coinbase Wallet extension, Brave Wallet, etc.) with no external SDK and no
 * API key: every read goes through the wallet's own injected provider, so
 * there is no third-party RPC endpoint or CORS concern to manage.
 */

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export interface ChainInfo {
  key: string;
  label: string;
  nativeSymbol: string;
  nativeName: string;
  coingeckoId: string;
  usdcAddress?: string;
  explorer: string;
}

// Chain IDs and metadata for every EVM network this dashboard already displays.
export const CHAIN_INFO: Record<number, ChainInfo> = {
  1: {
    key: 'eth',
    label: 'Ethereum Mainnet',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    coingeckoId: 'ethereum',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    explorer: 'https://etherscan.io',
  },
  137: {
    key: 'polygon',
    label: 'Polygon PoS',
    nativeSymbol: 'POL',
    nativeName: 'Polygon',
    coingeckoId: 'matic-network',
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    explorer: 'https://polygonscan.com',
  },
  42161: {
    key: 'arb',
    label: 'Arbitrum One',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    coingeckoId: 'ethereum',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    explorer: 'https://arbiscan.io',
  },
  8453: {
    key: 'base',
    label: 'Base Layer 2',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    coingeckoId: 'ethereum',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    explorer: 'https://basescan.org',
  },
  10: {
    key: 'op',
    label: 'Optimism Mainnet',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    coingeckoId: 'ethereum',
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    explorer: 'https://optimistic.etherscan.io',
  },
  56: {
    key: 'bnb',
    label: 'BNB Smart Chain',
    nativeSymbol: 'BNB',
    nativeName: 'BNB',
    coingeckoId: 'binancecoin',
    usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    explorer: 'https://bscscan.com',
  },
};

export function getInjectedProvider(): Eip1193Provider | null {
  return typeof window !== 'undefined' && window.ethereum ? window.ethereum : null;
}

export function hasInjectedProvider(): boolean {
  return getInjectedProvider() !== null;
}

export function getInjectedProviderLabel(provider: Eip1193Provider): 'metamask' | 'coinbase' | 'injected' {
  if (provider.isMetaMask) return 'metamask';
  if (provider.isCoinbaseWallet) return 'coinbase';
  return 'injected';
}

/** Opens the wallet's own account-selection prompt and returns the real connected address. */
export async function requestRealAccount(): Promise<string> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error('NO_PROVIDER');
  }
  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('NO_ACCOUNTS');
  }
  return accounts[0];
}

export async function getChainId(): Promise<number> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error('NO_PROVIDER');
  const hex = (await provider.request({ method: 'eth_chainId' })) as string;
  return parseInt(hex, 16);
}

/** Reads the native coin balance (ETH/POL/BNB) for an address, in whole units. */
export async function getNativeBalance(address: string): Promise<number> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error('NO_PROVIDER');
  const hex = (await provider.request({
    method: 'eth_getBalance',
    params: [address, 'latest'],
  })) as string;
  return weiHexToUnits(hex, 18);
}

/** Reads an ERC-20 balanceOf(address) via eth_call and decodes it using the token's decimals. */
export async function getErc20Balance(
  tokenAddress: string,
  ownerAddress: string,
  decimals: number
): Promise<number> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error('NO_PROVIDER');
  const paddedAddress = ownerAddress.toLowerCase().replace('0x', '').padStart(64, '0');
  const data = `0x70a08231${paddedAddress}`; // balanceOf(address) selector
  const result = (await provider.request({
    method: 'eth_call',
    params: [{ to: tokenAddress, data }, 'latest'],
  })) as string;
  return weiHexToUnits(result, decimals);
}

function weiHexToUnits(hex: string, decimals: number): number {
  if (!hex || hex === '0x') return 0;
  const raw = BigInt(hex);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  // Keep up to 6 fractional digits of precision for display purposes.
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 6);
  return parseFloat(`${whole}.${fractionStr}`);
}

/** Public CoinGecko price lookup — no API key required for this endpoint. */
export async function fetchUsdPrices(coingeckoIds: string[]): Promise<Record<string, number>> {
  const uniqueIds = Array.from(new Set(coingeckoIds));
  if (uniqueIds.length === 0) return {};
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds.join(',')}&vs_currencies=usd`
    );
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, { usd?: number }>;
    const prices: Record<string, number> = {};
    for (const id of uniqueIds) {
      if (data[id]?.usd) prices[id] = data[id].usd as number;
    }
    return prices;
  } catch {
    return {};
  }
}
