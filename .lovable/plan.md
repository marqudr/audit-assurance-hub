

# Dashboard Operacional do CRM

## Visao Geral

Reorganizar a pagina CRM para incluir um dashboard operacional completo acima do Kanban/Tabela, com 4 blocos estrategicos que transformam dados existentes em inteligencia acionavel para o vendedor.

## Estrutura da Pagina (de cima para baixo)

```text
+---------------------------------------------------------------+
| Header: CRM - Vendas & Originacao              [+ Novo Lead]  |
+---------------------------------------------------------------+
| 1. O QUE EU FACO AGORA? (Alertas Criticos - fundo vermelho)   |
|  [Leads sem contato: 3] [Atrasados: 2] [Parados 7d+: 1]       |
+---------------------------------------------------------------+
| 2. FABRICA DE DINHEIRO (Pipeline de Vendas)                    |
|  [Pipeline por estagio] [Ponderado] [Gap para Meta]            |
+---------------------------------------------------------------+
| 3. GESTAO DE ENERGIA (Qualidade vs Quantidade)                 |
|  [Top Leads ICP] [Conversao por Etapa] [Idade Media]           |
+---------------------------------------------------------------+
| 4. HISTORICO E PROXIMOS PASSOS                                 |
|  [Ultimas interacoes] [Agenda do dia]                          |
+---------------------------------------------------------------+
| Metricas resumidas (4 cards existentes)                        |
+---------------------------------------------------------------+
| Tabs: Pipeline | Tabela                                        |
+---------------------------------------------------------------+
```

## Detalhamento dos Blocos

### Bloco 1: "O que eu faco agora?" (Operacional Critico)

Componente: `CrmActionAlerts`

Tres indicadores calculados a partir dos dados existentes:

- **Leads Novos sem Contato**: leads com `status = 'prospeccao'` E `last_contacted_date IS NULL`. Card clicavel que filtra/abre lista.
- **Tarefas Atrasadas**: leads onde `next_activity_date < now()` ou `next_action_date < now()`. Contagem com destaque vermelho.
- **Leads Parados (Stall)**: leads ativos sem interacao recente. Calculo: `last_contacted_date` mais antiga que 7 dias (ou sem data). Exibe contagem com thresholds de 3d (amarelo), 5d (laranja), 7d+ (vermelho).

Visual: card com fundo `bg-red-50 border-red-200` quando ha itens pendentes, `bg-green-50` quando tudo limpo. Cada alerta e clicavel e abre o detalhe do lead.

### Bloco 2: "Fabrica de Dinheiro" (Pipeline)

Componente: `CrmPipelineMetrics`

- **Valor por Estagio**: barra horizontal (Recharts `BarChart`) com o `deal_value` somado por fase ativa (prospeccao ate fechamento). Cores alinhadas com o Kanban.
- **Pipeline Ponderado**: cada lead contribui com `deal_value * (probability / 100)`. Soma total exibida como numero grande. Detalhe por estagio ao lado.
- **Gap para Meta**: barra de progresso simples. Meta configuravel (inicialmente hardcoded R$ 100k, campo editavel no futuro). Realizado = soma de `deal_value` dos leads ganhos no mes. Faltam = Meta - Realizado. Cores: verde se >= 80%, amarelo 50-80%, vermelho < 50%.

### Bloco 3: "Gestao de Energia" (Qualidade)

Componente: `CrmEnergyMetrics`

- **Top Leads por ICP**: lista dos 5 leads com maior `icp_score` que estejam ativos. Exibe nome, ICP score e deal_value. Clicavel para abrir detalhe.
- **Taxa de Conversao por Etapa**: calculo baseado na contagem de leads por fase. Exibe como funil simplificado ou tabela: "Prospeccao: 10 | Qualificacao: 7 (70%) | Diagnostico: 4 (57%) | ...".
- **Idade Media da Oportunidade**: `differenceInDays(now, created_at)` medio dos leads ativos. Destaque para leads individuais acima do dobro da media.

### Bloco 4: "Historico e Proximos Passos"

Componente: `CrmRecentActivity`

- **Ultimas Interacoes**: lista dos 5 leads com `last_contacted_date` mais recente. Exibe empresa, tipo de atividade (`last_activity_type`), data e notas (`content_consumed`). Feed cronologico.
- **Agenda do Dia**: leads com `next_activity_date` = hoje. Exibe empresa, tipo esperado e horario. Se nenhum, exibe "Nenhuma atividade agendada para hoje".

Nota: a sincronizacao com calendario externo (Google Calendar) sera uma evolucao futura. Neste momento, usamos os dados ja existentes na tabela `leads`.

## Arquivos a Criar/Modificar

### Novos componentes:
- `src/components/crm/CrmActionAlerts.tsx` - Bloco 1
- `src/components/crm/CrmPipelineMetrics.tsx` - Bloco 2
- `src/components/crm/CrmEnergyMetrics.tsx` - Bloco 3
- `src/components/crm/CrmRecentActivity.tsx` - Bloco 4

### Modificar:
- `src/pages/CRM.tsx` - importar e renderizar os 4 novos blocos acima dos cards de metricas existentes. Passar `leads` e `onCardClick` como props.

## Detalhes Tecnicos

- **Sem mudancas no banco de dados**: todos os calculos utilizam campos ja existentes na tabela `leads` (`last_contacted_date`, `next_activity_date`, `next_action_date`, `deal_value`, `probability`, `icp_score`, `last_activity_type`, `content_consumed`, `status`, `created_at`, `updated_at`).
- **Graficos**: usar Recharts (ja instalado) para o pipeline por estagio e gap para meta.
- **Performance**: todos os calculos sao feitos client-side com `useMemo` a partir da lista de leads ja carregada.
- **Interatividade**: cards de alerta e items de lista sao clicaveis, chamando `onCardClick(lead)` para abrir o detalhe do lead.
- **Responsividade**: blocos em grid `grid-cols-1 lg:grid-cols-2` para os blocos maiores; Bloco 1 sempre full-width no topo.

