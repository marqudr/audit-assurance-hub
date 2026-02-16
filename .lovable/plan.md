

## Modulo de Gestao de Usuarios e Seguranca

Este plano cobre: convite de usuarios internos (staff), cadastro de usuarios de clientes vinculados a empresas, audit trail completo, RBAC refinado com RLS e funcionalidades LGPD (exportacao de dados e exclusao de conta com soft delete).

---

### 1. Alteracoes no Banco de Dados

**1.1 Expandir tabela `profiles`**

Adicionar colunas para suportar tipos de usuario, hierarquia e LGPD:

| Coluna | Tipo | Descricao |
|---|---|---|
| user_type | text NOT NULL DEFAULT 'staff' | 'staff' ou 'client' |
| company_id | uuid (nullable, FK leads) | Empresa vinculada (para usuarios client) |
| manager_id | uuid (nullable) | ID do gestor (para hierarquia staff) |
| is_deleted | boolean DEFAULT false | Soft delete para LGPD |
| deleted_at | timestamptz (nullable) | Data da exclusao |

**1.2 Expandir enum `app_role`**

Adicionar o role `gestor` ao enum existente:
```sql
ALTER TYPE app_role ADD VALUE 'gestor';
```

A hierarquia final fica: admin > gestor > closer/consultor/cfo > user

**1.3 Nova tabela `audit_logs`**

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid PK | |
| table_name | text | Nome da tabela afetada |
| record_id | text | ID do registro afetado |
| operation | text | INSERT, UPDATE ou DELETE |
| old_data | jsonb (nullable) | Dados antes da operacao |
| new_data | jsonb (nullable) | Dados apos a operacao |
| user_id | uuid (nullable) | Quem executou |
| ip_address | text (nullable) | IP (quando disponivel) |
| created_at | timestamptz | Timestamp |

RLS: somente admins podem ler audit_logs. Ninguem pode inserir/deletar via client (somente via trigger SECURITY DEFINER).

**1.4 Trigger global de auditoria**

Uma funcao `audit_trigger_func()` SECURITY DEFINER que:
- Captura OLD e NEW como JSONB
- Registra a operacao (TG_OP) e tabela (TG_TABLE_NAME)
- Usa `auth.uid()` para identificar o usuario

Aplicado nas tabelas principais: leads, projects, project_phases, phase_outputs, project_attachments, profiles, user_roles.

**1.5 Atualizar RLS em todas as tabelas**

Nova logica de politicas:

- **Admin**: ve e edita TUDO
- **Gestor**: ve dados dos seus subordinados (via `manager_id` em profiles) + seus proprios
- **Consultor/Closer/CFO**: ve apenas seus proprios dados
- **Client**: ve apenas dados onde `company_id` (via join em profiles) bate com o lead_id/company vinculado

Para implementar sem recursao, criar funcoes SECURITY DEFINER:
- `get_user_type(uuid)` -- retorna 'staff' ou 'client'
- `get_user_company_id(uuid)` -- retorna o company_id do usuario
- `get_managed_user_ids(uuid)` -- retorna array de user_ids subordinados ao gestor

---

### 2. Edge Function: `invite-user`

Nova edge function que usa o service role key para:

**Endpoint POST `/invite-user`**:
```json
{
  "email": "usuario@empresa.com",
  "role": "consultor",
  "user_type": "staff",
  "company_id": null,
  "manager_id": "uuid-do-gestor"
}
```

Logica:
1. Verifica se o chamador e admin (via JWT)
2. Chama `supabase.auth.admin.inviteUserByEmail(email)` com service role
3. Apos criacao, insere role em `user_roles` e atualiza `profiles` com user_type, company_id e manager_id
4. Para usuarios client: o `company_id` e obrigatorio e vincula automaticamente

**Endpoint POST `/invite-client-user`** (ou mesmo endpoint com user_type=client):
- Verifica se o chamador e gestor da empresa OU admin
- Forca company_id = empresa do gestor
- Atribui role 'user' por padrao

---

### 3. Edge Function: `export-my-data`

Endpoint GET que:
1. Autentica via JWT
2. Busca todos os dados do usuario: profile, roles, leads, projects, conversations, messages, attachments, audit_logs (onde user_id = auth.uid())
3. Retorna JSON completo (LGPD "direito de acesso")

