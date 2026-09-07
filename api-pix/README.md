# API PIX ConnectPay com Supabase

Kit independente para instalar PIX via ConnectPay em outro projeto. O backend roda em Supabase Edge Functions e o navegador nunca recebe a chave privada da ConnectPay nem a chave administrativa do Supabase.

Para a lista objetiva do que ainda precisa ser obtido, consulte `RELATORIO-PARA-CONCLUIR.md`.

## O que esta pronto

- Catalogo e preco definidos no banco, nunca pelo navegador.
- Criacao de cobranca ConnectPay pedindo apenas o nome; contato e CPF ficam na configuracao privada do produto.
- Idempotencia para evitar cobrancas duplicadas.
- Rate limit por hash de IP.
- Timeout nas chamadas ao gateway.
- Polling por endpoint dedicado e token opaco, inclusive para compra anonima.
- Webhook protegido por token e confirmado por consulta direta a ConnectPay.
- Processamento transacional e idempotente no PostgreSQL.
- Estados `pending`, `paid`, `failed`, `expired`, `in_dispute` e `chargeback`.
- Cliente TypeScript reutilizavel em `client/pix.ts`.
- Testes unitarios das regras puras.

## Estrutura

```text
api-pix/
  client/pix.ts
  supabase/config.toml
  supabase/functions/
    _shared/
    connectpay-webhook/
    create-connectpay-pix/
    get-connectpay-pix-status/
    process-meta-conversions/
  supabase/migrations/
  .env.example
  .env.local
```

## Segredos

O arquivo `.env.local` esta ignorado pelo Git e foi preparado para receber:

```ini
CONNECTPAY_API_SECRET=
CONNECTPAY_WEBHOOK_TOKEN=
CONNECTPAY_WEBHOOK_URL=https://SEU_PROJECT_REF.supabase.co/functions/v1/connectpay-webhook?token=O_MESMO_TOKEN
CORS_ALLOWED_ORIGINS=https://seu-dominio.com,http://localhost:5173
META_PIXEL_ID=1076049174870131
META_CAPI_ACCESS_TOKEN=token_gerado_em_Meta_Events_Manager_Conversions_API
META_GRAPH_API_VERSION=v23.0
# META_TEST_EVENT_CODE=TEST12345
```

O Supabase mostra apenas o hash dos Secrets hospedados e nao oferece uma operacao para recuperar o valor original. Guarde a chave bruta em um gerenciador de segredos seguro.

Nunca use prefixo `VITE_`, `NEXT_PUBLIC_` ou equivalente em `CONNECTPAY_API_SECRET`, `CONNECTPAY_WEBHOOK_TOKEN`, `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`.

O `META_CAPI_ACCESS_TOKEN` tambem e exclusivamente de backend. O webhook envia `Purchase` para a Meta Conversions API somente depois de confirmar a transacao diretamente na ConnectPay. O mesmo `orderId` e usado como `event_id` no Pixel e no servidor, permitindo deduplicacao pela Meta. A tabela `meta_conversion_deliveries` registra tentativas, respostas e impede envios duplicados.

## Instalacao

### 1. Dependencias

```bash
npm install
```

### 2. Login e vinculo com o novo Supabase

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
```

Nao vincule ao Supabase de producao da AMAZUS se o objetivo for outro sistema.

### 3. Configure `.env.local`

1. Cole a chave bruta em `CONNECTPAY_API_SECRET`.
2. Gere um token aleatorio com pelo menos 32 caracteres para `CONNECTPAY_WEBHOOK_TOKEN`.
3. Coloque o mesmo token no parametro `token` de `CONNECTPAY_WEBHOOK_URL`.
4. Informe todos os dominios permitidos em `CORS_ALLOWED_ORIGINS`, separados por virgula.

Exemplo para gerar o token no PowerShell:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()
```

### 4. Aplique o banco

```bash
npm run db:push
```

A migration cria `pix_products`, `pix_orders`, `connectpay_webhook_events`, rate limit e as RPCs transacionais.

### 5. Cadastre os produtos

O produto de exemplo nasce inativo. Cadastre valores reais em centavos e mantenha o preco somente no servidor:

```sql
insert into public.pix_products (
  id, name, description, amount_cents, customer_email, customer_cpf, customer_phone, active
)
values (
  'plano_pro', 'Plano Pro', 'Acesso ao Plano Pro', 4990,
  'contato@exemplo.com', '52998224725', '5511999999999', true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  customer_email = excluded.customer_email,
  customer_cpf = excluded.customer_cpf,
  customer_phone = excluded.customer_phone,
  active = excluded.active,
  updated_at = now();
```

### 6. Envie os segredos

