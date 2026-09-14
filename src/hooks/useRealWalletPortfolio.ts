import { useEffect, useRef, useState } from 'react';
import { TokenItem, WalletState } from '../types';
import {
  CHAIN_INFO,
  fetchUsdPrices,
  getChainId,
  getErc20Balance,
  getInjectedProvider,
  getNativeBalance,
} from '../utils/web3';

interface RealPortfolioResult {
  tokens: TokenItem[] | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the CONNECTED wallet's real on-chain balances (native coin + USDC on
 * whichever chain the wallet is currently pointed at) so the dashboard can show
 * actual holdings instead of the app's demo portfolio once a wallet connects.
 */
export function useRealWalletPortfolio(walletState: WalletState): RealPortfolioResult {
  const [tokens, setTokens] = useState<TokenItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainNonce, setChainNonce] = useState(0);
  const requestIdRef = useRef(0);

  // Re-fetch whenever the wallet's active chain changes, even though the address stays the same.
  useEffect(() => {
    if (!walletState.isConnected) return;
    const provider = getInjectedProvider();
    if (!provider?.on || !provider.removeListener) return;
    const handleChainChanged = () => setChainNonce((n) => n + 1);
    provider.on('chainChanged', handleChainChanged);
    return () => provider.removeListener?.('chainChanged', handleChainChanged);
  }, [walletState.isConnected]);

  useEffect(() => {
    // WalletConnect has no browser extension here to actually query — it's an
    // explicitly labeled simulation, so it must never trigger a real on-chain
    // read (which would otherwise query whatever address the simulation made
    // up, through whatever injected provider happens to be installed).
    if (!walletState.isConnected || !walletState.address || walletState.provider === 'walletconnect') {
      setTokens(null);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const chainId = await getChainId();
        const chainInfo = CHAIN_INFO[chainId];

        if (!chainInfo) {
          if (!cancelled && requestIdRef.current === requestId) {
            setError('UNSUPPORTED_CHAIN');
            // No real data available for this chain — leave `tokens` null so
            // callers fall back to the demo portfolio instead of an empty list.
            setTokens(null);
            setIsLoading(false);
          }
          return;
        }

        const nativeBalance = await getNativeBalance(walletState.address);
        const usdcBalance = chainInfo.usdcAddress
          ? await getErc20Balance(chainInfo.usdcAddress, walletState.address, 6)
          : 0;

        const priceIds = [chainInfo.coingeckoId];
        const prices = await fetchUsdPrices(priceIds);
        const nativePrice = prices[chainInfo.coingeckoId] || 0;

        if (cancelled || requestIdRef.current !== requestId) return;

        const result: TokenItem[] = [
          {
            id: `real-${chainInfo.key}-native`,
            name: chainInfo.nativeName,
            symbol: chainInfo.nativeSymbol,
            chain: chainInfo.key,
            chainLabel: chainInfo.label,
            priceUsd: nativePrice,
            change24h: 0,
            balance: nativeBalance,
            valueUsd: nativeBalance * nativePrice,
            iconType: chainInfo.nativeSymbol === 'ETH' ? 'eth' : chainInfo.nativeSymbol === 'POL' ? 'pol' : 'usd',
          },
        ];

        if (chainInfo.usdcAddress && usdcBalance > 0) {
          result.push({
            id: `real-${chainInfo.key}-usdc`,
            name: 'USD Coin',
            symbol: 'USDC',
            chain: chainInfo.key,
            chainLabel: chainInfo.label,
            priceUsd: 1,
            change24h: 0,
            balance: usdcBalance,
            valueUsd: usdcBalance,
            iconType: 'usd',
          });
        }

        setTokens(result);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled && requestIdRef.current === requestId) {
          setError(err instanceof Error ? err.message : 'UNKNOWN_ERROR');
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [walletState.isConnected, walletState.address, walletState.provider, chainNonce]);

  return { tokens, isLoading, error };
}
