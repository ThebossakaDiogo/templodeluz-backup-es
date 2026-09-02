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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Templo de Luz — Cartas Psicografadas" },
      {
        name: "description",
        content:
          "Cartas psicografadas escritas à mão pela médium Milena Medeiros, com a letra e a assinatura do seu ente querido.",
      },
      { name: "author", content: "Templo de Luz" },
      { name: "theme-color", content: "#2E1A54" },
      { property: "og:title", content: "Templo de Luz — Cartas Psicografadas" },
      {
        property: "og:description",
        content:
          "Cartas psicografadas escritas à mão, com a letra e a assinatura do seu ente querido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Dancing+Script:wght@400;600;700&family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { LiveActivityToast } from "@/components/funnel/LiveActivityToast";
import { captureAndStoreUtms } from "@/lib/utmify";
import { useEffect } from "react";

function RootShell({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
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
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <LiveActivityToast />
    </QueryClientProvider>
  );
}
