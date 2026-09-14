# Templo de Luz - Resumo do Projeto

Data: 2026-09-06
Autor: Kilo / Diogo
Repositório: https://github.com/ThebossakaDiogo/templodeluz-milenamedeiros

---

## 1. Visão Geral

O projeto consiste em um funil de quiz/landing page para captação de leads e venda de produtos/services via PIX. A aplicação é composta por:

- **Quiz principal**: `src/` (React + TanStack Router + Vite)
- **Dashboard administrativo**: `dashboard/` (React + Vite, deploy separado)
- **API PIX / Backend**: `api-pix/` (Supabase Edge Functions)
- **Assets/imagens**: `public/`, `images-elements/`, `selos/`

---

## 2. Infraestrutura e Projetos

### 2.1 Repositórios
- **Principal**: `templodeluz-milenamedeiros` (origin)
- **Dashboard**: `dashboard-metrics` (remote `dashboard-repo`)
- **Espelho TikTok**: `quiz-templodeluz` (`C:\Users\thebo\AppData\Local\Temp\kilo\quiz-templodeluz`)

### 2.2 Supabase
- **Meta/Original**: `https://opftmzegcvfyoinjfmcj.supabase.co`
- **TikTok/Mirrored**: `https://yfpiqfytonuhigwkssio.supabase.co` (projeto `quiz-templo-de-luz`)

### 2.3 Deploy
- **Vercel**: `.vercel/`, `vercel.json`
- **Wrangler/Cache**: `.wrangler/`

---

## 3. Arquitetura dos Quizzes

### 3.1 Quiz Original (Meta)
- Rota raiz: `src/routes/__root.tsx`
- Componente principal: `src/components/funnel/QuizFunnel.tsx`
- Checkout PIX: `src/components/funnel/PixCheckout.tsx`
- Cirurgia PIX: `src/components/funnel/MilenaCataractModal.tsx`
- Pixel config: Meta Pixel + UTMIFY Meta exclusivo
- Tracking: Meta Pixel + Telemetria Supabase (funnel-telemetry)

### 3.2 Quiz Espelho (TikTok)
- Local: `quiz-templodeluz/`
- Configuração PIX isolada: `PIX_CONFIG_MIRRORED`
- Não carrega TikTok Pixel na origem original
- UTMIFY delivery condicional via `TIKTOK_UTMIFY_API_TOKEN`

---

## 4. Roteamento PIX e Contas

- `src/lib/pix-config.ts`: `PIX_CONFIG_ORIGINAL`
- `quiz-templodeluz/src/lib/pix-config.ts`: `PIX_CONFIG_MIRRORED`
- Ambas as configurações são imutáveis e explícitas para evitar roteamento cruzado.
- O Meta usa a chave moderna `sb_publishable_...`, enviada no header `apikey` e nunca como JWT Bearer.
- Projeto, chave, conta, CORS, webhook e autenticação PIX só podem ser alterados com autorização explícita e teste HTTP antes do deploy.

---

## 5. Tracking e Atribuição

### 5.1 Meta Pixel
- Carregado apenas no quiz original.
- Eventos de etapa disparam Meta Pixel + Telemetria Supabase.
- O evento `Purchase` usa o `orderId` como `event_id` para deduplicar Pixel e Conversions API.

### 5.1.1 Meta Conversions API
- Vendas PIX aprovadas sao enviadas pelo webhook da ConnectPay diretamente para a Meta.
- O envio ocorre somente depois da verificacao da transacao no gateway.
- `_fbp`, `_fbc`, IP, user-agent e URL da pagina sao persistidos no pedido para melhorar o Event Match Quality.
- Nome, e-mail, telefone e identificador externo sao normalizados e enviados com SHA-256.
- A tabela `meta_conversion_deliveries` fornece idempotencia, auditoria e nova tentativa.
- O worker protegido `process-meta-conversions` recupera filas e leases expiradas com backoff, sem bloquear o webhook ou a entrega do QR Code; um cron de seguranca roda a cada 5 minutos.
- `InitiateCheckout` e disparado no Pixel ao abrir o checkout e confirmado pela CAPI quando a cobranca ConnectPay e criada, usando o mesmo `event_id`.
- Segredos necessarios: `META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID` e `META_GRAPH_API_VERSION`.

### 5.2 UTMIFY
- **Meta**: sempre ativo; entrega via `utmify_deliveries` outbox (idempotente).
- **TikTok**: entregue apenas se `TIKTOK_UTMIFY_API_TOKEN` estiver configurado.

### 5.3 TikTok Pixel
- Não carregado no quiz original.
- Não há integração UTMIFY hardcoded no espelho.

### 5.4 Deduplicação de Tracking
- `QuizFunnel.tsx` agora usa `trackedStepsRef` e `telemetrySnapshotRef` para evitar eventos duplicados por digitação.

---

## 6. Dashboard

- Meta/TikTok profile switcher implementado.
- Responsividade mobile melhorada.
- Componentes principais:
  - `AbandonmentTracker.tsx`
  - `ConsulentesTelemetryTable.tsx`
  - `FunnelTracker.tsx`
  - `ProductDeliveryModal.tsx`
  - `ProfileView.tsx`
  - `WhatsAppTracker.tsx`
  - `dashboard-design-system.css`

---

