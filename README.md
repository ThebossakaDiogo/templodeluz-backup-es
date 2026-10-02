# Quiz Tarot - Template de implantacao

Template de quiz interativo com:

- checkout PIX via ConnectPay;
- pedidos, leads, agendamentos e analytics no Supabase;
- webhook validado diretamente na ConnectPay;
- atendimento liberado somente depois do pagamento confirmado;
- geracao de leituras pela OpenAI;
- frontend Vite e APIs serverless para Vercel;
- testes automatizados dos fluxos criticos.

## Configuracao completa

Leia [`IMPLEMENTACAO.md`](IMPLEMENTACAO.md). O guia cobre:

1. criacao do projeto Supabase;
2. aplicacao das migracoes;
3. secrets e deploy da Edge Function;
4. webhook da ConnectPay;
5. variaveis da Vercel;
6. OpenAI, dominio, SEO e tracking;
7. testes antes e depois do deploy.

## Inicio rapido

```bash
npm ci
npm test
npm run dev
```

Para gerar a versao de producao:

```bash
npm run build
npm run preview
```

## Variaveis

Copie `.env.example` para `.env` e preencha somente no seu ambiente. Todos os campos do arquivo de exemplo estao vazios de proposito.

O `.gitignore` impede o envio de `.env`, senhas, bancos locais, logs, builds e metadados da Vercel/Supabase.

## Estrutura principal

- `api/`: APIs serverless da Vercel.
- `supabase/functions/`: webhook externo da ConnectPay.
- `supabase/migrations/`: tabelas, indices e politicas RLS.
- `js/`: fluxos do quiz, checkout e atendimento.
- `tests/`: regressao de pagamento, seguranca e frontend.
- `scripts/copy-dist.js`: prepara as paginas e rotas estaticas em `dist/`.

Nenhuma credencial ou identificador de projeto deve ser versionado neste repositorio.
