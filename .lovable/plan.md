

## Esqueci Minha Senha + Primeiro Login via Convite

### Problema Atual
- Nao existe opcao "Esqueci minha senha" na tela de login
- Usuarios convidados (staff ou client) recebem email de convite mas nao ha tela para definir senha no primeiro acesso

### Como Funciona o Fluxo de Convite
Quando `inviteUserByEmail` e usado, o email contem um link magic que, ao ser clicado, autentica o usuario com um evento `PASSWORD_RECOVERY`. O mesmo fluxo serve para redefinicao de senha. Portanto, uma unica pagina `/reset-password` resolve ambos os cenarios.

### Mudancas

#### 1. Pagina `/reset-password` (novo arquivo)
- `src/pages/ResetPassword.tsx`
- Detecta o evento `PASSWORD_RECOVERY` via `onAuthStateChange`
- Exibe formulario com campos "Nova senha" e "Confirmar senha"
- Chama `supabase.auth.updateUser({ password })` para salvar
- Apos sucesso, redireciona para `/` (staff) ou `/portal` (client) conforme `user_type`
- Funciona tanto para "esqueci minha senha" quanto para primeiro login via convite

#### 2. Atualizar tela de Login (`Auth.tsx`)
- Adicionar link "Esqueci minha senha?" abaixo do campo de senha
- Ao clicar, exibir campo de email e botao para enviar link de recuperacao
- Chamar `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Exibir mensagem de confirmacao apos envio

#### 3. Registrar rota no `App.tsx`
- Adicionar `<Route path="/reset-password" element={<ResetPassword />} />` como rota publica (fora de ProtectedRoute)

### Detalhes Tecnicos

**`src/pages/ResetPassword.tsx`:**
- Usa `supabase.auth.onAuthStateChange` para detectar `PASSWORD_RECOVERY`
- Valida que senha tem minimo 6 caracteres e que ambos campos coincidem
- Apos `updateUser`, consulta `profiles.user_type` para redirecionar corretamente
- Se nao houver evento de recovery (acesso direto), mostra mensagem informativa

**`src/pages/Auth.tsx`:**
- Novo state `isForgotPassword` para alternar entre login e recuperacao
- No modo "esqueci senha", exibe apenas campo email e botao "Enviar link"
- `redirectTo` aponta para `window.location.origin + '/reset-password'`

**`src/App.tsx`:**
- Nova rota publica `/reset-password` no mesmo nivel de `/auth`

### Arquivos

**Novos (1):**
- `src/pages/ResetPassword.tsx`

**Modificados (2):**
- `src/pages/Auth.tsx` -- adicionar "Esqueci minha senha"
- `src/App.tsx` -- registrar rota `/reset-password`
