import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PasswordGate from "@/components/PasswordGate";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
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
        <ThemeProvider>
          <PasswordGate>
            {children}
          </PasswordGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