```bash
npm run secrets:set
```

O Supabase fornece automaticamente `SUPABASE_URL` e as chaves de backend para as Edge Functions hospedadas.

### 7. Publique as funcoes

```bash
npm run deploy:create
npm run deploy:status
npm run deploy:webhook
npm run deploy:meta-worker
```

As funcoes usam `verify_jwt = false` porque o gateway atual rejeita a chave JWT legada do projeto. As funcoes do navegador validam explicitamente a chave publica esperada nos headers e a origem permitida; o webhook valida o token privado da ConnectPay.

O worker `process-meta-conversions` exige a chave publica exata do proprio projeto e nao recebe IDs externos: ele apenas consome a outbox interna. A migration agenda uma chamada de recuperacao a cada 5 minutos. Entregas normais continuam imediatas; o cron recupera falhas com lease, backoff exponencial e limite de 10 tentativas.

### 8. Configure a ConnectPay

Use exatamente a URL de `CONNECTPAY_WEBHOOK_URL` ao cadastrar o webhook no painel e ao criar cada transacao:

```text
https://SEU_PROJECT_REF.supabase.co/functions/v1/connectpay-webhook?token=SEU_TOKEN
```

Confirme no painel ConnectPay se a sua conta oferece assinatura HMAC ou restricao de IP. Se oferecer, adicione essa verificacao alem das protecoes existentes.

## Frontend

Copie ou importe `client/pix.ts` no projeto consumidor. O fluxo minimo e:

```ts
import { createPixCharge, waitForPixPayment } from './pix';

const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  accessToken: session?.access_token,
};

const charge = await createPixCharge(config, {
  productId: 'plano_pro',
  amountCents: 4990,
  customer: {
    name: 'Cliente Teste',
  },
});

// Mostre charge.pixPayload e gere um QR Code quando qrCodeBase64 for nulo.
const result = await waitForPixPayment(config, charge);
if (result.paid) {
  // Atualize a interface. A entrega real deve ocorrer no backend.
}
```

O retorno visual nunca deve liberar produto, saldo ou assinatura. A entrega e marcada pelo webhook na RPC `process_connectpay_webhook`.

## Contratos HTTP

### Criar cobranca

`POST /functions/v1/create-connectpay-pix`

```json
{
  "productId": "plano_pro",
  "amountCents": 4990,
  "customerName": "Cliente Teste",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
  "statusToken": "token-aleatorio-com-mais-de-32-caracteres"
}
```

### Consultar status

`POST /functions/v1/get-connectpay-pix-status`

```json
{
  "orderId": "UUID_DO_PEDIDO",
  "statusToken": "TOKEN_DA_TENTATIVA"
}
```

### Webhook

`POST /functions/v1/connectpay-webhook?token=TOKEN_SECRETO`

O webhook ignora o status recebido como fonte de verdade. Ele consulta `GET https://api.connectpay.vc/v1/transactions/{id}` e compara transacao, pedido e valor antes da RPC.

## Entrega do produto

A migration apenas marca `fulfilled_at` de forma transacional. Para liberar assinatura, credito, pedido ou download, adicione a regra dentro de `process_connectpay_webhook`, no ramo que converte `AUTHORIZED` para `paid`. Manter a entrega nessa mesma transacao evita sucesso parcial.

## Dados pessoais

CPF, telefone, nome e e-mail ficam protegidos por RLS, mas nao sao criptografados por campo. Antes de producao, defina base legal, retencao, exclusao, acesso administrativo e, se necessario, criptografia de aplicacao. Nao informe ao cliente que os dados estao criptografados sem implementar essa garantia.

## Desenvolvimento local

Requer Docker para o ambiente local do Supabase:

```bash
npm run supabase:start
npm run functions:serve
```

Validacoes sem Docker:

```bash
npm test
npm run typecheck
```

## Homologacao obrigatoria

- Gerar uma cobranca com produto ativo e valor conhecido.
- Repetir a mesma idempotency key e confirmar que nao cria outra cobranca.
- Pagar um PIX de teste e confirmar `paid` no endpoint de status.
- Reenviar o webhook e confirmar que a entrega ocorre uma vez.
- Testar `FAILED`, `EXPIRED`, `IN_DISPUTE` e `CHARGEBACK`.
- Simular valor, `external_id` e transaction ID divergentes.
- Confirmar bloqueio de origem CORS nao cadastrada.
- Confirmar que outro usuario ou token nao le o pedido.
- Confirmar QR Code e Copia e Cola em desktop e celular.
- Configurar logs, alerta de falha e rotina de reconciliacao para pedidos pendentes.

## Referencias

- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase function configuration: https://supabase.com/docs/guides/functions/function-configuration
