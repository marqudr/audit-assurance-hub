

## Modulo Empresa -- Pagina Dedicada com Historico Completo

Criar uma pagina dedicada `/empresas/:leadId` que centraliza todas as informacoes de uma empresa, seus projetos vinculados com historico de interacoes e o data room de documentos.

---

### 1. Nova Rota e Pagina `/empresas/:leadId`

Criar a pagina `CompanyDetail` que sera a visao completa da empresa, acessivel a partir do CRM (ao clicar no nome da empresa) e tambem via sidebar.

**Estrutura da pagina em tabs:**

- **Visao Geral** -- Dados cadastrais da empresa (nome, CNPJ, CNAE, setor, faturamento, regime tributario, endereco completo, elegibilidade ICP, contatos)
- **Projetos** -- Lista de todos os projetos vinculados com status, valor, datas, Frascati score, possibilidade de abrir o detalhe completo de cada projeto
- **Historico** -- Timeline consolidada de todas as interacoes (ultimo contato, tipo de atividade, proximos passos) de todos os projetos
- **Data Room** -- Rollup de todos os documentos anexados em todos os projetos, organizados por projeto e fase

---

### 2. Adicionar Rota "Empresas" na Sidebar

Adicionar item "Empresas" no menu de navegacao lateral com icone `Building2`, apontando para `/empresas`. Criar tambem uma pagina de listagem `/empresas` com tabela de todas as empresas.

---

### 3. Pagina de Listagem de Empresas `/empresas`

Tabela com colunas: Nome da Empresa, CNPJ, Setor, Regime Tributario, ICP Score, Qtd Projetos, Valor Total. Clicar em uma linha navega para `/empresas/:leadId`.

---

### 4. Detalhes Tecnicos

**Novos arquivos:**
- `src/pages/Companies.tsx` -- Listagem de empresas
- `src/pages/CompanyDetail.tsx` -- Pagina completa da empresa com tabs
- `src/components/company/CompanyOverview.tsx` -- Tab Visao Geral (reutiliza logica do LeadDetailSheet)
- `src/components/company/CompanyProjects.tsx` -- Tab Projetos (lista com cards expandiveis)
- `src/components/company/CompanyTimeline.tsx` -- Tab Historico (timeline consolidada)
- `src/components/company/CompanyDataRoom.tsx` -- Tab Data Room (rollup de anexos usando `useCompanyAttachments`)

**Arquivos modificados:**
- `src/App.tsx` -- Adicionar rotas `/empresas` e `/empresas/:leadId`
- `src/components/layout/AppSidebar.tsx` -- Adicionar item "Empresas" com icone `Building2`
- `src/pages/CRM.tsx` -- Alterar clique no nome da empresa para navegar para `/empresas/:leadId`

**Hooks reutilizados (ja existentes):**
- `useLeads()` -- Lista todas as empresas
- `useLeadContacts(leadId)` -- Contatos da empresa
- `useProjects(leadId)` -- Projetos vinculados a empresa
- `useCompanyAttachments(leadId)` -- Rollup de anexos de todos os projetos
- `useUpdateLead()` -- Editar dados da empresa

**Fluxo de navegacao:**
- Sidebar: Empresas -> Lista de empresas -> Detalhe da empresa
- CRM: Clicar no nome da empresa em um projeto -> Detalhe da empresa
- Detalhe da empresa: Clicar em um projeto -> Abre ProjectDetailSheet

