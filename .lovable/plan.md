

## Convite com Nome + Perfil no Portal + Gestao de Usuarios pelo Cliente Admin

### 1. Adicionar campo "Nome" ao convite de usuario

**Arquivos modificados:**
- `src/components/admin/InviteUserModal.tsx` -- Adicionar campo "Nome" ao formulario
- `src/components/company/CompanyUsers.tsx` -- Adicionar campo "Nome" ao dialog de convite de empresa
- `src/hooks/useUsers.ts` -- Incluir `display_name` no payload do `inviteUser`
- `supabase/functions/invite-user/index.ts` -- Receber `display_name` e salvar no profile apos criacao do usuario

O edge function recebera o campo `display_name` e atualizara o profile do usuario convidado com esse nome.

### 2. Badge de perfil no Portal do Cliente

**Arquivo modificado:**
- `src/pages/portal/PortalLayout.tsx` -- Adicionar badge de perfil no rodape da sidebar com avatar (iniciais) e nome do usuario. Ao clicar, navega para `/portal/configuracoes`.

O badge exibira:
- Avatar circular com iniciais do nome (ou imagem se `avatar_url` existir)
- Nome do usuario truncado
- Clicavel, levando a configuracoes

### 3. Pagina de Configuracoes do Portal (`/portal/configuracoes`)

**Novo arquivo:**
- `src/pages/portal/PortalSettings.tsx` -- Pagina de configuracoes dedicada ao portal do cliente

Conteudo:
- **Secao Perfil**: campos editaveis de Nome e Avatar URL, com botao Salvar (reutiliza `useProfile`)
- **Secao Gestao de Usuarios** (visivel apenas para role `cfo`): lista usuarios da empresa e permite convidar novos, reutilizando a logica de `CompanyUsers` mas adaptada ao contexto do portal

**Arquivos modificados:**
- `src/App.tsx` -- Adicionar rota `/portal/configuracoes` dentro do bloco `ClientRoute`
- `src/pages/portal/PortalLayout.tsx` -- Atualizar nav item "Configuracoes" para apontar para `/portal/configuracoes` em vez de `/settings`

### 4. Permissao de convite pelo Cliente Admin (CFO)

O edge function `invite-user` ja permite que gestores convidem usuarios client. Precisamos estender para que usuarios com role `cfo` que sao do tipo `client` tambem possam convidar usuarios para sua propria empresa.

**Arquivo modificado:**
- `supabase/functions/invite-user/index.ts` -- Adicionar verificacao: se o caller tem role `cfo` E `user_type = 'client'`, permitir convite de usuarios client vinculados ao `company_id` do caller (nao permite escolher outra empresa)

### Detalhes Tecnicos

**Edge function `invite-user` -- mudancas:**
```
Recebe novo campo: display_name (string, opcional)
Apos criar/encontrar usuario:
  - Atualiza profiles.display_name com o valor recebido

Nova permissao:
  - Se caller tem role 'cfo' e user_type 'client':
    - Pode convidar apenas user_type 'client'
    - company_id e forcado para o company_id do caller (ignora valor enviado)
    - Roles permitidas: 'cfo' ou 'user' apenas
```

**`PortalSettings.tsx` -- estrutura:**
- Card Perfil: Nome (Input), Avatar URL (Input), botao Salvar
- Card Gestao de Usuarios (condicional `role === 'cfo'`):
  - Lista de usuarios da empresa via `useCompanyUsers(profile.company_id)`
  - Botao "Convidar Usuario" abre dialog com campos: Nome, Email, Perfil (Admin/Usuario)
  - Convite chama `invite-user` passando `company_id` do profile do caller

**Resumo de arquivos:**

| Acao | Arquivo |
|------|---------|
| Novo | `src/pages/portal/PortalSettings.tsx` |
| Modificar | `src/components/admin/InviteUserModal.tsx` |
| Modificar | `src/components/company/CompanyUsers.tsx` |
| Modificar | `src/hooks/useUsers.ts` |
| Modificar | `supabase/functions/invite-user/index.ts` |
| Modificar | `src/pages/portal/PortalLayout.tsx` |
| Modificar | `src/App.tsx` |

