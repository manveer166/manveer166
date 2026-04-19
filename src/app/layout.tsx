import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { serverClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Health Dashboard",
  description: "Personal health dashboard",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sb = await serverClient();
  const { data } = await sb.auth.getUser();
  const email = data.user?.email ?? null;

  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          {email && <Nav email={email} />}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
