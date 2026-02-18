
## Exibir "LISTEC" como empresa para todos os usuarios staff

Usuarios com `user_type === "staff"` nao possuem `company_id` vinculado, pois pertencem a equipe interna. A solucao e exibir "LISTEC" como nome da empresa sempre que o usuario for do tipo staff, sem alterar o banco de dados.

### Alteracoes

**Arquivo: `src/components/admin/UserTable.tsx`**
- Na coluna "Empresa", substituir a logica de exibicao:
  - Se `user.user_type === "staff"`, exibir "LISTEC"
  - Caso contrario, manter `user.company_name || "—"`

**Arquivo: `src/components/admin/UserTree.tsx`**
- No componente `UserNode`, aplicar a mesma logica ao badge de empresa:
  - Se `user.user_type === "staff"`, exibir badge "LISTEC"
  - Se `user.user_type === "client"` e tiver `company_name`, exibir o nome da empresa
  - Caso contrario, nao exibir badge

### Detalhes tecnicos

A alteracao e puramente no frontend (display logic). Nenhuma mudanca no banco de dados ou edge functions e necessaria. A logica sera:

```tsx
// UserTable - coluna Empresa
{user.user_type === "staff" ? "LISTEC" : (user.company_name || "—")}

// UserTree - badge de empresa
{(user.user_type === "staff" || user.company_name) && (
  <Badge variant="outline">{user.user_type === "staff" ? "LISTEC" : user.company_name}</Badge>
)}
```
