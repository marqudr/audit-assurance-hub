

## Plano: ICP Score por Elegibilidade + Filtro de Merito Tecnologico (Frascati)

### Resumo

O ICP Score deixara de ser um slider manual e passara a ser calculado automaticamente com base em 4 criterios de elegibilidade da empresa (Lei do Bem). Na fase de Qualificacao, o projeto precisara passar por um filtro baseado nos 5 pilares do Manual de Frascati. Ambos serao apresentados visualmente com checkboxes e score calculado.

---

### 1. Alteracoes no Banco de Dados

**Tabela `leads`** -- adicionar 2 campos booleanos (o regime tributario ja existe como `tax_regime`, e investimento em P&D pode ser derivado de `rd_annual_budget`):

- `has_lucro_fiscal` (boolean, default false) -- Resultado Fiscal positivo no ano-base
- `has_regularidade_fiscal` (boolean, default false) -- CND ou CPEND ativa

**Tabela `projects`** -- adicionar 5 campos booleanos para os pilares de Frascati:

- `frascati_novidade` (boolean, default false)
- `frascati_criatividade` (boolean, default false)
- `frascati_incerteza` (boolean, default false)
- `frascati_sistematicidade` (boolean, default false)
- `frascati_transferibilidade` (boolean, default false)

### 2. Calculo Automatico do ICP Score (Prospeccao)

O ICP Score sera calculado no frontend com base em 4 criterios, cada um valendo 2,5 pontos (total maximo = 10):

| Criterio | Fonte | Pontos |
|---|---|---|
| Regime Tributario = Lucro Real | `leads.tax_regime` | 2,5 |
| Resultado Fiscal positivo | `leads.has_lucro_fiscal` | 2,5 |
| Regularidade Fiscal (CND/CPEND) | `leads.has_regularidade_fiscal` | 2,5 |
| Investimento em P&D comprovado | `leads.rd_annual_budget > 0` | 2,5 |

- O slider manual de ICP Score sera substituido por checkboxes em modo edicao
- O score sera exibido como badge colorida (0-5 vermelho, 5-7.5 amarelo, 7.5-10 verde)
- O calculo acontecera no momento do save e sera persistido em `leads.icp_score` (e propagado para `projects.icp_score`)

### 3. Filtro de Merito Tecnologico (Qualificacao)

Na secao de Qualificacao do ProjectDetailSheet, uma nova sub-secao "Merito Tecnologico (Frascati)" exibira 5 checkboxes:

- Novidade: "O projeto visa resultados novos para a empresa ou mercado"
- Criatividade: "Baseia-se em conceitos originais e nao obvios"
- Incerteza: "Ha duvida se o resultado e alcancavel com o conhecimento atual"
- Sistematicidade: "Possui planejamento, orcamento, metodologia e registros"
- Transferibilidade: "O conhecimento gerado pode ser codificado e transferido"

Score Frascati exibido como "X/5" com badge colorida. Este filtro sera visivel tanto em modo leitura quanto edicao.

### 4. Arquivos Modificados

- **Migracao SQL**: Adicionar colunas nas tabelas `leads` e `projects`
- **`src/hooks/useLeads.ts`**: Adicionar campos `has_lucro_fiscal`, `has_regularidade_fiscal` ao tipo Lead
- **`src/hooks/useProjects.ts`**: Adicionar campos `frascati_*` ao tipo Project
- **`src/components/crm/LeadDetailSheet.tsx`**: Substituir slider ICP por checkboxes de elegibilidade com calculo automatico
- **`src/components/crm/ProjectDetailSheet.tsx`**:
  - Substituir slider ICP por exibicao do score calculado da empresa
  - Adicionar secao "Merito Tecnologico" com checkboxes Frascati na area de Qualificacao
  - Salvar campos `frascati_*` no handleSaveEdit
- **`src/hooks/useLeadChecklist.ts`**: Atualizar checklist de prospeccao para incluir item "ICP Score >= 7,5" e checklist de qualificacao para incluir "Filtro Frascati completo (5/5)"

### 5. Experiencia do Usuario

- Ao abrir a ficha da empresa, o consultor ve os 4 criterios de elegibilidade com checkboxes
- O ICP Score e recalculado automaticamente ao marcar/desmarcar criterios
- Na ficha do projeto (fase Qualificacao), o consultor avalia os 5 pilares de Frascati
- O pipeline so permite avancar de Prospeccao se ICP >= 7,5 (via checklist gate)
- O pipeline so permite avancar de Qualificacao se Frascati = 5/5 (via checklist gate)

