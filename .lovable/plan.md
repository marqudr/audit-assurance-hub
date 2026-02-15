

# Fase Pos-Fechamento: Ganho e Perdido

## Objetivo
Apos a fase de Fechamento, o lead pode ter dois destinos:
- **Ganho**: o deal foi convertido e deve iniciar o processo de operacoes.
- **Perdido**: o deal nao foi convertido, mas a empresa permanece na base com todo o historico preservado.

## Mudancas Necessarias

### 1. Banco de Dados
- Adicionar o valor `perdido` ao enum `lead_status` (o valor `ganho` ja existe no enum).
- Alterar o default do status de `'novo'` para `'prospeccao'` para alinhar com o pipeline atual.

### 2. Tipos e Hooks (`src/hooks/useLeads.ts`)
- Adicionar `"perdido"` ao tipo `LeadStatus`.

### 3. Kanban Board (`src/components/crm/KanbanBoard.tsx`)
- Adicionar duas colunas apos Fechamento:
  - **Ganho** (cor verde, icone de sucesso)
  - **Perdido** (cor vermelha/cinza)
- Leads nessas colunas nao sao contados como "ativos" nas metricas.
- A movimentacao para Ganho continua respeitando o checklist gate do Fechamento.

### 4. Kanban Card (`src/components/crm/KanbanCard.tsx`)
- Estilo visual diferenciado para leads ganhos (destaque verde) e perdidos (opacidade reduzida / cinza).

### 5. Lead Detail Sheet (`src/components/crm/LeadDetailSheet.tsx`)
- Adicionar configs de status para `perdido` no `statusConfig`.
- Quando o lead estiver em "Ganho", exibir um link ou indicacao para iniciar o processo de Operacoes.
- Quando o lead estiver em "Perdido", exibir um campo de "Motivo da Perda" (pode reutilizar o campo `objection`).

### 6. Pagina CRM (`src/pages/CRM.tsx`)
- Atualizar `statusConfig` para incluir `perdido`.
- Ajustar a metrica de "Leads Ativos" para excluir leads com status `ganho` e `perdido`.

### 7. Fluxo de Transicao
- Do Fechamento, o usuario pode arrastar para **Ganho** ou **Perdido**.
- De Perdido, o lead pode ser reativado (arrastado de volta para qualquer fase anterior).
- De Ganho, o lead fica fixo (nao pode retroceder no pipeline).

## Detalhes Tecnicos

**Migration SQL:**
```sql
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'perdido';
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'prospeccao';
```

**Arquivos modificados:**
- `src/hooks/useLeads.ts` - tipo LeadStatus
- `src/components/crm/KanbanBoard.tsx` - novas colunas + logica de gate
- `src/components/crm/KanbanCard.tsx` - estilos para ganho/perdido
- `src/components/crm/LeadDetailSheet.tsx` - statusConfig + UX pos-fechamento
- `src/pages/CRM.tsx` - statusConfig + metricas ajustadas

