"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await browserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={send} className="card w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-muted mb-4">Magic link — single-user access only.</p>
        <label className="label">Email</label>
        <input
          type="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn btn-primary mt-4 w-full justify-center" type="submit">
          Send magic link
        </button>
        {sent && <p className="text-good text-sm mt-3">Check your email.</p>}
        {error && <p className="text-bad text-sm mt-3">{error}</p>}
      </form>
    </div>
  );
}
