import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PasswordGate from "@/components/PasswordGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: false, // Disable preload to prevent unused preload warnings
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: "Daily Tracker",
  description: "Track your habits and tasks daily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider>
            <PasswordGate>
              {children}
            </PasswordGate>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