## 7. Evolution API (WhatsApp)

- Bridge local: `C:\evolution-local\`
- URL: `http://127.0.0.1:3210`
- Configurado para permitir origem `https://odmetrics.vercel.app`
- Observação: `127.0.0.1` funciona apenas quando browser e bridge estão na mesma máquina.

---

## 8. PIX / ConnectPay

### 8.1 Edge Functions (Meta)
- `create-connectpay-pix` v16
- `get-connectpay-pix-status` v15
- `connectpay-webhook` v13

### 8.2 Edge Functions (TikTok)
- `create-connectpay-pix` v12
- `get-connectpay-pix-status` v10
- `connectpay-webhook` v11

### 8.3 Validação de Identidade
- Webhook valida `quiz_origin`, `pix_account_key`, `pix_account_fingerprint`.
- Status endpoint faz reconciliação de transações `AUTHORIZED`.

---

## 9. Recuperação de Vendas (UTMIFY)

- Script: `api-pix/scripts/replay-meta-utmify-orders.mjs`
- 6 vendas Meta recuperadas para UTMIFY:
  - `2a56f483-69c0-4254-8768-3a2566eca587`
  - `45f57e3a-9703-4bf6-81f8-b905c7e176a9`
  - `20126e46-6cda-469e-94e5-8546f4c8a2b9`
  - `19d75ea7-710d-4519-a02e-7a79f2e15936`
  - `0ff4f270-3b82-44d6-9996-a4644f871c65`
  - `87fcf175-2477-42e7-8205-13167f3be5a6`
- Total recuperado: R$ 85,00
- Idempotência verificada.

---

## 10. Segurança

- JWT de webhook desabilitado em ambos os Supabase.
- Isolamento cross-origin verificado:
  - TikTok origin rejeitada pelo backend Meta (403).
  - Meta origin rejeitada pelo backend TikTok (403).

---

## 11. Migrations Aplicadas

### Meta
- `20260905220000`
- `20260906040000`
- `20260906193000` (isolamento de contas e outbox UTMIFY)

### TikTok
- `20260906193000_isolate_mirrored_pix_account.sql`
- `20260906200000_add_utmify_recovery_outbox.sql`

---

## 12. Commits Relevantes (original)

- `a275437` feat(dashboard): melhorar responsividade mobile e corrigir rastreamento duplicado do quiz
- `87b00b7` feat(pix): expor identidade da transacao Meta
- `b8f0367` feat(tracking): adicionar replay idempotente para UTMIFY
- `9bc90ad` fix(tracking): manter somente a UTMIFY Meta
- `83a83d4` fix(webhook): validar token configurado no callback
- `05f6e46` fix(pix): corrigir chave publica do Supabase Meta
- `71f7078`, `7e3443a`, `05f6e46`, `9bc90ad`, `87b00b7`, `b8f0367` - restauração e isolamento PIX Meta
- `f803672`, `5ac054e`, `6acfc47`, `b95d20f` - isolamento PIX TikTok

---

## 13. Pendências / Próximos Passos

1. Monitorar próxima venda da campanha Meta em produção.
2. Configurar `TIKTOK_UTMIFY_API_TOKEN` no Supabase TikTok se necessário.
3. Finalizar setup admin do WSL2/Docker (`wsl --install` + reboot).

---

## 14. Estrutura Limpa do Projeto

```
D:\templodeluz\
├── api-pix/                  # Edge Functions, migrations, scripts
│   ├── scripts/
│   └── supabase/
├── dashboard/                # Dashboard admin
│   └── src/
├── docs/                     # Documentação e resumos
│   └── projeto-resumo.md
├── images-elements/          # Imagens do funil
├── public/                   # Assets públicos
├── selos/                    # Selos/ certificados
├── src/                      # Quiz original
│   └── components/funnel/
├── .archive/                 # Arquivos obsoletos movidos para cá
├── node_modules/
├── package.json
├── vercel.json
├── vite.config.ts
├── tsconfig.json
├── bun.lock
├── .env.example
├── .env.local
├── .env.vercel
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── docs/reference/design.json
├── docs/reference/schema.json
├── components.json
└── README.md
```

> Observação: pastas/arquivos gerados pelo sistema como `.git`, `.kilo`, `.vercel`, `.wrangler`, `.tanstack`, `node_modules` foram mantidos.

---

## 15. Arquivos Obsoletos Movidos para `.archive/`

- `backredirect/` - assets não referenciados no código
- `.output/` - cache/build
- `.tanstack/` - cache/build
- `acesso-evolution-n8n.txt` - nota antiga
- `APIKEY-CONNECT.txt` - segredo/nota antiga
- `CONNECTPAY-E-SECRETS.txt` - segredo/nota antiga
- `findings.md` - documento antigo
- `progress.md` - documento antigo
- `task_plan.md` - documento antigo
- `docs/legacy/INSTALAR_TELEMETRIA_SUPABASE.sql` - SQL antigo
- `novo-design/` - rascunho/design não integrado

Arquivos mantidos pois são utilizados:
- `Feedbacks/` - usado em `SocialProofSection.tsx`
- `logo-od-metrics.png` - asset de marca
- `dashboard/src/novo-design-tokens.css` - referência ao `novo-design` que foi arquivado; se precisar restaurar, basta mover de volta.
