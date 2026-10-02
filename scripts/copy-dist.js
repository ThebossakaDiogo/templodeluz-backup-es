import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Lista de arquivos HTML e estáticos raiz para copiar para dist
const filesToCopy = [
  'resultado.html',
  'chamada-ao-vivo-milena.html',
  'escrever-carta.html',
  'obrigado.html',
  'privacidade.html',
  'termos.html',
  'favicon.png',
  '.htaccess',
  'contato/index.html',
  'analytics/tracker.js',
];

// Pastas completas para copiar para dist
const foldersToCopy = [
  'assets',
  'js',
  'css',
  'images',
];

for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`[copy-dist] Copiado arquivo: ${file}`);
  }
}

for (const folder of foldersToCopy) {
  const src = path.join(rootDir, folder);
  const dest = path.join(distDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`[copy-dist] Copiada pasta: ${folder}`);
  }
}

// Cria arquivos físicos para cada rota amigável para garantir que funcionem em qualquer CDN/host
const routeAliases = [
  { source: 'resultado.html', alias: 'consulta-sagrada-revelacao-amorosa-v9b2' },
  { source: 'resultado.html', alias: 'consulta-sagrada-revelacao-amorosa' },
  { source: 'resultado.html', alias: 'consulta-sagrada' },
  { source: 'resultado.html', alias: 'resultado' },
  { source: 'escrever-carta.html', alias: 'portal-sagrado-mapa-amoroso-inten-c84m' },
  { source: 'escrever-carta.html', alias: 'portal-sagrado-mapa-amoroso' },
  { source: 'escrever-carta.html', alias: 'escrever-carta' },
  { source: 'chamada-ao-vivo-milena.html', alias: 'sessao-individual-tarologa-milena-z61w' },
  { source: 'chamada-ao-vivo-milena.html', alias: 'sessao-individual-tarologa-milena' },
  { source: 'chamada-ao-vivo-milena.html', alias: 'chamada-ao-vivo-milena' },
  { source: 'obrigado.html', alias: 'confirmacao-atendimento-bencao-q39p' },
  { source: 'obrigado.html', alias: 'confirmacao-atendimento-bencao' },
  { source: 'obrigado.html', alias: 'obrigado' },
  { source: 'privacidade.html', alias: 'politica-de-privacidade-sigilo-sagrado-p24' },
  { source: 'privacidade.html', alias: 'politica-de-privacidade' },
  { source: 'privacidade.html', alias: 'privacidade' },
  { source: 'termos.html', alias: 'termos-de-uso-atendimento-espiritual-t18' },
  { source: 'termos.html', alias: 'termos-de-uso' },
  { source: 'termos.html', alias: 'termos' },
  { source: 'contato/index.html', alias: 'canal-oficial-contato-atendimento-c31' },
  { source: 'contato/index.html', alias: 'canal-oficial-contato' },
  { source: 'contato/index.html', alias: 'contato' },
];

for (const item of routeAliases) {
  const srcFile = path.join(rootDir, item.source);
  if (fs.existsSync(srcFile)) {
    // 1. Cria alias.html (ex: consulta-sagrada-revelacao-amorosa-v9b2.html)
    const destHtml = path.join(distDir, `${item.alias}.html`);
    fs.copyFileSync(srcFile, destHtml);

    // 2. Cria pasta com index.html (ex: consulta-sagrada-revelacao-amorosa-v9b2/index.html)
    const destDir = path.join(distDir, item.alias);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(srcFile, path.join(destDir, 'index.html'));

    console.log(`[copy-dist] Rota estática garantida: /${item.alias}`);
  }
}

console.log('[copy-dist] Todos os arquivos estáticos e rotas copiados para dist/ com sucesso!');
