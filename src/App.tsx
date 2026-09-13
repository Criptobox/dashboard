/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ScreenTab,
  TokenItem,
  RecoverableContract,
  NftItem,
  AiAction,
  PushSentinel,
  AirdropItem,
  WalletProvider,
  WalletState,
  TransactionRecord,
} from './types';
import {
  INITIAL_TOKENS,
  INITIAL_RESCUE_CONTRACTS,
  INITIAL_NFTS,
  INITIAL_AI_ACTIONS,
  INITIAL_PUSH_SENTINELS,
  INITIAL_AIRDROPS,
  INITIAL_TRANSACTIONS,
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardScreen } from './components/DashboardScreen';
import { RescueScreen } from './components/RescueScreen';
import { NftsScreen } from './components/NftsScreen';
import { AiAlertsScreen } from './components/AiAlertsScreen';
import { AirdropsScreen } from './components/AirdropsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ActionModals } from './components/ActionModals';

export default function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('dashboard');
  const [currentChain, setCurrentChain] = useState<string>('all');

  // Application data states
  const [tokens, setTokens] = useState<TokenItem[]>(INITIAL_TOKENS);
  const [rescueContracts, setRescueContracts] = useState<RecoverableContract[]>(INITIAL_RESCUE_CONTRACTS);
  const [nfts, setNfts] = useState<NftItem[]>(INITIAL_NFTS);
  const [aiActions, setAiActions] = useState<AiAction[]>(INITIAL_AI_ACTIONS);
  const [pushSentinels, setPushSentinels] = useState<PushSentinel[]>(INITIAL_PUSH_SENTINELS);
  const [airdrops, setAirdrops] = useState<AirdropItem[]>(INITIAL_AIRDROPS);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);

  // Web3 Wallet Connection State (defaults to disconnected so 'Conectar Wallet' button is prominent)
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    provider: null,
    address: '',
  });

  const handleConnectWallet = (provider: WalletProvider, address: string) => {
    setWalletState({
      isConnected: true,
      provider,
      address,
    });
  };

  const handleDisconnectWallet = () => {
    setWalletState({
      isConnected: false,
      provider: null,
      address: '',
    });
  };

  // Global Gas Saver Mode State
  const [gasSaverMode, setGasSaverMode] = useState<boolean>(true);

  // Global feedback toast
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  // Action Modals (send / receive / swap / bridge)
  const [activeActionModal, setActiveActionModal] = useState<'send' | 'receive' | 'swap' | 'bridge' | null>(null);
  const [selectedTokenForAction, setSelectedTokenForAction] = useState<TokenItem | undefined>(undefined);

  // Rescue Execution Modal
  const [rescueModalData, setRescueModalData] = useState<{
    isOpen: boolean;
    contracts: RecoverableContract[];
    totalAmount: number;
  } | null>(null);

  // Gas Ops Modal
  const [showPendingGasModal, setShowPendingGasModal] = useState(false);

  const showToast = (title: string, message: string) => {
    setToast({ title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 3800);
  };

  // Toggle Global Gas Saver Mode
  const handleToggleGasSaverMode = () => {
    const nextState = !gasSaverMode;
    setGasSaverMode(nextState);
    if (nextState) {
      showToast(
        "Modo Ahorro de Gas Activado",
        "Prioridad de gas reducida a 7 Gwei (-55% tarifas). Transacciones agrupadas en bloques off-peak."
      );
    } else {
      showToast(
        "Modo Gas Estándar Activado",
        "Prioridad configurada a 14 Gwei para confirmaciones rápidas en mempool."
      );
    }
  };

  // Claim Airdrop Handler
  const handleClaimAirdrop = (targetAirdrop: AirdropItem) => {
    if (targetAirdrop.status !== 'ready') return;
    const airdropId = targetAirdrop.id;

    // Simulate claiming
    setAirdrops((prev) =>
      prev.map((a) =>
        a.id === airdropId ? { ...a, status: 'claimed' as const } : a
      )
    );

    // Credit value to tokens list
    setTokens((prev) => {
      const existing = prev.find((t) => t.symbol.toUpperCase() === targetAirdrop.symbol.toUpperCase());
      if (existing) {
        return prev.map((t) =>
          t.id === existing.id
            ? {
                ...t,
                balance: t.balance + targetAirdrop.allocatedTokens,
                valueUsd: t.valueUsd + targetAirdrop.estimatedUsd,
              }
            : t
        );
      }
      return [
        ...prev,
        {
          id: targetAirdrop.id,
          symbol: targetAirdrop.symbol,
          name: targetAirdrop.name,
          chain: targetAirdrop.network.toLowerCase(),
          chainLabel: targetAirdrop.network,
          balance: targetAirdrop.allocatedTokens,
          priceUsd: targetAirdrop.estimatedUsd / targetAirdrop.allocatedTokens,
          valueUsd: targetAirdrop.estimatedUsd,
          change24h: 4.8,
          iconType: 'eth',
        },
      ];
    });

    // Add confirmed transaction to history
    const randomHex = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const airdropTx: TransactionRecord = {
      id: `tx-claim-${Date.now()}`,
      hash: `0x${randomHex}`,
      chain: targetAirdrop.networkBadge?.toLowerCase() || 'arb',
      chainLabel: targetAirdrop.network,
      type: 'airdrop',
      typeLabel: 'Reclamo Airdrop',
      title: `Reclamo Airdrop ${targetAirdrop.name}`,
      description: `Asignación de ${targetAirdrop.allocatedTokens.toLocaleString()} ${targetAirdrop.symbol} acreditada en bóveda`,
      status: 'confirmed',
      confirmations: 64,
      requiredConfirmations: 64,
      timestamp: 'Ahora mismo',
      blockNumber: 24190920,
      fromAddress: targetAirdrop.officialClaimContract || '0x66aB6D9362d4F35596279692F0251Db635165871',
      fromLabel: `${targetAirdrop.symbol} Distributor`,
      toAddress: '0x7F29b8A649c096EdfC7802Db349F899e072fa9B2',
      toLabel: 'OmniVault Hot Wallet',
      amountDisplay: `+${targetAirdrop.allocatedTokens.toLocaleString()} ${targetAirdrop.symbol}`,
      amountUsdDisplay: `+$${targetAirdrop.estimatedUsd.toFixed(2)}`,
      isPositive: true,
      gasFeeEth: '0.00011 ETH',
      gasFeeUsd: '$0.37',
      gasUsed: '78,500 units',
      gasPriceGwei: 0.12,
      contractMethod: 'claim(uint256,bytes32[])',
      mevProtected: true,
      explorerUrl: `https://arbiscan.io/tx/0x${randomHex}`,
      explorerName: 'Arbiscan',
    };
    setTransactions((prev) => [airdropTx, ...prev]);

    const feeSaved = gasSaverMode ? "$0.42 USD (Ahorro Gas -55%)" : "$1.20 USD";
    showToast(
      `¡${targetAirdrop.allocatedTokens.toLocaleString()} ${targetAirdrop.symbol} Reclamados!`,
      `Valor de $${targetAirdrop.estimatedUsd.toLocaleString()} USD depositado en tu bóveda. Tarifa: ${feeSaved}`
    );
  };

  // Mark an airdrop eligibility criterion as completed
  const handleCompleteCriterion = (airdropId: string, criterionId: string) => {
    setAirdrops((prev) =>
      prev.map((a) => {
        if (a.id !== airdropId) return a;
        const criteria = a.criteria.map((c) =>
          c.id === criterionId ? { ...c, completed: true } : c
        );
        const completedCount = criteria.filter((c) => c.completed).length;
        const progressPercent = Math.round((completedCount / criteria.length) * 100);
        const allCompleted = completedCount === criteria.length;
        return {
          ...a,
          criteria,
          progressPercent,
          status: allCompleted && a.status === 'near' ? 'ready' : a.status,
        };
      })
    );
  };

  // Rescue toggle individual contract
  const handleToggleContract = (id: string) => {
    setRescueContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  // Rescue toggle all
  const handleToggleAllContracts = () => {
    const allSelected = rescueContracts.every((c) => c.selected || c.rescued);
    setRescueContracts((prev) =>
      prev.map((c) => (c.rescued ? c : { ...c, selected: !allSelected }))
    );
    showToast(
      allSelected ? 'Selección limpiada' : 'Todos seleccionados',
      allSelected ? '0 protocolos marcados para extracción' : '5 protocolos marcados para extracción'
    );
  };

  // Trigger 1-Click Flashbots rescue flow
  const handleExecuteRescue = (selectedList: RecoverableContract[], total: number) => {
    setRescueModalData({
      isOpen: true,
      contracts: selectedList,
      totalAmount: total,
    });
  };

  // Complete Rescue
  const handleConfirmRescueCompleted = (rescuedIds: string[]) => {
    setRescueContracts((prev) =>
      prev.map((c) => (rescuedIds.includes(c.id) ? { ...c, rescued: true, selected: false } : c))
    );
    // Add rescued amount to ETH token balance
    const rescuedSum = rescueContracts
      .filter((c) => rescuedIds.includes(c.id))
      .reduce((acc, c) => acc + c.amountUsd, 0);

    setTokens((prev) =>
      prev.map((t) =>
        t.id === 'eth'
          ? {
              ...t,
              valueUsd: t.valueUsd + rescuedSum,
              balance: parseFloat((t.balance + rescuedSum / t.priceUsd).toFixed(2)),
            }
          : t
      )
    );

    // Record completed rescue in transaction history
    const randomHex = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const rescueTx: TransactionRecord = {
      id: `tx-rescue-${Date.now()}`,
      hash: `0x${randomHex}`,
      chain: 'eth',
      chainLabel: 'Ethereum',
      type: 'rescue',
      typeLabel: 'Rescate de Fondos',
      title: 'Rescate Flashbots MEV Bundle',
      description: `Extracción atómica de $${rescuedSum.toLocaleString()} en contratos huérfanos`,
      status: 'confirmed',
      confirmations: 64,
      requiredConfirmations: 64,
      timestamp: 'Ahora mismo',
      blockNumber: 20849360,
      fromAddress: '0x7F29b8A649c096EdfC7802Db349F899e072fa9B2',
      fromLabel: 'OmniVault Hot Wallet',
      toAddress: '0x881D40237659C251811CEC9c364ef91dC08D300C',
      toLabel: 'Flashbots Relay Builder',
      amountDisplay: `+$${rescuedSum.toFixed(2)} USD`,
      amountUsdDisplay: `+$${rescuedSum.toFixed(2)}`,
      isPositive: true,
      gasFeeEth: '0.0022 ETH',
      gasFeeUsd: '$7.35',
      gasUsed: '138,000 units',
      gasPriceGwei: 15.8,
      savedWithEcoGasUsd: '$14.20',
      contractMethod: 'rescueVulnerableVault(address,bytes)',
      mevProtected: true,
      explorerUrl: `https://etherscan.io/tx/0x${randomHex}`,
      explorerName: 'Etherscan',
    };
    setTransactions((prev) => [rescueTx, ...prev]);
  };

  // NFT Alert Toggle
  const handleToggleNftAlert = (id: string) => {
    setNfts((prev) =>
      prev.map((nft) =>
        nft.id === id ? { ...nft, alertActive: !nft.alertActive } : nft
      )
    );
  };

  // AI Security Revoke
  const handleRevokeApprovals = (actionId: string) => {
    setAiActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, completed: true } : a))
    );
  };

  // AI DeFi Aave deposit
  const handleDepositAave = (actionId: string) => {
    setAiActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, completed: true } : a))
    );
  };

  // Push Sentinel toggle
  const handleToggleSentinel = (id: string) => {
    setPushSentinels((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Add custom sentinel
  const handleAddNewSentinel = (sentinel: Omit<PushSentinel, 'id'>) => {
    const newId = `sentinel-${Date.now()}`;
    setPushSentinels((prev) => [{ ...sentinel, id: newId }, ...prev]);
  };

  // Delete sentinel
  const handleDeleteSentinel = (id: string) => {
    setPushSentinels((prev) => prev.filter((s) => s.id !== id));
    showToast("Centinela Eliminado", "Regla de monitoreo removida.");
  };

  // Simulate market price fluctuations for testing animations
  const handleSimulateMarketPulse = () => {
    setTokens((prev) =>
      prev.map((t) => {
        // Fluctuate price by -2.5% to +3.2%
        const deltaPct = parseFloat((Math.random() * 5.7 - 2.5).toFixed(2));
        const newPrice = Math.max(0.01, t.priceUsd * (1 + deltaPct / 100));
        const formattedPrice =
          newPrice >= 1000
            ? Math.round(newPrice * 100) / 100
            : parseFloat(newPrice.toFixed(2));
        const newChange = parseFloat((t.change24h + deltaPct * 0.35).toFixed(2));
        const newValue = parseFloat((t.balance * formattedPrice).toFixed(2));
        return {
          ...t,
          priceUsd: formattedPrice,
          valueUsd: newValue,
          change24h: newChange,
        };
      })
    );
    showToast(
      'Oráculo Pyth Sincronizado',
      'Precios y balances reajustados con variación de mempool en vivo.'
    );
  };

  // Update token balances on swap
  const handleSwapSuccess = (fromSymbol: string, fromAmount: number, toSymbol: string, toAmount: number) => {
    setTokens((prev) =>
      prev.map((t) => {
        if (t.symbol.toUpperCase() === fromSymbol.toUpperCase()) {
          const newBal = Math.max(0, parseFloat((t.balance - fromAmount).toFixed(4)));
          return {
            ...t,
            balance: newBal,
            valueUsd: parseFloat((newBal * t.priceUsd).toFixed(2)),
          };
        }
        if (t.symbol.toUpperCase() === toSymbol.toUpperCase()) {
          const newBal = parseFloat((t.balance + toAmount).toFixed(4));
          return {
            ...t,
            balance: newBal,
            valueUsd: parseFloat((newBal * t.priceUsd).toFixed(2)),
          };
        }
        return t;
      })
    );
  };

  // Update token balance on send
  const handleSendSuccess = (tokenSymbol: string, amount: number) => {
    setTokens((prev) =>
      prev.map((t) => {
        if (t.symbol.toUpperCase() === tokenSymbol.toUpperCase()) {
          const newBal = Math.max(0, parseFloat((t.balance - amount).toFixed(4)));
          return {
            ...t,
            balance: newBal,
            valueUsd: parseFloat((newBal * t.priceUsd).toFixed(2)),
          };
        }
        return t;
      })
    );
  };

  // Quick action modal opener
  const handleOpenActionModal = (type: 'send' | 'receive' | 'swap' | 'bridge', token?: TokenItem) => {
    setSelectedTokenForAction(token || tokens[0]);
    setActiveActionModal(type);
  };

  return (
    <div className="min-h-screen bg-[#0b0e15] text-[#e1e2ec] flex flex-col items-center justify-start antialiased selection:bg-[#4cd7f6] selection:text-[#003640]">
      {/* Centered Mobile Container framing matching the provided mockups */}
      <div className="w-full max-w-md min-h-screen bg-[#10131a] relative flex flex-col pt-16 pb-24 shadow-2xl border-x border-[#272a32]/40">
        {/* Header */}
        <Header
          currentChain={currentChain}
          onSelectChain={(chain) => setCurrentChain(chain)}
          gasSaverMode={gasSaverMode}
          onToggleGasSaverMode={handleToggleGasSaverMode}
          onShowToast={showToast}
          walletState={walletState}
          onConnectWallet={handleConnectWallet}
          onDisconnectWallet={handleDisconnectWallet}
          onOpenSettings={() => setActiveTab('settings')}
        />

        {/* Main View Area */}
        <main className="flex-1 w-full pt-2">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              tokens={tokens}
              currentChain={currentChain}
              onSelectChain={setCurrentChain}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenActionModal={handleOpenActionModal}
              gasSaverMode={gasSaverMode}
              onToggleGasSaverMode={handleToggleGasSaverMode}
              readyAirdropsCount={airdrops.filter((a) => a.status === 'ready').length}
              onShowToast={showToast}
              onSimulateMarketPulse={handleSimulateMarketPulse}
              transactions={transactions}
              onUpdateTransactions={setTransactions}
            />
          )}

          {activeTab === 'rescue' && (
            <RescueScreen
              contracts={rescueContracts}
              onToggleContract={handleToggleContract}
              onToggleAll={handleToggleAllContracts}
              onExecuteRescue={handleExecuteRescue}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'airdrops' && (
            <AirdropsScreen
              airdrops={airdrops}
              gasSaverMode={gasSaverMode}
              onClaimAirdrop={handleClaimAirdrop}
              onCompleteCriterion={handleCompleteCriterion}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'nfts' && (
            <NftsScreen
              nfts={nfts}
              onToggleAlert={handleToggleNftAlert}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'alertas-ia' && (
            <AiAlertsScreen
              aiActions={aiActions}
              pushSentinels={pushSentinels}
              tokens={tokens}
              onToggleSentinel={handleToggleSentinel}
              onRevokeApprovals={handleRevokeApprovals}
              onDepositAave={handleDepositAave}
              onShowPendingGasOps={() => setShowPendingGasModal(true)}
              onAddNewSentinel={handleAddNewSentinel}
              onDeleteSentinel={handleDeleteSentinel}
              onTriggerSwap={(tokenSymbol) => {
                const targetToken = tokens.find(
                  (t) => t.symbol.toUpperCase() === (tokenSymbol || '').toUpperCase()
                ) || tokens[0];
                handleOpenActionModal('swap', targetToken);
              }}
              onShowToast={showToast}
              onOpenSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              onNavigateTab={(tab) => setActiveTab(tab)}
              onShowToast={showToast}
              gasSaverMode={gasSaverMode}
              onToggleGasSaverMode={handleToggleGasSaverMode}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          unclaimedCount={rescueContracts.filter((c) => !c.rescued).length}
          readyAirdropsCount={airdrops.filter((a) => a.status === 'ready').length}
        />

        {/* Action, Rescue, and Feedback Modals */}
        <ActionModals
          toast={toast}
          onCloseToast={() => setToast(null)}
          activeActionModal={activeActionModal}
          selectedToken={selectedTokenForAction}
          tokens={tokens}
          onCloseActionModal={() => setActiveActionModal(null)}
          onShowToast={showToast}
          gasSaverMode={gasSaverMode}
          onToggleGasSaverMode={handleToggleGasSaverMode}
          rescueModalData={rescueModalData}
          onCloseRescueModal={() => setRescueModalData(null)}
          onConfirmRescueCompleted={handleConfirmRescueCompleted}
          showPendingGasModal={showPendingGasModal}
          onClosePendingGasModal={() => setShowPendingGasModal(false)}
          onExecuteSwapSuccess={handleSwapSuccess}
          onExecuteSendSuccess={handleSendSuccess}
        />
      </div>
    </div>
  );
}

