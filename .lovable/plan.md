

## Personalizar templates de e-mail da plataforma InnovaSys

Todos os modelos de e-mail do sistema de autenticacao serao personalizados em Portugues formal com a marca InnovaSys.

### Templates a configurar

1. **Convite** - E-mail enviado quando um admin convida um novo usuario
2. **Recuperacao de senha** - E-mail enviado ao solicitar redefinicao de senha
3. **Confirmacao de e-mail** - E-mail enviado para confirmar o endereco
4. **Magic Link** - E-mail enviado para login sem senha

### Conteudo dos e-mails

Todos seguirao um padrao visual consistente com:
- Saudacao formal ("Prezado(a)")
- Nome da plataforma "InnovaSys" em destaque
- Botao de acao claro
- Assinatura padrao "Equipe InnovaSys"

### Detalhes tecnicos

**Arquivo: `supabase/config.toml`**

Sera adicionada a configuracao de templates de e-mail nas secoes:

- `[auth.email.invite]` - Template de convite com subject "Voce foi convidado(a) para a InnovaSys" e corpo HTML personalizado com link de acao `{{ .ConfirmationURL }}`
- `[auth.email.recovery]` - Template de recuperacao de senha com subject "Redefinicao de senha - InnovaSys" e link `{{ .ConfirmationURL }}`
- `[auth.email.confirmation]` - Template de confirmacao com subject "Confirme seu e-mail - InnovaSys" e link `{{ .ConfirmationURL }}`
- `[auth.email.magic_link]` - Template de magic link com subject "Seu link de acesso - InnovaSys" e link `{{ .ConfirmationURL }}`

Cada template usara HTML inline com estilo limpo (fundo claro, card centralizado, botao de acao em destaque) e tom formal em pt-BR.

