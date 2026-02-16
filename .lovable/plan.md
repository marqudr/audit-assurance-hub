

## Remover opcao de cadastro na tela de login

A tela de login sera simplificada para permitir apenas login e recuperacao de senha, sem a opcao de criar conta.

### Alteracoes

**Arquivo: `src/pages/Auth.tsx`**
- Remover o estado `isLogin` (sera sempre login)
- Remover o bloco de campos de cadastro (campo "Nome" e logica de signUp)
- Remover o link "Nao tem conta? Cadastre-se" / "Ja tem conta? Entre"
- Manter apenas o link "Voltar ao login" quando estiver no modo de recuperacao de senha
- Remover import do icone `UserPlus` que nao sera mais usado

O fluxo de onboarding continua sendo exclusivamente via convite por e-mail, conforme ja implementado na edge function `invite-user`.

