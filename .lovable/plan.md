

## Plano: Modulo Operations - Service Delivery (Pipeline Operacional)

Este plano transforma a pagina Operations (atualmente um placeholder) em um modulo completo de Service Delivery com pipeline de 7 fases, Data Room, execucao de agentes por fase e Split View Editor.

---

### Visao Geral da Arquitetura

O modulo sera centrado em um **projeto** (ja existente na tabela `projects`). Quando um projeto atinge o status "ganho" no CRM, ele se torna elegivel para o pipeline operacional. A rota `/operations` mostrara uma lista de projetos ativos, e `/operations/:projectId` sera o workspace de execucao.

---

### 1. Alteracoes no Banco de Dados

**Nova tabela: `project_phases`**
Controla o status de cada fase por projeto:

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | |
| project_id | uuid (FK projects) | |
| phase_number | int (1-7) | Numero da fase |
| phase_name | text | Nome da fase |
| status | text | `not_started`, `in_progress`, `review`, `approved` |
| approved_by | uuid (nullable) | Quem aprovou |
| approved_at | timestamptz (nullable) | Quando foi aprovado |
| agent_id | uuid (nullable, FK agents) | Agente vinculado a fase |
| created_at / updated_at | timestamptz | |

RLS: somente o dono do projeto (via join em `projects.user_id`) ou admin pode ler/editar.

**Nova tabela: `phase_outputs`**
Armazena versoes de documentos gerados por fase:

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | |
| project_id | uuid (FK) | |
| phase_number | int | |
| version_type | text | `ai` ou `human` |
| content | text | Conteudo do rascunho/narrativa |
| created_by | uuid | |
| created_at | timestamptz | |

RLS: via join em `projects.user_id`.

**Nova tabela: `phase_executions`**
Log de execucoes de agentes por fase:

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | |
| project_id | uuid (FK) | |
| phase_number | int | |
| agent_id | uuid (FK agents) | |
| status | text | `running`, `completed`, `failed` |
| started_at | timestamptz | |
| completed_at | timestamptz (nullable) | |

RLS: via join em `projects.user_id`.

**Alteracao na tabela `project_attachments`:**
Adicionar coluna `category` (text, nullable) para categorizar documentos no Data Room (ex: "balanco", "folha_pagamento", "contrato", "nota_fiscal", "relatorio_tecnico", "outro").
Adicionar coluna `version` (int, default 1) para versionamento de arquivos.

A coluna `phase` existente sera reaproveitada, mas os valores mudarao para corresponder as 7 fases operacionais (1-7 como texto ou mantendo o enum existente extendido).

---

### 2. Rotas e Navegacao

- `/operations` - Lista de projetos com status "ganho" prontos para execucao
- `/operations/:projectId` - Workspace do projeto selecionado

No `App.tsx`, adicionar a rota parametrizada. A sidebar ja aponta para `/operations`.

---

### 3. Pagina Operations (Lista de Projetos)

Nova versao de `src/pages/Operations.tsx`:
- Busca projetos com status "ganho" (ou que ja tenham fases criadas)
- Exibe cards com: nome do projeto, empresa, fase atual, progresso geral (X/7 fases aprovadas)
- Botao "Iniciar Pipeline" para projetos sem fases (cria as 7 fases com status `not_started`, a primeira como `in_progress`)
- Click no card navega para `/operations/:projectId`

---

### 4. Workspace do Projeto (`/operations/:projectId`)

Nova pagina `src/pages/OperationsWorkspace.tsx` com 3 areas:

**4.1 Timeline de Fases (topo)**
Barra horizontal com as 7 fases, cada uma com indicador visual de status:
- Circulo vazio = Nao iniciado
- Relogio = Em progresso
- Olho = Aguardando revisao
- Check verde = Aprovado

Click em uma fase a seleciona como fase ativa.

**4.2 Area Principal (Split View - 75% da largura)**

Layout resizable com dois paineis usando `react-resizable-panels`:

