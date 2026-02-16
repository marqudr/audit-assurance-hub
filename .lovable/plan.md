

## Dashboard Executivo -- Cockpit do Gestor

Substituir completamente o Dashboard atual (que usa dados mock) por um cockpit executivo real, alimentado por dados do banco, organizado em 4 seções visuais.

### Estrutura do Dashboard

O dashboard sera dividido em 4 blocos visuais empilhados:

#### Bloco 1 -- KPIs North Star (4 cards no topo)

| Card | Fonte | Logica |
|------|-------|--------|
| Economia Total sob Gestao (YTD) | `projects` com status `ganho`, soma de `estimated_benefit_min` do ano corrente | Valor em R$ com icone DollarSign |
| Glosa Historica Estimada | Calculada como % de projetos que passaram por retrabalho vs total aprovados (First Pass Yield invertido). Cores semanticas: Verde (<0.5%), Amarelo (0.5-1.5%), Vermelho (>2%) | Badge colorido |
| Throughput por Consultor | Total projetos ativos (nao-terminais) / total consultores staff ativos | Numero com sparkline simulada |
| Taxa de Aprovacao (First Pass Yield) | `project_phases` com status `approved` na primeira tentativa vs total aprovados | Percentual com cor semantica |

#### Bloco 2 -- Pipeline de Operacoes (Funil de 7 Fases)

- Grafico de barras horizontais mostrando as 7 fases do pipeline operacional
- Cada barra mostra quantidade de projetos e valor financeiro (`estimated_benefit_min`) por fase
- Cores por fase seguindo a paleta existente
- Destaque visual (borda vermelha ou icone) em fases com gargalo: fases com mais projetos que a media
- Lista compacta "Projetos em Risco de SLA": projetos parados na mesma fase por mais de 5 dias (comparando `updated_at` da `project_phases`)

#### Bloco 3 -- Marketing & Vendas (Funil Duplo)

- **Leads Qualificados (MQLs)**: contagem de projetos com `icp_score >= 7.5`
- **Taxa de Conversao (Lead -> Cliente)**: projetos `ganho` / total projetos criados (%)
- **Ciclo de Vendas (Time-to-Close)**: media de dias entre `created_at` e `updated_at` dos projetos `ganho`
- **Propostas Geradas vs Fechadas**: projetos que passaram por `proposta` vs projetos `ganho`
- Visualizacao: mini-cards com metricas + grafico de funil simplificado com barras

#### Bloco 4 -- Visao Detalhada de Projetos

Dividido em 2 colunas:

**Coluna esquerda -- Volumetria por Fase:**
- Grafico de barras horizontais ("Funil de Operacoes") com quantidade de projetos E valor financeiro (R$) travado em cada etapa
- Destaque em Fase 1-2 (Backlog) e Fase 6-7 (Prontos para faturar)

**Coluna direita -- Saude do Pipeline:**
- Throughput (Projetos Entregues/Mes): contagem de `project_phases` com status `approved` e `approved_at` no mes corrente, agrupados por `approved_by` (consultor)
- Projetos Parados (Stalled): lista de projetos com fase `in_progress` ha mais de 5 dias
- Taxa de Retrabalho: % de fases que foram para `review` mais de uma vez (usando `phase_executions`)

### Hook de Dados

Criar um hook `src/hooks/useDashboardMetrics.ts` que:
- Busca `projects` com join em `leads` (todos, sem filtro de status)
- Busca `project_phases` (todas)
- Busca `phase_executions` (todas)
- Busca `profiles` com `user_type = 'staff'` e `is_deleted = false` (para contar consultores)
- Calcula todas as metricas derivadas via `useMemo`

### Componentes

Criar componentes separados para manter o Dashboard organizado:

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useDashboardMetrics.ts` | Hook central de dados e metricas |
| `src/components/dashboard/NorthStarKPIs.tsx` | 4 cards KPI do topo |
| `src/components/dashboard/OperationsPipeline.tsx` | Funil de 7 fases + projetos em risco |
| `src/components/dashboard/SalesFunnel.tsx` | Metricas de marketing e vendas |
| `src/components/dashboard/DeliveryHealth.tsx` | Volumetria + saude do pipeline |
| `src/pages/Dashboard.tsx` | Pagina principal reescrita para compor os 4 blocos |

### Detalhes Tecnicos

**`useDashboardMetrics.ts`:**
- `useQuery` com key `["dashboard-metrics"]`
- Faz 4 queries paralelas via `Promise.all`:
  1. `projects` com `leads` join
  2. `project_phases` todas
  3. `phase_executions` todas
  4. `profiles` staff ativos
- Retorna objeto com todas as metricas pre-calculadas

**Calculo de Glosa:**
- Como nao ha campo explicito de "glosa", usa-se a taxa de retrabalho como proxy: fases que tiveram mais de 1 execucao (`phase_executions` com count > 1 para mesmo `project_id` + `phase_number`) dividido pelo total de fases aprovadas
- Cores: verde se < 0.5%, amarelo 0.5-1.5%, vermelho > 2%

**Projetos em Risco de SLA:**
- Filtra `project_phases` com status `in_progress`
- Calcula dias desde `updated_at`
- Projetos com > 5 dias sao marcados como "em risco"
- Exibe nome do projeto, fase atual e dias parado

**Sparkline para Throughput:**
- Usa um mini grafico de linha (Recharts `LineChart`) com dados dos ultimos 6 meses
- Agrupa projetos ativos por mes de `created_at`

**Formatacao BRL:**
- Reutiliza o padrao `formatBRL` ja existente no projeto

### Resumo de Arquivos

| Acao | Arquivo |
|------|---------|
| Novo | `src/hooks/useDashboardMetrics.ts` |
| Novo | `src/components/dashboard/NorthStarKPIs.tsx` |
| Novo | `src/components/dashboard/OperationsPipeline.tsx` |
| Novo | `src/components/dashboard/SalesFunnel.tsx` |
| Novo | `src/components/dashboard/DeliveryHealth.tsx` |
| Modificar | `src/pages/Dashboard.tsx` |

