import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TradeProvider } from "@/hooks/useTradeData";
import { AppLayout } from "@/components/layout/AppLayout";
import { WalletContextProvider } from "@/components/providers/WalletContextProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deriverse Trading Journal",
  description: "Advanced Trading Analytics for Deriverse Protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>
          <TradeProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </TradeProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
