'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, BarChart3, PieChart, Settings, BookOpen, Target, X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeData } from '@/hooks/useTradeData';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'Journal', href: '/journal' },
    { icon: Target, label: 'Strategies', href: '/strategies' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: HelpCircle, label: 'Guide', href: '/guide' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { walletAddress } = useTradeData();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed left-0 top-0 w-[260px] h-screen flex flex-col p-6 z-50 border-r border-[var(--glass-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo & Close Button */}
                <div className="flex items-center justify-between mb-10 pl-2">
                    <div className="flex items-center gap-3">
                        <img src="/logo.ico" alt="Deriverse Logo" className="w-8 h-8 rounded-lg shadow-[0_0_15px_var(--color-primary-glow)]" />
                        <h1 className="text-xl font-bold text-[var(--color-text-primary)] leading-none">
                            Deriverse <span className="block text-xs font-normal text-[var(--color-text-secondary)] uppercase tracking-wider mt-0.5">Trading Journal</span>
                        </h1>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-1 text-text-muted hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2 flex-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onClose()} // Close on navigation (mobile)
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                                    isActive
                                        ? "bg-primary/10 text-[var(--color-text-primary)]"
                                        : "text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)]"
                                )}
                            >
                                <item.icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]")} />
                                <span>{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-l-sm shadow-[0_0_8px_var(--color-primary-glow)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--glass-border)] bg-black/20 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        {walletAddress ? walletAddress.slice(0, 2).toUpperCase() : 'NA'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-bold text-[var(--color-text-primary)] truncate max-w-[120px]" title={walletAddress || 'Not Connected'}>
                            {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Not Connected'}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">
                            {walletAddress ? 'Deriverse User' : 'Connect Wallet'}
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
