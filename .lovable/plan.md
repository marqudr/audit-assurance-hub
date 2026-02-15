
# Arquitetura 1:N - Empresas e Projetos no CRM

## Visao Geral

Refatorar o CRM para separar a entidade **Empresa** (conta/account) da entidade **Projeto** (oportunidade/opportunity), criando uma relacao 1:N onde uma Empresa pode ter multiplos Projetos. O pipeline de vendas passara a rastrear Projetos, nao Empresas.

## Mudancas no Banco de Dados

### 1. Nova tabela `projects`

Campos do projeto (oportunidade):
- `id` UUID (PK)
- `lead_id` UUID (FK para leads, NOT NULL, ON DELETE CASCADE)
- `user_id` UUID (NOT NULL)
- `name` TEXT (NOT NULL) - Nome do Projeto
- `description` TEXT - Descricao do Projeto
- `status` lead_status (default 'prospeccao') - Status do pipeline (movido do lead)
- `deal_value` NUMERIC
- `probability` INTEGER
- `expected_close_date` DATE
- `estimated_benefit_min` / `estimated_benefit_max` NUMERIC
- `engineering_headcount` INTEGER
- `rd_annual_budget` NUMERIC
- `icp_score` INTEGER
- `has_budget` / `has_authority` / `has_need` / `has_timeline` BOOLEAN
- `pain_points` / `context` / `objection` TEXT
- `qualification_method` TEXT
- `next_action` / `next_action_date` TEXT/TIMESTAMP
- `last_contacted_date` / `last_activity_type` / `next_activity_date` TIMESTAMP/TEXT
- `content_consumed` TEXT
- `estimated_ltv` NUMERIC
- `source_medium` / `first_touch_channel` / `last_touch_channel` TEXT
- `estimated_cac` NUMERIC
- `created_at` / `updated_at` TIMESTAMPS

### 2. Nova tabela `project_attachments`

- `id` UUID (PK)
- `project_id` UUID (FK para projects, ON DELETE CASCADE)
- `user_id` UUID (NOT NULL)
- `file_name` TEXT (NOT NULL)
- `file_size` BIGINT
- `storage_path` TEXT (NOT NULL)
- `phase` lead_status - Fase do funil em que o arquivo foi anexado
- `created_at` TIMESTAMP

### 3. Storage bucket `project-files`

Bucket privado para armazenar os anexos dos projetos.

### 4. Simplificacao da tabela `leads`

A tabela `leads` mantera apenas dados da **Empresa**:
- Campos que permanecem: `id`, `user_id`, `company_name`, `cnpj`, `cnae`, `sector`, `revenue_range`, endereco, regimes tributarios, `created_at`, `updated_at`
- Campos que migram para `projects`: `status`, `deal_value`, `probability`, `expected_close_date`, ICP, BANT, qualificacao, velocidade, interacao, receita, atribuicao, simulacao fiscal

**IMPORTANTE**: Nao vamos deletar colunas da tabela leads nesta fase. Vamos apenas criar a nova estrutura e migrar a logica. A limpeza das colunas legadas sera feita em uma fase posterior, apos validacao.

### 5. Migrar `lead_checklist_items`

Adicionar coluna `project_id` (FK para projects) a tabela existente, tornando-a a referencia principal no lugar de `lead_id`.

### 6. RLS Policies

- `projects`: CRUD restrito a `user_id = auth.uid()`, SELECT com admin via `has_role`
- `project_attachments`: CRUD via join com projects.user_id
- Storage policies para o bucket `project-files`

### 7. Integridade Referencial

- `projects.lead_id` ON DELETE CASCADE: ao deletar Empresa, todos os Projetos sao removidos
- `project_attachments.project_id` ON DELETE CASCADE: ao deletar Projeto, anexos sao removidos
- Deletar um Projeto NAO afeta a Empresa

## Mudancas no Frontend

### Hooks Novos

**`src/hooks/useProjects.ts`**
- `useProjects(leadId?)` - Lista projetos (todos ou filtrados por empresa)
- `useProject(projectId)` - Detalhe de um projeto
- `useCreateProject()` - Criar projeto vinculado a uma empresa
- `useUpdateProject()` - Atualizar projeto
- `useDeleteProject()` - Deletar projeto

