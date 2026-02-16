

## Reorganizar Dashboard em 3 Seções

Agrupar os componentes existentes do Dashboard em 3 seções visuais com cabeçalhos de separação, redistribuindo os cards e gráficos de forma lógica.

### Estrutura das Seções

```text
┌──────────────────────────────────────────────┐
│ RECEITA & FINANCEIRO                         │
│  - Economia Total sob Gestão (YTD)           │
│  - Glosa Histórica Estimada                  │
│  - Taxa de Aprovação (FPY)                   │
│  - Throughput por Consultor                  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ FUNIL DE VENDAS                              │
│  - MQLs, Conversão, Ciclo Médio, Propostas   │
│  - Gráfico de Funil                          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ OPERAÇÕES                                    │
│  - Pipeline de 7 Fases + Risco de SLA        │
│  - Volumetria por Fase + Saúde do Pipeline   │
└──────────────────────────────────────────────┘
```

### Mudanças

#### `src/pages/Dashboard.tsx`

Reorganizar o layout adicionando 3 blocos com cabeçalho de seção (titulo + descrição curta) separados por `Separator`:

1. **Seção "Receita e Financeiro"**: Mantém o `NorthStarKPIs` como está (4 cards de KPIs financeiros)
2. **Seção "Funil de Vendas"**: Mantém o `SalesFunnel` como está (mini-cards + gráfico de funil)
3. **Seção "Operações"**: Agrupa `OperationsPipeline` e `DeliveryHealth` dentro da mesma seção, empilhados verticalmente

Cada seção terá:
- Um cabeçalho com título (`text-lg font-semibold`) e descrição (`text-sm text-muted-foreground`)
- Visual sutil de separação entre seções usando `Separator` ou espaçamento aumentado

Nenhum componente filho será modificado -- apenas a composição e ordem na página principal.

### Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `src/pages/Dashboard.tsx` |

