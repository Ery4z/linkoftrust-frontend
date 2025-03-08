// src/components/HeaderMenu.tsx
"use client";

import React from "react";
import { Button, Container, Title, Text } from "@mantine/core";
import { useWallet } from "@/context/WalletContext";
import Link from "next/link";

export function HeaderMenu() {
    // Extract the network and authentication functions from your wallet context.
    const { accountId, network, signIn, signOut } = useWallet();

    // Compute the redirect URL based on the current network.
    const redirectUrl =
        network === "mainnet"
            ? process.env.NEXT_PUBLIC_TESTNET_SITE_URL || "https://testnet.linkoftrust.org"
            : process.env.NEXT_PUBLIC_MAINET_SITE_URL || "https://mainnet.linkoftrust.org";

    return (
        <header>
            {/* Top Header: Title and authentication */}
            <div className="bg-neutral-900 text-gray-100 py-4 shadow">
                <Container fluid>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Link href="/" className="no-underline text-gray-100 hover:text-white">
                                <Title order={3}>Link Of Trust</Title>
                            </Link>
                        </div>


                        <div className="flex items-center space-x-3">
                            {accountId ? (
                                <>
                                    <Text color="yellow">Hi, {accountId}</Text>
                                    <Button onClick={signOut} size="xs" variant="light">
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={signIn} size="xs" variant="light">
                                    Sign In
                                </Button>
                            )}
                        </div>
                    </div>
                </Container>
            </div>

            {/* Sub Bar: Network status and redirect button */}
            <div
                className={`${network === "mainnet" ? "bg-neutral-800" : "bg-orange-500"
                    } text-white py-2  lg:w-1/3 rounded-br-xl`}
            >
                <Container fluid>
                    <div className="flex justify-between items-center h-full ">
                        {/* Display the current network */}
                        <span className="font-medium">
                            {network === "mainnet" ? "Mainnet" : "Testnet"}
                        </span>
                        {/* Button that redirects to the opposite network subdomain */}
                        <Button
                            component="a"
                            href={redirectUrl}
                            size="xs"
                            variant="light"
                        >
                            Switch to {network === "mainnet" ? "Testnet" : "Mainnet"}
                        </Button>
                    </div>
                </Container>
            </div>
        </header>
    );
}
