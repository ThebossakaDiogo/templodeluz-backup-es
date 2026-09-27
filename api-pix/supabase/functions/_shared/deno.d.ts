declare const Deno: {
  readonly env: {
    get(name: string): string | undefined;
  };
};

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(
    url: string,
    key: string,
    options?: Record<string, unknown>,
  ): any;
}