- **Painel Esquerdo (Evidencias/Data Room):**
  - Lista de anexos do projeto filtrados pela fase ativa
  - Upload de novos arquivos (PDF, XML, XLSX) com categoria
  - Preview basico do arquivo selecionado (nome, tamanho, data)
  - Botao de download

- **Painel Direito (Editor/Output):**
  - Tabs: "Versao IA" e "Versao Final"
  - Textarea editavel para a versao humana
  - Conteudo gerado pelo agente na tab "Versao IA" (somente leitura)
  - Botao "Salvar Versao" para persistir o conteudo

**4.3 Sidebar do Agente (25% da largura)**
- Mostra o agente vinculado a fase (se houver)
- Select para vincular/trocar agente (lista agentes ativos)
- Botao "Executar Agente" que inicia uma execucao
- Status da ultima execucao
- Mini-chat para interacao com o agente (reutilizando a logica de streaming do `agent-chat`)
- Botao **"Aprovar Fase"** (restrito a admins ou dono do projeto) que:
  - Muda o status da fase atual para `approved`
  - Registra `approved_by` e `approved_at`
  - Avanca a proxima fase para `in_progress`

---

### 5. Componentes Novos

```text
src/pages/Operations.tsx          -- Lista de projetos operacionais
src/pages/OperationsWorkspace.tsx  -- Workspace com timeline + split view
src/components/operations/
  PhaseTimeline.tsx                -- Barra de fases com status visual
  DataRoomPanel.tsx                -- Painel esquerdo (upload + lista de arquivos)
  EditorPanel.tsx                  -- Painel direito (tabs IA/Human + textarea)
  AgentSidebar.tsx                 -- Sidebar com agente, execucao e aprovacao
  ProjectCard.tsx                  -- Card de projeto na lista
```

---

### 6. Hooks Novos

```text
src/hooks/useProjectPhases.ts     -- CRUD de project_phases
src/hooks/usePhaseOutputs.ts      -- CRUD de phase_outputs (versoes)
src/hooks/usePhaseExecutions.ts   -- Log de execucoes de agentes
```

---

### 7. Logica de Gatekeeping

- O botao "Aprovar Fase" so fica habilitado se:
  - A fase esta em status `in_progress` ou `review`
  - O usuario e admin ou dono do projeto
- Ao aprovar, a fase muda para `approved` e a proxima fase muda para `in_progress`
- Fases anteriores ficam como "memoria cumulativa" -- o painel de evidencias permite navegar outputs aprovados de fases anteriores

---

### 8. Execucao de Agentes

- O botao "Executar Agente" chama a edge function `agent-chat` existente, passando:
  - O system prompt do agente vinculado
  - Contexto da fase (outputs aprovados de fases anteriores + lista de arquivos do Data Room)
- A resposta streamed e exibida na tab "Versao IA" do editor
- Um registro e criado em `phase_executions` para auditoria

---

### 9. Sequencia de Implementacao

1. Migracao de banco de dados (tabelas + RLS + categorias)
2. Hooks de dados (`useProjectPhases`, `usePhaseOutputs`, `usePhaseExecutions`)
3. Pagina de lista de projetos operacionais (`Operations.tsx`)
4. Rota `/operations/:projectId` no `App.tsx`
5. Componente `PhaseTimeline`
6. Componente `DataRoomPanel` (reutilizando `useProjectAttachments` com filtro por fase e categoria)
7. Componente `EditorPanel` com tabs e versionamento
8. Componente `AgentSidebar` com execucao e aprovacao
9. Pagina `OperationsWorkspace` integrando tudo
10. Testes de fluxo completo

---

### 10. Notas Tecnicas

- As 7 fases com nomes em portugues: Elegibilidade, Diagnostico Tecnico, Rastreabilidade, Memoria de Calculo, Engenharia de Narrativa, Stress Test, Transmissao
- O bucket `project-files` ja existe e sera reutilizado
- O versionamento de arquivos sera controlado pela coluna `version` em `project_attachments` (ao re-upload com mesmo nome, incrementa versao)
- Citacoes no editor (hyperlinks para documentos) serao implementadas como links `[doc:attachment_id]` no conteudo, renderizados como links clicaveis

