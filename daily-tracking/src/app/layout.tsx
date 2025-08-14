import type { Metadata } from "next";
import "./globals.css";
import PasswordGate from "@/components/PasswordGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

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
      <body className="font-sans">
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
