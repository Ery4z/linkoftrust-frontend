// src/components/ConnectWalletButton.tsx
"use client";
import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { Button } from '@mantine/core';

export function ConnectWalletButton() {
    const { signIn } = useWallet();

    return (
        <Button
            onClick={signIn}
            variant="filled"
            //   gradient={{ from: 'gray', to: 'indigo', deg: -90 }}
            size="lg"
        >
            Connect or Create your NEAR Wallet
        </Button>
    );
}
