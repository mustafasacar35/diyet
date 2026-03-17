
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardLayout from "./dashboard-layout"; // Wrapper component we will separate
import { AuthProvider } from "@/contexts/auth-context";
import { AppModalProvider } from "@/contexts/app-modal-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Diyet Plan Paneli",
  description: "Profesyonel Diyet Planlama Aracı",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Diyet Portal",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <AuthProvider>
          <AppModalProvider>
            <DashboardLayout>
              {children}
            </DashboardLayout>
          </AppModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
