# Relatorio para concluir a instalacao PIX

## Situacao atual

O kit tecnico em `D:\amazus\api-pix` esta implementado. Dependencias, CLI Supabase, testes unitarios, typecheck, protecao do arquivo secreto e documentacao ja foram preparados.

Ainda nao houve deploy nem alteracao de banco remoto. Isso evita instalar tabelas e funcoes no Supabase de producao errado.

Decisao registrada: esta pasta sera apenas o pacote portatil. Ela nao sera vinculada nem publicada no projeto Supabase atual. A chave ConnectPay sera uma credencial nova quando o pacote for levado ao outro projeto.

## O que voce precisa pegar agora

### 1. Chave bruta da ConnectPay

Nome usado pelo projeto:

```text
CONNECTPAY_API_SECRET
```

Onde obter:

- painel da ConnectPay;
- area de API, integracoes ou credenciais;
- ambiente correto, homologacao ou producao.

Situacao: obrigatorio e ainda ausente.

O Supabase da AMAZUS possui esse segredo instalado, mas so devolve seu hash. Nem a CLI nem o painel permitem recuperar o valor original depois de salvo. A autorizacao para copiar a chave nao resolve essa limitacao tecnica: e necessario obter novamente o valor bruto na ConnectPay ou gerar uma nova credencial.

### 2. Projeto Supabase de destino

Pegue o `project ref` do Supabase que recebera a API. Ele aparece na URL do projeto e tem formato semelhante a:

```text
abcdefghijklmnopqrst
```

Projetos atualmente acessiveis nesta maquina:

```text
Dipefy Store: wfxwdsnvlqggilojdedp
Amazus:       yzswjaicigaaatdjcnjk
```

Para instalar em outro sistema, use o Supabase desse outro sistema ou crie um projeto separado. Nao reutilize o banco de producao da AMAZUS apenas para economizar uma configuracao.

Situacao: obrigatorio escolher antes do deploy.

### 3. Dominio do novo frontend

Pegue todas as origens que poderao abrir o checkout, sem barra no final:

```text
https://seu-dominio.com
https://www.seu-dominio.com
http://localhost:5173
```

Elas serao gravadas em:

```text
CORS_ALLOWED_ORIGINS
```

Situacao: obrigatorio antes da publicacao.

### 4. Catalogo de produtos e precos

Para cada item vendido por PIX, informe:

```text
ID interno: plano_pro
Nome: Plano Pro
Descricao: Acesso ao Plano Pro
Preco em centavos: 4990
Ativo: sim
```

O navegador enviara somente o ID. Nome e preco ficam no banco para impedir manipulacao do valor.

Situacao: obrigatorio antes da primeira cobranca.

### 5. Regra de entrega apos pagamento

Defina exatamente o que deve acontecer quando a ConnectPay confirmar `AUTHORIZED`:

```text
ativar assinatura;
adicionar creditos;
marcar pedido como liberado;
enviar acesso ou download;
ou apenas registrar o pagamento.
```

Tambem defina a reversao para `IN_DISPUTE` e `CHARGEBACK`.

Situacao: obrigatorio para automatizar a entrega. Sem essa regra, o kit registra o pagamento e `fulfilled_at`, mas nao altera tabelas especificas do outro sistema.

### 6. Pasta do projeto frontend que recebera o checkout

Pegue o caminho local do outro projeto e informe a stack:

```text
Caminho: D:\caminho\do\outro-projeto
Stack: React/Vite, Next.js, Vue, aplicativo mobile ou outra
```

O cliente generico ja existe em `client/pix.ts`; o caminho e a stack permitem integrar formulario, QR Code, Copia e Cola e retorno visual no lugar correto.

Situacao: obrigatorio para instalar a interface no outro projeto.

## Informacoes recomendadas

### Ambiente ConnectPay

Confirme se a chave e de homologacao ou producao e se a conta possui saldo/configuracao para transacao PIX.

### Seguranca oficial do webhook

Pegue na documentacao ou no suporte ConnectPay qualquer informacao sobre:

- assinatura HMAC;
- header de assinatura;
- segredo exclusivo de webhook;
- lista oficial de IPs;
- politica de reenvio.

O kit ja usa token secreto na URL e reconsulta a transacao na ConnectPay. Uma assinatura oficial deve ser adicionada se estiver disponivel.

### Autenticacao

Defina se a compra exige login ou aceita visitante. O kit suporta os dois, mas a regra comercial deve ser explicita.

### Dados pessoais

Defina por quanto tempo CPF, telefone, nome e e-mail devem ser mantidos e quem pode acessa-los. RLS esta ativa, mas criptografia por campo e rotina de exclusao dependem da politica do novo sistema.

## O que nao precisa pegar

- `SUPABASE_URL` no backend hospedado: fornecido automaticamente pelo Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` no backend hospedado: fornecida automaticamente pelo Supabase.
- token do webhook: ja foi gerado localmente em `.env.local`.
- idempotency key e token de status: o cliente TypeScript gera por tentativa.
- preco enviado pelo frontend: ele nao e aceito como fonte de verdade.

## Ordem para finalizar

1. Obter `CONNECTPAY_API_SECRET`.
2. Escolher o Supabase de destino.
3. Informar dominios permitidos.
4. Definir produtos e precos.
5. Definir entrega e reversao.
6. Informar o projeto frontend de destino.
7. Vincular a CLI ao Supabase escolhido.
8. Aplicar a migration.
9. Enviar os secrets.
10. Publicar as tres Edge Functions.
11. Integrar o checkout no frontend.
12. Executar homologacao PIX completa.

## Dados minimos para a proxima etapa

```text
CONNECTPAY_API_SECRET: valor bruto obtido no painel ConnectPay
SUPABASE_PROJECT_REF: projeto do novo sistema
CORS_ALLOWED_ORIGINS: dominios separados por virgula
PRODUTOS: ID, nome, descricao e preco em centavos
ENTREGA: acao ao pagar e acao em disputa/chargeback
FRONTEND: caminho local e stack
```
