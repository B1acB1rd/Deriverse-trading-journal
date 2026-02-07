'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ClientWalletMultiButton } from '../common/ClientWalletMultiButton';

interface AppLayoutProps {
    children: React.ReactNode;
}

import { usePathname } from 'next/navigation';

export function AppLayout({ children }: AppLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const isLanding = pathname === '/';

    if (isLanding) {
        return <main className="min-h-screen bg-black text-white">{children}</main>;
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Wrapper - Shift padding on Desktop */}
            <div className="md:pl-[260px] min-h-screen flex flex-col transition-all duration-300">
                <header className="h-16 md:h-20 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between backdrop-blur-md bg-background/50 border-b border-white/5">

                    {/* Hamberger & Title Logic */}
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-text-muted hover:text-white"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg md:text-2xl font-bold text-[var(--color-text-primary)] truncate">
                            Dashboard
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative group rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                            <ClientWalletMultiButton style={{
                                background: 'transparent',
                                color: 'var(--color-text-primary)',
                                height: '36px', // Smaller mobile height
                                padding: '0 12px',
                                fontSize: '12px',
                                fontWeight: 600
                            }} />
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 max-w-[1920px] mx-auto w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
