// src/context/WalletContext.tsx
"use client";
import React, { useState, useEffect, useContext } from 'react';
import { setupWalletSelector, Wallet } from '@near-wallet-selector/core';
import { setupModal, WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import "@near-wallet-selector/modal-ui/styles.css";
import { CustomStorageService } from '@/lib/CustomStorageService';

const NEXT_PUBLIC_NEAR_NETWORK = process.env.NEXT_PUBLIC_NEAR_NETWORK == 'testnet' ? 'testnet' : 'mainnet';
console.log('NEXT_PUBLIC_NEAR_NETWORK', process.env.NEXT_PUBLIC_NEAR_NETWORK);

export interface WalletContextType {
    selector: any;
    modal: any;
    wallet: Wallet | null;
    accountId: string;
    network: 'testnet' | 'mainnet';
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    userBalance: number;
}

export const WalletContext = React.createContext<WalletContextType>({
    selector: null,
    modal: null,
    wallet: null,
    accountId: '',
    network: NEXT_PUBLIC_NEAR_NETWORK,
    signIn: async () => { },
    signOut: async () => { },
    userBalance: 0,
});

export function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
    const [selector, setSelector] = useState<any>(null);
    const [modal, setModal] = useState<WalletSelectorModal | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [accountId, setAccountId] = useState('');
    const [userBalance, setUserBalance] = useState<number>(0);

    useEffect(() => {
        setModal(null);
        setSelector(null);
        async function init() {

            // Clear or use a custom storage to avoid caching issues.
            console.log('recreating wallet provide with network', NEXT_PUBLIC_NEAR_NETWORK);
            const customStorage = new CustomStorageService(`wallet_selector_${NEXT_PUBLIC_NEAR_NETWORK}`);
            const _selector = await setupWalletSelector({
                network: NEXT_PUBLIC_NEAR_NETWORK,
                modules: [setupMeteorWallet() as any],
                storage: customStorage,
                allowMultipleSelectors: true,
            });
            const _modal = setupModal(_selector, {
                contractId: NEXT_PUBLIC_NEAR_NETWORK === 'testnet' ? 'linkoftrust.testnet' : 'linkoftrust.near',
            });
            setSelector(_selector);
            setModal(_modal);

            const state = _selector.store.getState();
            if (state.selectedWalletId) {
                const _wallet = await _selector.wallet(state.selectedWalletId);
                setWallet(_wallet);
                const accounts = await _wallet.getAccounts();
                setAccountId(accounts[0].accountId);
            }

        }
        init();
    }, []);

    const signIn = async () => {
        if (!modal) {
            console.error('Wallet selector modal is not initialized yet.');
            return;
        }

        // Open the modal (non-awaitable)
        modal.show();

        // Poll for wallet selection every 1 second
        const interval = setInterval(async () => {
            const state = selector?.store.getState();
            if (state?.selectedWalletId) {
                const _wallet = await selector.wallet(state.selectedWalletId);
                setWallet(_wallet);
                const accounts = await _wallet.getAccounts();
                setAccountId(accounts.length > 0 ? accounts[0].accountId : '');

                clearInterval(interval); // Stop polling when wallet is connected
            }
        }, 1000); // Check every 1 second
    };



    const signOut = async () => {
        if (wallet) {
            await wallet.signOut();
            setWallet(null);
            setAccountId('');
        }
    };

    return (
        <WalletContext.Provider
            value={{
                selector,
                modal,
                wallet,
                accountId,
                network: NEXT_PUBLIC_NEAR_NETWORK,
                signIn,
                signOut,
                userBalance,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export const useWallet = () => useContext(WalletContext);
