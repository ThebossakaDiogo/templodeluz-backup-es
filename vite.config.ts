import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function cleanDisguisedRoutesPlugin(): Plugin {
  return {
    name: "clean-disguised-routes-plugin",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next();
        const [pathname, search] = req.url.split("?");
        const query = search ? `?${search}` : "";

        if (/^\/consulta-sagrada-revelacao-amorosa.*|^\/resultado(\.html)?$/.test(pathname)) {
          req.url = `/resultado.html${query}`;
        } else if (/^\/portal-sagrado-mapa-amoroso.*|^\/escrever-carta(\.html)?$/.test(pathname)) {
          req.url = `/escrever-carta.html${query}`;
        } else if (/^\/sessao-individual-tarologa-milena.*|^\/chamada-ao-vivo-milena(\.html)?$/.test(pathname)) {
          req.url = `/chamada-ao-vivo-milena.html${query}`;
        } else if (/^\/confirmacao-atendimento-bencao.*|^\/obrigado(\.html)?$/.test(pathname)) {
          req.url = `/obrigado.html${query}`;
        } else if (/^\/politica-de-privacidade.*|^\/privacidade(\.html)?$/.test(pathname)) {
          req.url = `/privacidade.html${query}`;
        } else if (/^\/termos-de-uso.*|^\/termos(\.html)?$/.test(pathname)) {
          req.url = `/termos.html${query}`;
        } else if (/^\/canal-oficial-contato.*|^\/contato(\.html)?$/.test(pathname)) {
          req.url = `/contato/index.html${query}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [cleanDisguisedRoutesPlugin(), react()],
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