---

### 4. Novas Paginas e Componentes

**4.1 Pagina Admin: Gestao de Usuarios (`/admin/users`)**

Rota protegida por AdminRoute. Contem:

- **Tabela de usuarios**: lista todos os profiles com display_name, email (via auth), roles, user_type, company_id, status (ativo/excluido)
- **Botao "Convidar Usuario"**: abre modal com formulario (email, role, user_type, empresa, gestor)
- **Edicao de role**: dropdown para alterar role de um usuario
- **Filtros**: por tipo (staff/client), role, empresa, status

Componentes:
```text
src/pages/AdminUsers.tsx              -- Pagina principal
src/components/admin/UserTable.tsx     -- Tabela de usuarios
src/components/admin/InviteUserModal.tsx -- Modal de convite
src/components/admin/UserRoleSelect.tsx -- Select de role
```

**4.2 Pagina Admin: Historico de Auditoria (`/admin/audit`)**

- Tabela paginada com colunas: Data, Usuario, Tabela, Operacao, Detalhes
- Filtros: por usuario, tabela, operacao, periodo
- Expansao inline para ver old_data/new_data como JSON formatado

Componentes:
```text
src/pages/AdminAudit.tsx               -- Pagina de auditoria
src/components/admin/AuditLogTable.tsx  -- Tabela com filtros
```

**4.3 Atualizar Settings (`/settings`)**

Adicionar secoes:
- **Perfil**: conectar ao profiles real (display_name, avatar_url editaveis)
- **LGPD**: botao "Solicitar Meus Dados" que chama `export-my-data` e faz download do JSON
- **Exclusao de Conta**: botao com confirmacao que faz soft delete (is_deleted=true, anonimiza display_name e atualiza email em profiles)

**4.4 Sidebar: adicionar itens admin**

Adicionar ao adminNavItems:
- "Usuarios" -> `/admin/users` (icone ShieldCheck)
- "Auditoria" -> `/admin/audit` (icone ScrollText)

---

### 5. Hooks Novos

```text
src/hooks/useUsers.ts          -- Lista usuarios (profiles + roles), convite
src/hooks/useAuditLogs.ts      -- Lista audit_logs com filtros e paginacao
src/hooks/useProfile.ts        -- CRUD do profile do usuario logado
```

---

### 6. Rotas Novas no App.tsx

```text
/admin/users    -> AdminRoute > AdminUsers
/admin/audit    -> AdminRoute > AdminAudit
```

---

### 7. Fluxo de Soft Delete (LGPD)

1. Usuario clica "Excluir Minha Conta" em Settings
2. Dialog de confirmacao com input de senha
3. Chamada a edge function `delete-my-account` que:
   - Marca `profiles.is_deleted = true`, `profiles.deleted_at = now()`
   - Anonimiza: `display_name = 'Usuario Removido'`, limpa `avatar_url`
   - NAO exclui o registro (mantem ID para integridade do audit trail)
   - Opcionalmente desabilita o auth user

---

### 8. Sequencia de Implementacao

1. Migracao de banco: expandir profiles, criar audit_logs, trigger de auditoria, funcoes RLS auxiliares, atualizar politicas
2. Edge functions: invite-user, export-my-data, delete-my-account
3. Hooks: useUsers, useAuditLogs, useProfile
4. Pagina AdminUsers com tabela e modal de convite
5. Pagina AdminAudit com filtros
6. Atualizar Settings com perfil real, LGPD e exclusao
7. Atualizar sidebar e rotas
8. Revisar RLS de todas as tabelas existentes para a nova hierarquia

---

### 9. Notas Tecnicas

- `inviteUserByEmail` precisa do service role key, por isso e feita via edge function (nunca no client)
- O trigger de auditoria usa `auth.uid()` que funciona dentro de operacoes autenticadas via RLS
- As funcoes auxiliares de RLS (get_user_type, get_managed_user_ids) sao SECURITY DEFINER para evitar recursao
- O soft delete preserva o ID do usuario para manter a integridade referencial do audit trail
- A exportacao LGPD retorna TODOS os dados do usuario em formato JSON, incluindo logs de auditoria onde ele e o ator

