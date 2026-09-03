# PROMPT DE REMODELAÇÃO COMPLETA DO CRM / DASHBOARD

Use o arquivo `dashboard_visual_system.json` anexado como SOURCE OF TRUTH visual e use a imagem de referência anexada apenas como referência estética.

## OBJETIVO

Remodelar completamente a interface visual do meu CRM/dashboard atual para a mesma linguagem visual da referência: dark premium, aparência de produto Apple/macOS/iPhone, superfícies quase pretas em camadas, cards arredondados, bordas extremamente sutis, tipografia limpa, controles compactos, accent lavender/purple e alta densidade de informação com aparência organizada.

IMPORTANTE: eu NÃO quero copiar o conteúdo da dashboard de referência. Não copie marca, logo, textos, métricas, nomes de ativos, staking, criptomoedas, números ou funcionalidades específicas mostradas na referência.

Quero aplicar SOMENTE a linguagem de design ao MEU produto e manter todas as minhas informações e funcionalidades.

## REGRA PRINCIPAL

Preserve 100%:
- lógica de negócio;
- banco/modelos de dados;
- APIs;
- rotas;
- autenticação;
- permissões;
- automações;
- métricas atuais;
- formulários;
- filtros;
- tabelas;
- ações e workflows do CRM.

Altere apenas a camada de apresentação, composição e experiência visual.

## PROCESSO OBRIGATÓRIO

1. Analise primeiro a estrutura atual do projeto e identifique:
   - AppShell;
   - Sidebar;
   - Header/Topbar;
   - dashboards;
   - cards;
   - tabelas;
   - formulários;
   - gráficos;
   - filtros;
   - tabs;
   - modais;
   - drawers;
   - estados vazios/loading/error;
   - páginas de detalhe.

2. Antes de remodelar telas isoladas, crie um DESIGN SYSTEM global baseado no JSON:
   - CSS variables/design tokens;
   - cores;
   - tipografia;
   - spacing;
   - border radius;
   - borders;
   - shadows;
   - states;
   - motion;
   - responsive breakpoints.

3. Crie/refatore componentes reutilizáveis:
   Button, IconButton, Input, Select, Search, Card, MetricCard, Badge, Tabs, SegmentedControl, Modal, Drawer, Table, Tooltip, Dropdown, ChartContainer e NavigationItem.

4. Depois aplique o sistema em todas as telas do produto.

## DIREÇÃO VISUAL

A aparência precisa transmitir:
- aplicação SaaS premium;
- estética macOS/iOS;
- fundo preto azulado quase absoluto;
- sidebar escura e muito discreta;
- superfícies internas ligeiramente mais claras que o background;
- bordas hairline de 1px e baixo contraste;
- cards de 14–18px de radius;
- lavender como cor principal de interação;
- texto branco suave, nunca branco estourado em tudo;
- labels e dados secundários em cinza frio;
- ícones pequenos e minimalistas;
- gráficos finos, limpos e discretos;
- sombras mínimas;
- nenhum visual genérico de template Bootstrap/Admin.

Não exagerar em:
- glassmorphism;
- blur;
- neon;
- gradients;
- sombras pesadas;
- cards gigantes;
- botões enormes;
- ícones coloridos demais.

A referência é sofisticada justamente porque quase tudo é contido.

## ESTRUTURA DESKTOP

Use uma composição próxima ao padrão visual da referência:
- topbar compacta;
- sidebar fixa de aproximadamente 224px;
- conteúdo principal com padding de 24–28px;
- grid de 12 colunas;
- cards separados por gaps de aproximadamente 16px;
- títulos alinhados à esquerda;
- filtros e ações secundárias alinhados à direita;
- uma ou poucas áreas de destaque visual, sem transformar cada card em protagonista.

Não coloque uma barra de navegador/Safari dentro do produto real. O chrome de macOS mostrado na referência é apenas ambientação visual da captura.

## MOBILE / IPHONE

A versão mobile precisa ser redesenhada, e não apenas espremida.

Em iPhone:
- sidebar vira drawer ou bottom navigation;
- uma coluna;
- padding lateral de 16px;
- topbar de aproximadamente 56px;
- touch targets de no mínimo 44px;
- cards empilhados;
- ações principais podem ocupar a largura total;
- tabelas densas devem virar cards/linhas responsivas quando fizer sentido;
- gráficos devem continuar legíveis;
- hierarquia visual deve permanecer premium e limpa.

## DADOS E CONTEÚDO

Use exatamente os dados, labels e seções que já existem no meu sistema.

Exemplo:
Se meu dashboard tem leads, faturamento, campanhas, clientes, tickets, conversões ou qualquer outra métrica, essas informações continuam as mesmas. Apenas apresente-as usando os componentes e a linguagem visual do JSON.

Não invente dados para preencher a interface final.

## GRÁFICOS

Padronize os gráficos:
- background transparente;
- linhas finas;
- grids com opacidade muito baixa;
- lavender/purple para séries principais;
- vermelho suave para queda/estado negativo;
- verde suave para positivo;
- tooltip escuro;
- labels discretos.

Evite gráficos com excesso de legenda, bordas, cores ou elementos decorativos.

## ESTADOS DE INTERAÇÃO

Implemente:
- hover sutil;
- active/pressed discreto;
- focus ring lavender;
- transições de aproximadamente 120–180ms;
- disabled states;
- loading skeleton;
- empty states;
- error states;
- success feedback.

Nada deve “pular” ou aumentar exageradamente no hover.

## FONTES

Priorize:
- -apple-system
- BlinkMacSystemFont
- SF Pro Display / SF Pro Text quando disponíveis
- Inter como fallback

Use pesos 400, 500 e 600. Evite excesso de bold.

## RESULTADO FINAL ESPERADO

Quero abrir meu CRM e sentir que ele foi redesenhado como um produto digital premium de uma empresa grande, com acabamento semelhante ao ecossistema Apple e com a linguagem visual da imagem de referência.

Mas deve continuar claramente sendo O MEU CRM, com:
- minha marca;
- meus dados;
- meus módulos;
- minhas funções;
- meus fluxos.

A referência é o DESIGN, não o conteúdo.

## CRITÉRIO DE QUALIDADE

Antes de concluir:
1. compare cada tela com o JSON;
2. confirme consistência de cores/radius/spacing;
3. confirme que nenhum conteúdo funcional foi removido;
4. teste desktop, tablet e iPhone;
5. corrija qualquer componente que ainda pareça “template genérico”;
6. mantenha contraste suficiente para leitura;
7. faça uma última passada de refinamento visual em bordas, gaps, alinhamentos e hierarquia.

Não faça apenas uma troca de cores. Quero uma remodelação completa da interface e do sistema de componentes, preservando integralmente o produto por baixo.
