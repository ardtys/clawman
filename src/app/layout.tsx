import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";

export const metadata: Metadata = {
  title: "CLAW-MAN | Retro Arcade Crab Harvester",
  description:
    "A retro arcade dashboard where Claw-Man hunts crabs in a dynamic maze powered by Moltbook activity.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] min-h-screen">
        <WalletProvider>
          <div className="crt-overlay" />
          <div className="crt-flicker">{children}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
