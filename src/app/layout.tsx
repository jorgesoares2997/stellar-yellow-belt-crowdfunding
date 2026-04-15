import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Multi-wallet donation dApp with Soroban contract calls and real-time event sync on Stellar."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
