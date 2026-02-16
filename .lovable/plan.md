
## Tela de Detalhe do Projeto na Empresa + Separacao de Data Rooms

### Problema Atual
- Ao clicar em um projeto na aba "Projetos" da empresa, abre o `ProjectDetailSheet` (gaveta lateral do CRM) que nao mostra documentacoes produzidas na fase operacional.
- O Data Room da empresa mostra todos os documentos sem distinção entre CRM e operacoes.

### Mudancas Propostas

#### 1. Nova Pagina de Detalhe do Projeto (`/empresas/:leadId/projetos/:projectId`)

Criar uma pagina dedicada que substitui a abertura do Sheet lateral. Ao clicar em um projeto na aba "Projetos" da empresa, o usuario navega para esta pagina completa com as seguintes secoes em tabs:

- **Visao Geral**: Dados do projeto (nome, status, descricao, Frascati score, valor, probabilidade, datas)
- **Pipeline Operacional**: Mostrar as 7 fases operacionais com status de cada uma, conteudo produzido (versao IA e versao final) de `phase_outputs`
- **Data Room do Projeto**: Documentos anexados durante a fase de operacao (arquivos do `project_attachments` sem fase CRM + outputs gerados como documentos)

#### 2. Separar Data Room da Empresa (somente CRM)

Alterar `CompanyDataRoom` para filtrar apenas documentos com `phase` preenchido (valores do enum `lead_status`: prospeccao, qualificacao, diagnostico, proposta, fechamento, ganho, perdido). Estes sao os documentos anexados durante o funil de vendas.

#### 3. Data Room do Projeto (somente Operacoes)

Na nova pagina de detalhe do projeto, o Data Room exibira:
- Documentos do `project_attachments` que **nao** possuem fase CRM (phase IS NULL) -- sao os uploads feitos no workspace operacional
- Documentos produzidos em `phase_outputs` (versao final de cada fase operacional)

---

### Detalhes Tecnicos

**Novos arquivos:**
- `src/pages/CompanyProjectDetail.tsx` -- Pagina completa do projeto dentro do contexto da empresa, com tabs: Visao Geral, Pipeline Operacional, Data Room
- `src/components/company/ProjectOverviewTab.tsx` -- Dados cadastrais e qualificacao do projeto (reutiliza logica do ProjectDetailSheet em modo somente leitura)
- `src/components/company/ProjectPipelineTab.tsx` -- Timeline das 7 fases com outputs produzidos
- `src/components/company/ProjectDataRoomTab.tsx` -- Documentos operacionais (attachments sem fase CRM + phase_outputs)

**Arquivos modificados:**
- `src/App.tsx` -- Adicionar rota `/empresas/:leadId/projetos/:projectId`
- `src/components/company/CompanyProjects.tsx` -- Alterar `onProjectClick` para navegar via `useNavigate` em vez de abrir Sheet
- `src/pages/CompanyDetail.tsx` -- Remover logica do `ProjectDetailSheet` (nao mais necessario)
- `src/components/company/CompanyDataRoom.tsx` -- Filtrar apenas documentos com `phase` em valores CRM (prospeccao, qualificacao, diagnostico, proposta, fechamento)
- `src/hooks/useProjectAttachments.ts` -- Adicionar hook `useOperationAttachments(projectId)` que retorna apenas attachments com `phase IS NULL` e `useCompanyAttachments` filtrando apenas fases CRM

**Hooks reutilizados:**
- `useProjectPhases(projectId)` -- Status das 7 fases operacionais
- `usePhaseOutputs(projectId, phaseNumber)` -- Conteudo produzido em cada fase
- `useProjectAttachments(projectId)` -- Anexos do projeto (filtrados por contexto)

**Fluxo de navegacao:**
- Empresa > Tab Projetos > Clique no projeto > Navega para `/empresas/:leadId/projetos/:projectId`
- Botao "Voltar" retorna para a pagina da empresa
- Data Room da Empresa: mostra apenas docs do funil CRM
- Data Room do Projeto: mostra apenas docs operacionais + outputs das fases
