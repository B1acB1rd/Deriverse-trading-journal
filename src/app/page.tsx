'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { ClientWalletMultiButton } from '@/components/common/ClientWalletMultiButton';
import { WaveBackground } from '@/components/landing/WaveBackground';

export default function LandingPage() {
    const { connected } = useWallet();
    const router = useRouter();

    useEffect(() => {
        if (connected) {
            router.push('/dashboard');
        }
    }, [connected, router]);

    return (
        <div className="relative min-h-screen w-full bg-[#050505] text-white overflow-hidden flex flex-col font-sans">

            <div className="absolute top-0 right-0 w-full h-full md:w-[65%] overflow-hidden opacity-90 pointer-events-none z-0">
                <WaveBackground />
            </div>

            {/* Content Container */}
            <main className="relative z-10 flex-1 flex flex-col px-8 md:px-16 pt-16 md:pt-24">

                {/* Logo Section */}
                <div className="flex items-center gap-4 mb-32 md:mb-40">
                    <div className="relative w-10 h-10 md:w-12 md:h-12">
                        <Image
                            src="/logo.ico"
                            alt="Deriverse Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="text-xl md:text-2xl font-light tracking-wide text-gray-200">
                        deriverse
                    </span>
                </div>

                {/* Hero Text */}
                <div className="max-w-5xl">
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tight leading-[0.95]">
                        <span className="block text-white mb-2 md:mb-4">Trade Anything.</span>
                        <span className="block text-gray-500">Trust Nothing.</span>
                    </h1>
                </div>

                {/* Connect Wallet Button */}
                <div className="mt-20 md:mt-32">
                    <div className="inline-block">
                        <div className="custom-wallet-btn-wrapper">
                            <ClientWalletMultiButton style={{
                                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', // Indigo to Violet Gradient
                                color: '#ffffff',
                                borderRadius: '9999px',
                                padding: '16px 40px',
                                fontSize: '18px',
                                fontWeight: '600',
                                height: 'auto',
                                fontFamily: 'inherit',
                                border: 'none',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)'
                            }} />
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
