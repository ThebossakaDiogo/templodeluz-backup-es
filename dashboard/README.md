# 📊 Templo de Luz — Dashboard & Tracking Hub

Dashboard executiva independente para monitoramento em tempo real de Leads, Funil do Quiz, Vendas Pendentes (PIX), Vendas Confirmadas e Telemetria de Tráfego.

---

## 🚀 Como Rodar Localmente

```bash
cd D:\templodeluz\dashboard
bun install # ou npm install
bun run dev  # ou npm run dev
```

Acesse em: `http://localhost:3001`

---

## 🌐 Como Publicar em Repositório e Domínio Próprio

1. **Inicializar o Git nesta pasta**:
   ```bash
   cd D:\templodeluz\dashboard
   git init
   git add -A
   git commit -m "feat: inicializa dashboard independente do Templo de Luz"
   ```

2. **Conectar ao novo repositório no GitHub**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO_DASHBOARD.git
   git push -u origin main
   ```

3. **Deploy na Vercel / Cloudflare Pages**:
   - Conecte o repositório.
   - Configure as variáveis de ambiente (conforme `.env.example`).
   - Aponte seu domínio personalizado (ex: `dashboard.seudominio.com`).

## Evolution API local

A dashboard controla a instalação local exclusivamente pelo **Evolution Local Bridge**:

```text
Dashboard Web
  -> http://127.0.0.1:3210
  -> Docker Desktop
  -> http://127.0.0.1:8080
  -> PostgreSQL + Redis
```

Arquivos locais:

- Bridge e Compose: `C:\evolution-local`
- Compose: `C:\evolution-local\docker-compose.yml`
- Segredo local: `C:\evolution-local\.env`

O navegador nunca executa PowerShell, CMD ou Docker e não recebe a `AUTHENTICATION_API_KEY`. Os únicos endpoints do Bridge são `GET /health`, `GET /evolution/status`, `POST /evolution/start`, `POST /evolution/stop` e `POST /evolution/restart`.

Antes do primeiro uso, instale o Docker Desktop. O Bridge inicia automaticamente no login pela pasta Startup do Windows.

## PWA e ícones

Os assets de instalação ficam em `public/icons`, incluindo ícones de 192px, 512px, Apple Touch e uma versão maskable com margem segura. O Service Worker armazena apenas o shell local e assets estáticos; chamadas Supabase e Evolution não entram no cache.
