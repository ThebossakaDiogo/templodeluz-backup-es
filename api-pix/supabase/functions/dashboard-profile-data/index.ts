// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_ORIGINS = new Set([
  "https://odmetrics.vercel.app",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3011",
  "http://127.0.0.1:3011",
]);

function serviceRoleKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? null;
  } catch {
    return null;
  }
}

function allowedOrigins() {
  const configured = (Deno.env.get("DASHBOARD_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...configured]);
}

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": allowedOrigins().has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-meta-authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function json(origin: string, body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors(origin) });
}

function allowedAdminEmails() {
  return new Set(
    (Deno.env.get("DASHBOARD_ALLOWED_ADMIN_EMAILS") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  if (request.method === "OPTIONS") {
    return allowedOrigins().has(origin)
      ? new Response(null, { status: 204, headers: cors(origin) })
      : new Response("Forbidden", { status: 403 });
  }
  if (request.method !== "POST") return json(origin, { error: "Método não permitido." }, 405);
  if (!allowedOrigins().has(origin)) return json(origin, { error: "Origem não autorizada." }, 403);

  const metaUrl = Deno.env.get("DASHBOARD_META_SUPABASE_URL");
  const metaAnonKey = Deno.env.get("DASHBOARD_META_SUPABASE_ANON_KEY");
  const metaAuthorization = request.headers.get("x-meta-authorization") ?? "";
  if (!metaUrl || !metaAnonKey || !metaAuthorization.startsWith("Bearer ")) {
    return json(origin, { error: "Sessão administrativa ausente." }, 401);
  }

  try {
    const authResponse = await fetch(`${metaUrl.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { Authorization: metaAuthorization, apikey: metaAnonKey },
    });
    const user = await authResponse.json().catch(() => null);
    const email = String(user?.email ?? "").toLowerCase();
    if (!authResponse.ok || !allowedAdminEmails().has(email)) {
      return json(origin, { error: "Administrador não autorizado." }, 403);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKey = serviceRoleKey();
    if (!supabaseUrl || !secretKey) return json(origin, { error: "Backend não configurado." }, 500);

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [orders, leads, whatsapp] = await Promise.all([
      supabase
        .from("pix_orders")
        .select("*")
        .or("and(quiz_origin.eq.mirrored,pix_account_key.eq.connectpay_mirrored),and(status.eq.paid,quiz_origin.is.null,pix_account_key.is.null)")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("quiz_funnel_leads").select("*").order("created_at", { ascending: false }).limit(2000),
      supabase.from("whatsapp_conversations").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    const queryError = orders.error ?? leads.error ?? whatsapp.error;
    if (queryError) {
      console.error("dashboard-profile-data", queryError.message);
      return json(origin, { error: "Não foi possível carregar o Perfil TikTok." }, 500);
    }

    return json(origin, {
      data: {
        orders: orders.data ?? [],
        leads: leads.data ?? [],
        whatsapp: whatsapp.data ?? [],
      },
    });
  } catch (error) {
    console.error("dashboard-profile-data", error instanceof Error ? error.message : "unknown");
    return json(origin, { error: "Falha ao consultar o Perfil TikTok." }, 500);
  }
});
