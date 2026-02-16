

## Implementar Perfil do Usuario e Corrigir Informacoes Dinamicas

O usuario `dnmarques@gmail.com` ja esta configurado como **admin** e **staff** no banco de dados. O foco principal sera implementar as informacoes reais do perfil em toda a interface, substituindo dados hardcoded.

---

### 1. Corrigir tipo AppRole

O tipo `AppRole` em `useUserRole.ts` nao inclui `gestor`. Adicionar para consistencia com o enum do banco.

---

### 2. Header Dinamico com Dados Reais do Perfil

Atualmente o `AppHeader` mostra dados hardcoded ("Ricardo Costa", "Consultor Senior", "RC"). Alterar para:

- Usar o hook `useProfile` para buscar `display_name` e `avatar_url`
- Usar o hook `useUserRoles` para mostrar o role atual
- Gerar iniciais dinamicamente a partir do `display_name`
- Conectar os links "Profile", "Settings" e "Sign out" a acoes reais (navegar para `/settings`, chamar `signOut`)

---

### 3. Enriquecer a Pagina de Settings

Adicionar ao card de Perfil:

- Exibir o **email** do usuario (ja existe)
- Exibir o **role** atual (badge, somente leitura)
- Exibir o **tipo de usuario** (Staff/Cliente, somente leitura)
- Campo editavel para **avatar_url**
- Mostrar data de criacao da conta

---

### 4. Detalhes Tecnicos

**Arquivos a modificar:**

- `src/hooks/useUserRole.ts` -- adicionar `"gestor"` ao tipo `AppRole`
- `src/components/layout/AppHeader.tsx` -- importar `useProfile`, `useUserRoles`, `useAuth`; substituir dados hardcoded por dados reais; conectar "Sign out" ao `signOut()`; navegar para `/settings` ao clicar em "Settings"/"Profile"
- `src/pages/Settings.tsx` -- adicionar badges de role e user_type; campo de avatar_url; exibir data de criacao

**Hooks utilizados (ja existentes):**
- `useProfile()` -- retorna `profile.display_name`, `profile.avatar_url`, `profile.user_type`, `profile.created_at`
- `useUserRoles()` -- retorna array de roles do usuario
- `useAuth()` -- retorna `user.email` e `signOut()`

