
## Remover Metodo de Qualificacao e BANT

Remover completamente os campos "Metodo de Qualificacao" e "BANT" (has_budget, has_authority, has_need, has_timeline) de todas as telas do CRM.

### Alteracoes

**1. LeadDetailSheet.tsx**
- Remover `qualification_method`, `has_budget`, `has_authority`, `has_need`, `has_timeline` do editData inicial e do handleSaveEdit
- Remover a variavel `bantScore`
- Modo visualizacao: remover as linhas de "Metodo", "BANT X/4" e os indicadores Budget/Authority/Need/Timeline
- Modo edicao: remover o Select de "Metodo de Qualificacao" e os checkboxes BANT

**2. ProjectDetailSheet.tsx**
- Mesmas remocoes: editData, handleSaveEdit, bantScore, modo visualizacao e modo edicao

**3. KanbanCard.tsx**
- Remover o calculo de `bantScore` e o Badge "BANT X/4" dos cards do Kanban

**4. useLeads.ts**
- Remover `qualification_method`, `has_budget`, `has_authority`, `has_need`, `has_timeline` da interface Lead (os campos continuam no banco mas nao serao mais usados)

**5. useProjects.ts**
- Remover esses mesmos campos da interface Project (se existirem)

### Notas
- Os campos permanecem no banco de dados (nao ha necessidade de migracao destrutiva)
- Os campos de Dor, Contexto e Objecao serao mantidos na secao de Qualificacao
- O badge BANT sera removido dos cards do Kanban, simplificando a visualizacao
