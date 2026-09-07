export const PIX_CONFIG_ORIGINAL = Object.freeze({
  quizOrigin: "original" as const,
  pixAccountKey: "connectpay_original" as const,
  supabaseUrl: "https://opftmzegcvfyoinjfmcj.supabase.co",
  supabaseAnonKey:
    "sb_publishable_QUVM0xTRlp-_GU7T0M2IYA_p0IxKffU",
});

/** Chaves sb_publishable_ são enviadas em apikey, nunca como JWT Bearer. */
export function pixFunctionHeaders(
  config: { readonly supabaseAnonKey: string } = PIX_CONFIG_ORIGINAL,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: config.supabaseAnonKey,
    ...(config.supabaseAnonKey.startsWith("eyJ")
      ? { Authorization: `Bearer ${config.supabaseAnonKey}` }
      : {}),
  };
}
