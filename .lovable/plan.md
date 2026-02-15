

# Pipeline Kanban do CRM

## Resumo
Adicionar uma visualizacao Kanban ao CRM com 5 colunas de pipeline, drag & drop entre fases, checklist obrigatorio por fase (gate de qualificacao) e indicadores visuais de valor e probabilidade. A pagina CRM tera abas para alternar entre a visao Tabela (atual) e a visao Kanban (nova).

---

## Etapa 1 -- Banco de Dados

### 1.1 Expandir o enum `lead_status`
O enum atual possui 4 valores (`novo`, `qualificado`, `proposta`, `ganho`). Sera expandido para 5 fases do pipeline:

- `prospeccao` (substitui `novo`)
- `qualificacao` (substitui `qualificado`)
- `diagnostico` (novo)
- `proposta` (mantido)
- `fechamento` (substitui `ganho`)

Migration: adicionar os novos valores ao enum, migrar dados existentes e remover os antigos.

### 1.2 Nova tabela `lead_checklist_items`
Armazena os itens de checklist completados por lead, por fase.

Colunas:
- `id` (uuid, PK)
- `lead_id` (uuid, FK para leads)
- `phase` (lead_status -- a fase a que pertence)
- `item_key` (text -- identificador do item, ex: "contato_decisor")
- `completed` (boolean, default false)
- `completed_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())

RLS: mesmas regras dos leads (usuario ve/edita apenas seus leads).

### 1.3 Adicionar colunas na tabela `leads`
- `probability` (integer, nullable, default null) -- probabilidade de fechamento (0-100%)
- `deal_value` (numeric, nullable, default null) -- valor estimado do negocio

---

## Etapa 2 -- Componentes do Kanban

### 2.1 Abas na pagina CRM (`CRM.tsx`)
Adicionar componente Tabs com duas abas abaixo das metricas:
- "Tabela" -- exibe a tabela atual
- "Pipeline" -- exibe o board Kanban

### 2.2 Componente `KanbanBoard.tsx`
Board com 5 colunas lado a lado, scroll horizontal em telas menores:

```text
+---------------+---------------+---------------+---------------+---------------+
| Prospeccao    | Qualificacao  | Diagnostico   | Proposta      | Fechamento    |
| (3 leads)     | (2 leads)     | (1 lead)      | (2 leads)     | (1 lead)      |
|               |               |               |               |               |
| [Card Lead]   | [Card Lead]   | [Card Lead]   | [Card Lead]   | [Card Lead]   |
| [Card Lead]   | [Card Lead]   |               | [Card Lead]   |               |
| [Card Lead]   |               |               |               |               |
+---------------+---------------+---------------+---------------+---------------+
```

Cada coluna mostra:
- Nome da fase com badge de contagem
- Barra de cor no topo (azul, amarelo, laranja, roxo, verde)
- Soma do valor dos deals na coluna

### 2.3 Componente `KanbanCard.tsx`
Card compacto mostrando:
- Nome da empresa (titulo)
- CNPJ formatado (subtitulo)
- Indicador de valor (ex: "R$ 1,2M") com icone DollarSign
- Barra de probabilidade (Progress bar colorida: vermelho < 30%, amarelo 30-60%, verde > 60%)
- Indicador de checklist (ex: "3/5" com icone CheckSquare)
- Clique abre o LeadDetailSheet

### 2.4 Drag & Drop
Implementacao usando HTML5 Drag & Drop nativo (sem dependencias extras):
- `onDragStart` no card: define o lead ID no dataTransfer
- `onDragOver` na coluna: permite drop com visual de destaque
- `onDrop` na coluna: verifica o checklist gate antes de mover

### 2.5 Gate de Qualificacao (Checklist)
Ao tentar mover um card para a proxima fase, o sistema verifica se todos os itens obrigatorios da fase atual foram completados. Se nao, exibe um toast de erro informando os itens pendentes.

Itens por fase (definidos no frontend como constante):

**Prospeccao:**
- Contato decisor identificado
- CNPJ validado
- Setor confirmado

**Qualificacao:**
- Regime tributario definido
- Faixa de receita preenchida
- Reuniao de qualificacao realizada

**Diagnostico:**
- Headcount de engenharia informado
- Orcamento de P&D preenchido
- Simulacao fiscal executada

**Proposta:**
- Proposta comercial enviada
- Retorno do cliente registrado

**Fechamento:**
- Contrato assinado
- Kickoff agendado

### 2.6 Checklist na LeadDetailSheet
Adicionar uma nova secao "Checklist da Fase" no drawer de detalhes, exibindo os itens da fase atual com checkboxes interativos. Ao marcar/desmarcar, persiste no banco.

---

## Etapa 3 -- Hooks e Logica

### 3.1 Atualizar `useLeads.ts`
- Expandir o tipo `LeadStatus` com os novos valores
- Atualizar o `statusConfig` em todos os componentes

### 3.2 Novo hook `useLeadChecklist.ts`
- `useLeadChecklist(leadId)`: busca itens de checklist do lead
- `useToggleChecklistItem()`: mutation para marcar/desmarcar item
- `useCheckPhaseGate(leadId, phase)`: verifica se todos os itens obrigatorios da fase estao completos

---

## Detalhes Tecnicos

```text
src/
  components/
    crm/
      KanbanBoard.tsx        -- board com 5 colunas + drag & drop
      KanbanCard.tsx          -- card compacto com indicadores
      KanbanColumn.tsx        -- coluna individual do board
      PhaseChecklist.tsx      -- checklist interativo no drawer
  hooks/
    useLeadChecklist.ts       -- CRUD de checklist items
  pages/
    CRM.tsx                   -- adiciona Tabs (Tabela | Pipeline)
```

**Drag & Drop**: HTML5 nativo, sem bibliotecas externas. Visual feedback com borda tracejada azul na coluna alvo.

**Cores das colunas**:
- Prospeccao: azul (blue-500)
- Qualificacao: amarelo (yellow-500)
- Diagnostico: laranja (orange-500)
- Proposta: roxo (purple-500)
- Fechamento: verde (green-500)

**Probabilidade**: exibida como barra de progresso no card com cores semanticas.

**Migration SQL**: usara `ALTER TYPE lead_status ADD VALUE` para adicionar novos valores, seguido de `UPDATE leads SET status = 'prospeccao' WHERE status = 'novo'` para migrar dados existentes. Os valores antigos nao serao removidos do enum (Postgres nao permite remover valores de enum facilmente), mas nao serao exibidos na UI.

