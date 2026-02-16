

## Editar Usuarios da Empresa + Permissoes no Portal do Cliente

### Resumo

Adicionar funcionalidade de edicao de nome e toggle ativo/inativo nos usuarios da empresa (painel admin). No portal do cliente, restringir gestao de usuarios (convidar, ativar/desativar) apenas ao perfil Admin (CFO), enquanto usuarios comuns podem apenas editar seu proprio perfil.

### Mudancas

#### 1. CompanyUsers.tsx -- Adicionar edicao de nome e toggle ativo/inativo

- Adicionar um dialog de edicao de usuario com campos: Nome e Status (Ativo/Inativo)
- Ao clicar em um usuario na lista, abrir o dialog de edicao
- Substituir o botao de desativar (icone UserX) por um botao de editar (icone Pencil)
- No dialog, salvar nome via `supabase.from("profiles").update({ display_name })` e status via edge function `admin-toggle-user`
- Incluir tambem usuarios inativos na listagem (remover filtro `is_deleted = false` do hook ou criar variante)

#### 2. useCompanyUsers.ts -- Incluir usuarios inativos

- Adicionar parametro opcional `includeInactive` ao hook
- Quando `includeInactive = true`, nao filtrar por `is_deleted = false`
- CompanyUsers (admin) passa `includeInactive = true`; PortalSettings (client) mantem o filtro atual

#### 3. admin-toggle-user Edge Function -- Permitir CFO de client

- Alem de verificar role `admin`, tambem permitir que usuarios com role `cfo` e `user_type = 'client'` facam toggle em usuarios da mesma `company_id`
- Validar que o usuario alvo pertence a mesma empresa do caller

#### 4. PortalSettings.tsx -- Ajustes de permissao

- Secao "Meu Perfil" (nome e avatar): visivel para **todos** os usuarios (sem mudanca)
- Secao "Usuarios da Empresa": visivel apenas para CFO (ja implementado)
- Adicionar botao de editar em cada usuario da lista (apenas CFO), permitindo alterar nome e status ativo/inativo
- Reutilizar o mesmo padrao de dialog de edicao do CompanyUsers

### Detalhes Tecnicos

**`src/hooks/useCompanyUsers.ts`:**
- Novo parametro `includeInactive?: boolean` (default `false`)
- Quando `true`, remove `.eq("is_deleted", false)` da query
- Adicionar `is_deleted` como campo retornado (ja existe no tipo)

**`src/components/company/CompanyUsers.tsx`:**
- Novo state: `editUser` (usuario selecionado), `editName`, `editActive`
- Dialog de edicao com Input para nome e Switch para ativo/inativo
- Salvar nome: `supabase.from("profiles").update({ display_name: editName }).eq("user_id", editUser.user_id)`
- Salvar status: `supabase.functions.invoke("admin-toggle-user", { body: { user_id, active } })`
- Chamar ambos em sequencia e invalidar query
- Usar `useCompanyUsers(companyId, true)` para incluir inativos
- Exibir badge "Inativo" em vermelho para usuarios com `is_deleted = true`

**`supabase/functions/admin-toggle-user/index.ts`:**
- Apos verificar se caller e admin, adicionar fallback:
  - Buscar profile do caller para checar `user_type` e `company_id`
  - Se `user_type = 'client'`, verificar se tem role `cfo`
  - Verificar se usuario alvo tem mesmo `company_id`
  - Se todas condicoes forem atendidas, permitir a operacao

**`src/pages/portal/PortalSettings.tsx`:**
- Adicionar state e dialog de edicao de usuario (mesmo padrao do CompanyUsers)
- Cada usuario na lista ganha botao de editar (icone Pencil) visivel apenas para CFO
- Dialog com campos Nome e Status (Switch ativo/inativo)
- Chamar `admin-toggle-user` para toggle e update direto no profiles para nome
- Usar `useCompanyUsers(companyId)` sem inativos para a lista padrao, mas CFO usa com inativos

**Resumo de arquivos:**

| Acao | Arquivo |
|------|---------|
| Modificar | `src/hooks/useCompanyUsers.ts` |
| Modificar | `src/components/company/CompanyUsers.tsx` |
| Modificar | `supabase/functions/admin-toggle-user/index.ts` |
| Modificar | `src/pages/portal/PortalSettings.tsx` |
