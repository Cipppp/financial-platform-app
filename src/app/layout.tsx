import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from '@/components/providers/SessionProvider';
import { SettingsProvider } from '@/contexts/SettingsContext';

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Financial Trading Platform",
  description: "Demo trading platform with real stock data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${firaCode.variable} font-mono antialiased`}
      >
        <NextAuthSessionProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
