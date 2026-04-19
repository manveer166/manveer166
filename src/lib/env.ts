function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: () => must("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnon: () => must("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseService: () => must("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicKey: () => must("ANTHROPIC_API_KEY"),
  allowedEmail: () => must("ALLOWED_EMAIL"),
};
