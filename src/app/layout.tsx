import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Health Dashboard",
  description: "Personal health dashboard (local)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
