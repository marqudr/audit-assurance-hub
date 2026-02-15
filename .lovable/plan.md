

# Enriquecimento do Pipeline CRM -- Atribuicao, Qualificacao, Velocidade e Projecao

## Resumo

Adicionar 4 blocos de informacoes estrategicas ao pipeline de leads: Atribuicao e Origem, Qualificacao e Fit, Velocidade e Saude do Pipeline, e Projecao de Receita. Isso envolve novas colunas no banco, novos componentes de UI no LeadDetailSheet e indicadores visuais no KanbanCard.

---

## Etapa 1 -- Banco de Dados

Adicionar as seguintes colunas na tabela `leads`:

**Atribuicao e Origem:**
- `source_medium` (text) -- Canal/meio detalhado (ex: "Google Ads / CPC Fundo de Funil")
- `first_touch_channel` (text) -- Canal do primeiro toque
- `last_touch_channel` (text) -- Canal que converteu
- `estimated_cac` (numeric) -- Custo de aquisicao estimado

**Qualificacao e Fit:**
- `icp_score` (integer) -- Score de 0 a 10 de fit com ICP
- `qualification_method` (text) -- BANT, ANUM, etc.
- `has_budget` (boolean, default false) -- Tem orcamento
- `has_authority` (boolean, default false) -- Tem autoridade
- `has_need` (boolean, default false) -- Tem necessidade
- `has_timeline` (boolean, default false) -- Tem urgencia
- `pain_points` (text) -- Dores identificadas (texto livre)

**Velocidade e Saude:**
- `next_action` (text) -- Proximo passo claro
- `next_action_date` (timestamptz) -- Data do proximo passo
- `content_consumed` (text) -- Materiais consumidos pelo prospect

**Projecao de Receita:**
- `estimated_ltv` (numeric) -- Valor estimado do cliente em 2-3 anos
- `expected_close_date` (date) -- Data prevista de fechamento

Nota: `probability`, `deal_value` e `time_in_stage` (calculado via `updated_at`) ja existem no schema.

---

## Etapa 2 -- Atualizar Tipos e Hooks

### 2.1 `useLeads.ts`
- Adicionar os novos campos ao tipo `Lead`
- Incluir os novos campos no `useCreateLead` e `useUpdateLead`

---

## Etapa 3 -- UI no LeadDetailSheet

Reorganizar o drawer de detalhes em secoes com Accordion ou abas internas:

### 3.1 Secao "Atribuicao e Origem"
- Campos: Source/Medium, Primeiro Toque, Ultimo Toque, CAC Estimado
- Exibicao em grid 2 colunas, editavel no modo edicao

### 3.2 Secao "Qualificacao e Fit"
- ICP Score com slider visual (0-10) e cor semantica
- BANT com 4 checkboxes (Budget, Authority, Need, Timeline) e badge resumo
- Pain Points como textarea
- Metodo de qualificacao como select (BANT, ANUM, MEDDIC, SPIN)

### 3.3 Secao "Velocidade e Saude"
- Time in Stage: calculado automaticamente a partir de `updated_at`, exibido em dias com cor (verde < 7d, amarelo 7-14d, vermelho > 14d)
- Next Action: campo de texto + data
- Alerta visual se nao houver proximo passo definido (badge "Zumbi")
- Content Consumed: campo de texto

### 3.4 Secao "Projecao de Receita"
- LTV Estimado: campo monetario
- Probabilidade: slider 0-100% (ja existe no schema)
- Valor do Negocio: campo monetario (ja existe no schema)
- Data de Fechamento Esperada: date picker

---

## Etapa 4 -- Indicadores no KanbanCard

Enriquecer o card do Kanban com:

- Badge de ICP Score (cor semantica: vermelho 0-3, amarelo 4-6, verde 7-10)
- Indicador de "Time in Stage" em dias (com cor)
- Badge "Zumbi" se nao houver next_action definido
- Badge BANT mostrando quantos criterios atendidos (ex: "BANT 3/4")

---

## Detalhes Tecnicos

```text
Arquivos modificados:
  supabase/migrations/   -- nova migration com ALTER TABLE leads ADD COLUMN
  src/hooks/useLeads.ts  -- tipos e mutations atualizados
  src/components/crm/
    LeadDetailSheet.tsx   -- 4 novas secoes com campos editaveis
    KanbanCard.tsx        -- badges e indicadores adicionais
    NewLeadModal.tsx      -- campos opcionais de origem e qualificacao

Campos calculados (sem coluna no banco):
  - time_in_stage: diferenca em dias entre now() e updated_at
  - bant_score: contagem de has_budget + has_authority + has_need + has_timeline
```

**Formatacao monetaria**: Reutilizar `formatBRL` e `parseBRL` ja existentes no `NewLeadModal.tsx`.

**ICP Score**: Slider do Radix (ja instalado) com labels 0-10.

**Date picker**: Componente Calendar ja disponivel via `react-day-picker`.

**Time in Stage**: Calculado no frontend com `date-fns` (ja instalado) usando `differenceInDays(new Date(), new Date(lead.updated_at))`.

