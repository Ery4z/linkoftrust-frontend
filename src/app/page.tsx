// src/app/page.tsx
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { CreateProfileButton } from '@/components/CreateProfileButton';
import { Button } from '@mantine/core';
import { Metadata } from 'next';
import React from 'react';

// This indicates to Next.js that we want a static page:
export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Link Of Trust - Landing',
    description: 'A decentralized trust network on NEAR.',
};

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-black-900 flex items-center justify-center px-4">
            <div className="bg-neutral-800 shadow-lg rounded-lg p-8 w-full max-w-screen-xl text-center">
                <h1 className="text-5xl font-extrabold mb-6 text-white">Link Of Trust</h1>
                <p className="text-xl mb-8 text-gray-300">
                    Build, share, and explore trust relationships on NEAR. Join our decentralized network and be a part of the future.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <ConnectWalletButton />
                    <Button
                        component="a"
                        href="/explore"
                        size="lg"
                        variant="filled"
                    // gradient={{ from: 'blue', to: 'orange', deg: 45 }}
                    >
                        Explore the Network
                    </Button>
                    {/* Optionally include CreateProfileButton */}
                    {/* <CreateProfileButton /> */}
                </div>
            </div>
        </main>
    );
}
