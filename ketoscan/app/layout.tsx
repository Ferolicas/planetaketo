import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  applicationName: "Planeta Keto Scan",
  title: {
    default: "Planeta Keto Scan",
    template: "%s · Planeta Keto Scan",
  },
  description:
    "Escanea alimentos con IA, controla tus macros keto y arma tus menus diarios y semanales.",
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Keto Scan",
  },
  icons: {
    icon: `${BASE_PATH}/icons/icon-192.png`,
    apple: `${BASE_PATH}/icons/icon-192.png`,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker
                    .register('${BASE_PATH}/sw.js', { scope: '${BASE_PATH}/' })
                    .catch(function (e) { console.warn('SW registro fallo', e); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
