// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import './globals.css';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/notifications/styles.css';
import { HeaderMenu } from './HeaderMenu';
import { Notifications } from "@mantine/notifications";
import { WalletProviderWrapper } from "@/context/WalletContext";
import { CoinPriceProvider } from '@/context/CoinPriceContext';
import { GasPriceProvider } from '@/context/GasPriceContext';
import { UserRepositoryProvider } from "@/context/UserRepositoryContext";


import { useEffect } from "react";
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: 'Link Of Trust',
    description: 'A decentralized trust network on NEAR.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <MantineProvider forceColorScheme="dark">
                    <WalletProviderWrapper>
                        <GasPriceProvider>
                            <CoinPriceProvider>
                                <UserRepositoryProvider>
                                    <HeaderMenu />
                                    {children}
                                    <Notifications />
                                </UserRepositoryProvider>
                            </CoinPriceProvider>
                        </GasPriceProvider>
                    </WalletProviderWrapper>
                </MantineProvider>
            </body>
        </html >
    );
}
