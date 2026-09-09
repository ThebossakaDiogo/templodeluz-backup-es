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
      { rel: "preconnect", href: "https://opftmzegcvfyoinjfmcj.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://opftmzegcvfyoinjfmcj.supabase.co" },
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
import { getMetaBrowserAttribution } from "@/lib/metaPixel";
import { useEffect } from "react";

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
    const params = new URLSearchParams(window.location.search);
    const source = (params.get("utm_source") || "").toLowerCase();
    if (params.has("ttclid") || /^(tiktok|tt|tik)(?:$|[^a-z])/.test(source)) return;
    captureAndStoreUtms();
    // O Pixel já é inicializado no head; aqui apenas preservamos fbclid/_fbc para o checkout.
    getMetaBrowserAttribution();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <LiveActivityToast />
    </QueryClientProvider>
  );
}
