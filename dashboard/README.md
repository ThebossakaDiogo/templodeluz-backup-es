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
