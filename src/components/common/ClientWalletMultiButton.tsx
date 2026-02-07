'use client';

import { useIsMounted } from '@/hooks/useIsMounted';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

// Dynamically import the button to avoid SSR issues entirely if possible, 
// though the mounted check is usually sufficient.
const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export function ClientWalletMultiButton({ style }: { style?: React.CSSProperties }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return a placeholder with the same dimensions to avoid layout shift
        return (
            <div
                style={{ ...style, width: '150px' }}
                className="opacity-0 cursor-default pointer-events-none"
            />
        );
    }

    return <WalletMultiButtonDynamic style={style} />;
}
