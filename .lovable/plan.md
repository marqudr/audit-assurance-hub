

## Arvore Hierarquica + Multi-Roles + Visao por Papel no Dashboard

Este plano aborda 3 frentes: (1) visualizacao hierarquica na gestao de usuarios, (2) suporte a multiplas roles por usuario, (3) filtragem de dados do dashboard por papel.

---

### 1. Arvore Hierarquica na Gestao de Usuarios

**Arquivo: `src/pages/AdminUsers.tsx`**
- Adicionar toggle para alternar entre "Visualizacao em Tabela" e "Visualizacao em Arvore"
- Na visualizacao em arvore, agrupar usuarios por gestor usando o campo `manager_id` ja existente na tabela `profiles`

**Arquivo: `src/components/admin/UserTree.tsx` (novo)**
- Componente de arvore que:
  - Lista gestores como nos raiz (usuarios com role "gestor")
  - Subordinados aparecem indentados abaixo de cada gestor (filtrados por `manager_id`)
  - Usuarios sem gestor aparecem numa secao "Sem Gestor"
  - Usa `Collapsible` do Radix para expandir/colapsar cada gestor
  - Cada no mostra: avatar, nome, badges de roles, empresa, botao de editar

**Arquivo: `src/components/admin/EditUserModal.tsx`**
- Trocar o Select de role unico por checkboxes multiplos (gestor, closer, consultor, admin, cfo, user)
- Adicionar campo Select de "Gestor" que lista usuarios com role "gestor" para atribuir `manager_id`
- Ao salvar, sincronizar todas as roles: deletar todas roles existentes e inserir as selecionadas

**Arquivo: `src/components/admin/UserTable.tsx`**
- Coluna "Role" passa a mostrar multiplos badges em vez de um Select unico
- Coluna "Gestor" nova exibindo o nome do gestor vinculado (via `manager_id`)

**Arquivo: `src/components/admin/InviteUserModal.tsx`**
- Trocar Select de role unico por checkboxes multiplos
- Adicionar campo Select de "Gestor" para vincular ao `manager_id`

---

### 2. Suporte a Multi-Roles

**Arquivo: `src/hooks/useUsers.ts`**
- Mutation `updateUserRoles` (nova): recebe `userId` e array de `roles[]`, deleta todas as roles existentes e insere as novas em batch
- Remover ou depreciar `updateUserRole` (que so troca uma por outra)

**Arquivo: `supabase/functions/admin-list-users/index.ts`**
- Ja retorna `user_roles` como array -- nenhuma mudanca necessaria no backend
- Adicionar `manager_name` ao resultado: cruzar `manager_id` com o map de profiles para retornar o nome do gestor

**Arquivo: `supabase/functions/invite-user/index.ts`**
- Alterar para aceitar `roles: string[]` (array) em vez de `role: string`
- Inserir multiplas roles em batch ao inves de uma so

---

### 3. Dashboard Filtrado por Papel

**Arquivo: `src/hooks/useDashboardMetrics.ts`**
- Importar `useUserRoles` e `useAuth` para obter roles e user_id do usuario logado
- Adicionar logica de filtragem apos carregar os dados:
  - **Admin**: ve tudo (sem filtro, comportamento atual)
  - **Gestor**: filtra `projects` e `leads` para `user_id = meu_id` OU `user_id IN subordinados` (chamar RPC `get_managed_user_ids` ou filtrar client-side pelo `manager_id`)
  - **Closer/Consultor**: filtra `projects` somente para `user_id = meu_id`
- As queries de Supabase ja aplicam RLS por papel, entao os dados retornados ja sao filtrados automaticamente -- o dashboard ja mostra apenas o que o usuario tem permissao de ver

**Arquivo: `src/pages/Dashboard.tsx`**
- Adicionar indicador visual do escopo de visao: "Visao: Empresa Toda", "Visao: Meu Time", "Visao: Meus Dados"
- Badge informativo no header baseado nas roles do usuario logado

---

### Resumo de Arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `src/components/admin/UserTree.tsx` |
| Modificar | `src/pages/AdminUsers.tsx` |
| Modificar | `src/components/admin/UserTable.tsx` |
| Modificar | `src/components/admin/EditUserModal.tsx` |
| Modificar | `src/components/admin/InviteUserModal.tsx` |
| Modificar | `src/hooks/useUsers.ts` |
| Modificar | `supabase/functions/admin-list-users/index.ts` |
| Modificar | `supabase/functions/invite-user/index.ts` |
| Modificar | `src/hooks/useDashboardMetrics.ts` |
| Modificar | `src/pages/Dashboard.tsx` |

### Detalhes Tecnicos

**Multi-roles - logica de save:**
```text
1. Deletar: DELETE FROM user_roles WHERE user_id = X
2. Inserir: INSERT INTO user_roles (user_id, role) VALUES (X, 'gestor'), (X, 'closer'), ...
```

**Arvore hierarquica - estrutura de dados:**
```text
Gestores (role = gestor)
  └── Subordinados (profiles.manager_id = gestor.user_id)
Sem Gestor
  └── Usuarios com manager_id = null
```

**Dashboard - escopo de visao:**
- RLS ja filtra os dados automaticamente na query do Supabase
- O badge de escopo e apenas informativo, baseado nas roles do usuario logado
- Nenhuma query adicional necessaria -- as policies existentes ja garantem a filtragem correta

