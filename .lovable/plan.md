

## Portal do Cliente -- Area Logada Dedicada

Criar um portal completo para clientes (`/portal/*`) com dashboard ROI, visibilidade de projetos, upload de documentos e alertas proativos. O portal reutiliza a autenticacao existente mas redireciona automaticamente usuarios do tipo `client` para rotas dedicadas.

---

### 1. Roteamento e Redirecionamento Automatico

Quando um usuario com `user_type = 'client'` faz login, ele sera redirecionado automaticamente para `/portal` em vez de `/`. Usuarios staff que tentarem acessar `/portal` serao redirecionados para `/`.

**Novos arquivos:**
- `src/components/ClientRoute.tsx` -- Guard que verifica se o usuario e do tipo `client`, redireciona staff para `/`
- `src/pages/portal/PortalLayout.tsx` -- Layout dedicado com sidebar simplificada do cliente
- `src/pages/portal/PortalDashboard.tsx` -- Dashboard ROI com metricas de economia
- `src/pages/portal/PortalProjects.tsx` -- Lista de projetos da empresa do cliente
- `src/pages/portal/PortalProjectDetail.tsx` -- Detalhe do projeto com status e data room
- `src/pages/portal/PortalDataRoom.tsx` -- Upload centralizado de documentos

**Arquivos modificados:**
- `src/App.tsx` -- Adicionar rotas `/portal/*`
- `src/hooks/useAuth.tsx` -- Adicionar redirect logic para clientes apos login
- `src/pages/Auth.tsx` -- Redirecionar clientes apos login para `/portal`

---

### 2. Layout do Portal do Cliente

Sidebar simplificada com apenas:
- Dashboard (metricas ROI)
- Meus Projetos (lista de projetos da empresa)
- Documentos (data room centralizado)
- Configuracoes (perfil)

Header com nome da empresa, avatar do usuario e botao "Iniciar Novo Projeto" sempre visivel.

---

### 3. Dashboard ROI (`/portal`)

Cards de metricas:
- **Economia Total Acumulada** -- soma de `estimated_benefit_min` de todos os projetos `ganho`
- **Projetos Ativos** -- contagem de projetos em andamento
- **Projetos Concluidos** -- projetos com todas as 7 fases aprovadas
- **Proximo Prazo** -- data mais proxima de `next_action_date`

Secao de alertas proativos:
- Prazos proximos (projetos com `next_action_date` nos proximos 7 dias)
- Documentos pendentes (fases aguardando upload)
- Oportunidades (projetos elegiveis nao iniciados)

Historico acumulativo com grafico de economia por mes/projeto.

---

### 4. Lista de Projetos (`/portal/projetos`)

Tabela com todos os projetos da empresa mostrando:
- Nome do projeto
- Status traduzido para linguagem do cliente: `Em analise tecnica`, `Aguardando documentos`, `Em revisao`, `Concluido`
- Fase atual (1-7)
- Valor estimado de beneficio
- Data de atualizacao

O mapeamento de status sera:
- `not_started` / `in_progress` -> "Em analise tecnica"
- `review` -> "Em revisao"
- `approved` -> "Concluido" (para a fase atual)
- Quando ha fase pendente de upload -> "Aguardando documentos"

---

### 5. Detalhe do Projeto (`/portal/projetos/:projectId`)

**Visao do cliente (FR-SEC-03):**
- Timeline das 7 fases com status visual (concluido, em andamento, pendente)
- Status claro e amigavel para cada fase
- Download de relatorios finais: somente `phase_outputs` com `version_type = 'human'` (versao aprovada) -- rascunhos IA ficam ocultos
- Data Room do projeto: lista de documentos com upload e download

**Restricao de seguranca:**
- Cliente **nao** ve outputs com `version_type = 'ai'` (WIP/rascunhos)
- Cliente ve apenas a versao final (`human`) de fases `approved`

---

### 6. Upload de Documentos (FR-SEC-02)

O cliente pode fazer upload direto no data room da fase correspondente. O componente de upload:
- Lista as fases do projeto
- Permite selecionar a fase para o upload
- Aceita PDF, XML, XLSX
- Limite de 20MB
- Mostra progresso e confirmacao

---

### 7. Botao "Iniciar Novo Projeto"

