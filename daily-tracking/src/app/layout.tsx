import type { Metadata } from "next";
import "./globals.css";
import PasswordGate from "@/components/PasswordGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import PWAProvider from "@/components/PWAProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import { OfflineDataProvider } from "@/contexts/OfflineDataContext";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";
import { PWAUpdateManager } from "@/components/PWAUpdateManager";

export const metadata: Metadata = {
  title: "Daily Tracker",
  description: "Track your habits and tasks daily",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daily Tracker",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Daily Tracker",
    "application-name": "Daily Tracker",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-tap-highlight": "no",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#3b82f6",
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
          <PWAProvider>
            <ThemeProvider>
              <OfflineDataProvider>
                <OfflineIndicator />
                <SyncStatusIndicator />
                <PasswordGate>
                  {children}
                </PasswordGate>
                <PWAInstallPrompt />
                <PWAUpdateManager />
              </OfflineDataProvider>
            </ThemeProvider>
          </PWAProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