**`src/hooks/useProjectAttachments.ts`**
- `useProjectAttachments(projectId)` - Lista anexos de um projeto
- `useCompanyAttachments(leadId)` - Rollup de todos os anexos de todos os projetos de uma empresa
- `useUploadAttachment()` - Upload de arquivo
- `useDeleteAttachment()` - Remover arquivo

### Refatoracao de Componentes

**Pipeline/Kanban** - Agora rastreia Projetos:
- `KanbanBoard.tsx`: recebe `projects` em vez de `leads`. Cards exibem nome do projeto + nome da empresa
- `KanbanCard.tsx`: refatorado para exibir dados do projeto (nome, empresa, deal_value, probabilidade, checklist)
- `KanbanColumn.tsx`: mesma estrutura, dados de projetos

**Detalhes** - Dois niveis:
- `LeadDetailSheet.tsx` (Empresa): Dados cadastrais, contatos, lista de projetos vinculados, visao consolidada de anexos (rollup)
- `ProjectDetailSheet.tsx` (novo): Pipeline status, qualificacao, BANT, simulacao fiscal, checklist, velocidade, anexos do projeto, historico de interacoes

**Modais**:
- `NewLeadModal.tsx`: Mantem apenas campos da empresa (CNPJ, razao social, endereco, regimes). Opcao de criar primeiro projeto junto
- `NewProjectModal.tsx` (novo): Criacao de projeto vinculado a uma empresa existente (nome, descricao, deal_value inicial)

**Dashboard CRM**:
- `CrmActionAlerts.tsx`: Alertas baseados em projetos (sem contato, atrasados, parados)
- `CrmPipelineMetrics.tsx`: Pipeline baseado em projetos
- `CrmEnergyMetrics.tsx`: Top projetos por ICP, conversao, idade media
- `CrmRecentActivity.tsx`: Interacoes baseadas em projetos

**Tabela CRM**:
- Adicionar coluna "Empresa" e exibir projetos na tabela, agrupados ou com referencia a empresa

**Anexos**:
- `ProjectAttachments.tsx` (novo): Componente de upload/listagem de anexos dentro do detalhe do projeto
- `CompanyAttachmentsRollup.tsx` (novo): Visao consolidada na empresa, mostrando todos os arquivos de todos os projetos

### Pagina CRM (`src/pages/CRM.tsx`)

- Metricas calculadas sobre projetos (nao leads)
- Pipeline Kanban opera sobre projetos
- Tabela lista projetos com coluna de empresa
- Click em card abre `ProjectDetailSheet`
- Possibilidade de navegar do projeto para a empresa

## Estrategia de Migracao de Dados

A migracao SQL criara um projeto para cada lead existente que tenha status de pipeline ativo, copiando os campos relevantes. Leads sem atividade de pipeline manterao apenas dados de empresa.

```text
Para cada lead existente:
  1. Criar um projeto com os campos de pipeline/qualificacao/receita
  2. Migrar checklist_items para referenciar o novo project_id
  3. Manter o lead com dados de empresa apenas
```

## Sequencia de Implementacao

1. Migracoes SQL (tabelas, bucket, RLS, migracao de dados)
2. Tipos TypeScript e hooks (`useProjects`, `useProjectAttachments`)
3. Componentes novos (`ProjectDetailSheet`, `NewProjectModal`, `ProjectAttachments`, `CompanyAttachmentsRollup`)
4. Refatorar componentes existentes (Kanban, Dashboard, CRM page, LeadDetailSheet)
5. Ajustar alertas, metricas e atividade recente para usar projetos

## Detalhes Tecnicos

- **Storage**: Bucket privado `project-files` com paths `{user_id}/{project_id}/{filename}`
- **Rollup de anexos**: Query via join `project_attachments JOIN projects ON project_id WHERE projects.lead_id = ?`
- **Cascata**: `ON DELETE CASCADE` garante integridade. Deleção de empresa remove projetos e anexos. Deleção de projeto remove apenas seus anexos
- **Compatibilidade**: Colunas legadas no `leads` nao serao removidas nesta fase, evitando quebras
- **Performance**: Projetos carregados com `lead_id` como filtro quando necessario; anexos carregados sob demanda
