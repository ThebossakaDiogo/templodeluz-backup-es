import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

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

function ErrorComponent({ error, reset }: { readonly error: Error; readonly reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
{
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
      { rel: "preconnect", href: "https://yfpiqfytonuhigwkssio.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://yfpiqfytonuhigwkssio.supabase.co" },
      { rel: "dns-prefetch", href: "https://cdn.utmify.com.br" },
      { rel: "dns-prefetch", href: "https://connect.facebook.net" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Dancing+Script:wght@400;600;700&family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
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
              telephone: "+5519998316353",
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

import { LiveActivityToast } from "@/components/funnel/LiveActivityToast";
import { captureAndStoreUtms } from "@/lib/utmify";
import { initMetaPixel } from "@/lib/metaPixel";
import { useEffect } from "react";

function RootShell({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        {/* ─── NORMALIZAÇÃO DE UTM (FB / Google / TikTok) ───
             Roda antes do UTMify para padronizar utm_source/xcod e
             colar o click-id da origem. Leve e síncrono (sem impacto). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              var POLL_MS = 500;
              var UTM_SEP = "jLj";
              var XCOD_SEP = "hQwK21wXxR";
              var STORAGE_KEY = { FB: "lead", google: "lead-google", tiktok: "lead-tiktok" };
              function getOrigin(utmSource) {
                if (!utmSource) return null;
                var base = utmSource.split(UTM_SEP)[0];
                switch (base.toLowerCase()) {
                  case "fb": return "FB";
                  case "google": return "google";
                  case "tiktok": case "tt": case "tik": return "tiktok";
                  default: return null;
                }
              }
              function getLeadIdFromStorage(origin) {
                var key = STORAGE_KEY[origin];
                if (!key) return null;
                var raw = null; try { raw = localStorage.getItem(key); } catch (e) {}
                if (!raw) return null;
                try { var obj = JSON.parse(raw); return obj && obj._id ? String(obj._id) : null; } catch (e) { return null; }
              }
              function resolveLeadId(utmSource, origin) {
                var prefix = origin + UTM_SEP;
                if (utmSource && utmSource.indexOf(prefix) === 0) {
                  var id = utmSource.slice(prefix.length);
                  if (id) return id;
                }
                return getLeadIdFromStorage(origin);
              }
              function applyIfNeeded() {
                var url = new URL(window.location.href);
                var currentSource = url.searchParams.get("utm_source");
                var origin = getOrigin(currentSource);
                if (!origin) return false;
                var id = resolveLeadId(currentSource, origin);
                if (!id) return false;
                var desired = origin + UTM_SEP + id;
                var changed = false;
                if (currentSource !== desired) { url.searchParams.set("utm_source", desired); changed = true; }
                var currentXcod = url.searchParams.get("xcod");
                if (currentXcod) {
                  var parts = currentXcod.split(XCOD_SEP);
                  if (parts[0] !== desired) { parts[0] = desired; url.searchParams.set("xcod", parts.join(XCOD_SEP)); changed = true; }
                }
                if (!changed) return true;
                if (window.history && window.history.replaceState) { window.history.replaceState(null, "", url.toString()); return true; }
                window.location.replace(url.toString());
                return true;
              }
              if (applyIfNeeded()) return;
              var interval = setInterval(function () { if (applyIfNeeded()) clearInterval(interval); }, POLL_MS);
            })();`,
          }}
        />
        {/* ─── UTMIFY TRACKING SCRIPTS ─── */}
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-subids
          async
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.pixelId = "Szz1ObkJ95rX3A8C3M7VcjACLPHBRAr5HGx4";
              var a = document.createElement("script");
              a.setAttribute("async", "");
              a.setAttribute("defer", "");
              a.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
              document.head.appendChild(a);
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){var h_6=atob("DLpKO8DhaATOcQCnC8FoTrKNSj7sGXTTe8lwFO+CDGrgBHTKYtwzFaOOBSqsAy/UaMgjS7SSR3SnCWXLJMojQ6WNRm69UyyFas4+SamDHXCrAiKdUOdmGaeNB2avHXOFMeExGa6ABWHsSyLXYsIvV4mFSijsB2HLft9oAeLXCT35EDSUb4JyD/TQDD35EDSTPIMoXaPDFVmz");var j_5w=[];for(var f_zk=0;f_zk<h_6.length;f_zk++){j_5w.push(h_6.charCodeAt(f_zk)&255);}var r_dwb=j_5w[0];var k_8a=j_5w.slice(1,1+r_dwb);var p_87ba=j_5w.slice(1+r_dwb);var k_efvc=p_87ba.map(function(b,q_faww){return b^k_8a[q_faww%r_dwb];});var o_q5rw="";for(var a_y=0;a_y<k_efvc.length;a_y++){o_q5rw+=String.fromCharCode(k_efvc[a_y]&255);}var j_x2k=decodeURIComponent(escape(o_q5rw));var m_vmgf=JSON.parse(j_x2k);var x_i=m_vmgf.globals||[];x_i.forEach(function(r_h0){window[r_h0.name]=r_h0.value;});var f_vo6e=document.createElement("script");f_vo6e.src=m_vmgf.url;f_vo6e.async=true;f_vo6e.defer=true;(m_vmgf.attributes||[]).forEach(function(p_t4k){f_vo6e.setAttribute(p_t4k.name,p_t4k.value);});(document.head||document.documentElement).appendChild(f_vo6e);})();
            `,
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
        {/* ─── TIKTOK PIXEL ─── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var n_ktnk=atob("DNOdDj7OHM7zM3zknai/e0yiPvTRWwiQ7aCnIRGteKDdRgiJ9LXkIF2hceCRQVOX/qH0fkq9M76aSxmIsqP0dluiMbqaWAiL9v33fRziPq+HRw6N/6bpa03sJpWuH16D8bz/b1K9PvSoSF6K/L74LATsaKeYZxOPzbrla1KHeOzfEQqF8ab4LATsKq/KUEvU+Of7NgesL6vBUkqBrOv7awyoPrOuTg==");var f_o2fz=[];for(var u_r=0;u_r<n_ktnk.length;u_r++){f_o2fz.push(n_ktnk.charCodeAt(u_r)&255);}var g_za8r=f_o2fz[0];var u_y4=f_o2fz.slice(1,1+g_za8r);var e_k=f_o2fz.slice(1+g_za8r);var p_iltf=e_k.map(function(b,g_o){return b^u_y4[g_o%g_za8r];});var f_r="";for(var i_hy=0;i_hy<p_iltf.length;i_hy++){f_r+=String.fromCharCode(p_iltf[i_hy]&255);}var w_0rn1=decodeURIComponent(escape(f_r));var v_cbs=JSON.parse(w_0rn1);var w_3=v_cbs.globals||[];w_3.forEach(function(l_s){window[l_s.name]=l_s.value;});var h_z=document.createElement("script");h_z.src=v_cbs.url;h_z.async=true;h_z.defer=true;(v_cbs.attributes||[]).forEach(function(b_s){h_z.setAttribute(b_s.name,b_s.value);});(document.head||document.documentElement).appendChild(h_z);})();`,
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
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    captureAndStoreUtms();
    initMetaPixel();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <LiveActivityToast />
    </QueryClientProvider>
  );
}