Sempre visivel no header do portal. Ao clicar, abre modal simplificado para solicitar um novo projeto:
- Nome do projeto
- Descricao breve
- Tipo de beneficio desejado

Isso cria um registro em `projects` vinculado ao `lead_id` da empresa do cliente com status `novo`.

---

### 8. Migracao de Banco de Dados (RLS)

Atualizar RLS policies para garantir acesso correto dos clientes:

**`project_attachments` -- INSERT para clientes:**
Clientes podem fazer upload em projetos da sua empresa:
```sql
CREATE POLICY "Clients can insert attachments to company projects"
ON public.project_attachments FOR INSERT TO authenticated
WITH CHECK (
  get_user_type(auth.uid()) = 'client'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_attachments.project_id
    AND projects.lead_id = get_user_company_id(auth.uid())
  )
);
```

**`project_attachments` -- SELECT para clientes:**
Clientes podem ver attachments dos projetos da empresa:
```sql
CREATE POLICY "Clients can view company project attachments"
ON public.project_attachments FOR SELECT TO authenticated
USING (
  get_user_type(auth.uid()) = 'client'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_attachments.project_id
    AND projects.lead_id = get_user_company_id(auth.uid())
  )
);
```

**`phase_outputs` -- SELECT para clientes (somente versao final):**
```sql
CREATE POLICY "Clients can view approved final outputs"
ON public.phase_outputs FOR SELECT TO authenticated
USING (
  get_user_type(auth.uid()) = 'client'
  AND version_type = 'human'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = phase_outputs.project_id
    AND projects.lead_id = get_user_company_id(auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM project_phases
    WHERE project_phases.project_id = phase_outputs.project_id
    AND project_phases.phase_number = phase_outputs.phase_number
    AND project_phases.status = 'approved'
  )
);
```

**`project_phases` -- SELECT para clientes:**
```sql
CREATE POLICY "Clients can view company project phases"
ON public.project_phases FOR SELECT TO authenticated
USING (
  get_user_type(auth.uid()) = 'client'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_phases.project_id
    AND projects.lead_id = get_user_company_id(auth.uid())
  )
);
```

**Storage -- `project-files` bucket:**
Adicionar policy para clientes fazerem upload e visualizarem arquivos de projetos da sua empresa:
```sql
CREATE POLICY "Clients can upload project files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND get_user_type(auth.uid()) = 'client'
);

CREATE POLICY "Clients can view company project files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-files'
  AND get_user_type(auth.uid()) = 'client'
);
```

---

### 9. Hooks Dedicados do Portal

- `src/hooks/useClientPortal.ts` -- Hook que busca dados do portal: empresa do cliente (`company_id` do profile), projetos, metricas ROI, alertas
- Reutiliza `useProjects`, `useProjectPhases`, `useProjectAttachments` existentes (RLS ja filtra por empresa)

---

### 10. Fluxo Completo

```text
Login -> Verifica user_type
  |
  +-- staff -> / (Dashboard interno)
  |
  +-- client -> /portal (Dashboard ROI)
         |
         +-- /portal/projetos (Lista projetos)
         |      |
         |      +-- /portal/projetos/:id (Detalhe + Data Room)
         |
         +-- Botao "Novo Projeto" (Modal de solicitacao)
```

---

### Resumo de Arquivos

**Novos (7 arquivos):**
1. `src/components/ClientRoute.tsx`
2. `src/pages/portal/PortalLayout.tsx`
3. `src/pages/portal/PortalDashboard.tsx`
4. `src/pages/portal/PortalProjects.tsx`
5. `src/pages/portal/PortalProjectDetail.tsx`
6. `src/hooks/useClientPortal.ts`
7. `src/pages/portal/NewProjectRequestModal.tsx`

**Modificados (3 arquivos):**
1. `src/App.tsx` -- Rotas do portal
2. `src/components/ProtectedRoute.tsx` -- Redirect de clientes para `/portal`
3. `src/hooks/useProjectAttachments.ts` -- Ajustar storage path para clientes

**Migracao SQL:**
- 5 novas RLS policies (project_attachments INSERT/SELECT, phase_outputs SELECT, project_phases SELECT, storage INSERT/SELECT)
