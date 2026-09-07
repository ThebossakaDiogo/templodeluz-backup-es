# Proteções Operacionais

- Nunca alterar `src/lib/pix-config.ts`, referências Supabase, chaves públicas, contas ConnectPay, URLs de webhook, `verify_jwt`, CORS ou roteamento PIX sem autorização explícita do usuário.
- Antes de publicar qualquer mudança no PIX, validar criação e consulta de status usando a mesma chave e origem do frontend. Um payload de teste inválido deve chegar à validação (HTTP 400), nunca parar em HTTP 401/403.
- O quiz Meta usa exclusivamente o Supabase `opftmzegcvfyoinjfmcj` e a conta `connectpay_original`.
- O quiz TikTok usa exclusivamente o Supabase `yfpiqfytonuhigwkssio` e a conta ConnectPay espelhada.
- Nunca executar `git push dashboard-repo main`. O remoto `dashboard-repo` recebe apenas o conteúdo de `dashboard/` via `git subtree`.
- Não enviar o frontend do quiz para o remoto do dashboard nem o dashboard para o remoto do quiz espelhado.
