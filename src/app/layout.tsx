import "./globals.css";
import type { Metadata, Viewport } from "next";
import BottomTabs from "@/components/BottomTabs";
import SideNav from "@/components/SideNav";
import StatusBar from "@/components/StatusBar";

export const metadata: Metadata = {
  title: "Ember — stay close, every day",
  description:
    "A live widget for couples. Daily prompts, photo challenges, thumb kisses, and a flame you grow together.",
  applicationName: "Ember",
  appleWebApp: {
    capable: true,
    title: "Ember",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#08070c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh]">
        <SideNav />
        <div className="app-shell">
          <StatusBar />
          <main className="px-4 md:px-0 pt-2">{children}</main>
          <BottomTabs />
        </div>
      </body>
    </html>
  );
}
