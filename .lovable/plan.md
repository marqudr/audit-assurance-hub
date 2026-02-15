

# Modulo CRM — Sales & Origination (pt-BR)

## Resumo

Substituir a pagina CRM atual (Kanban com dados mock) por um modulo completo com persistencia no banco, enriquecimento de CNPJ via API externa e simulador de potencial fiscal. Toda a interface, labels, placeholders, mensagens e status serao em portugues do Brasil.

---

## Etapa 1 — Dashboard e Tabela de Leads

**Banco de dados (migration):**
- Criar enum `lead_status` com valores: `novo`, `qualificado`, `proposta`, `ganho`
- Criar tabela `leads` com colunas: `id`, `user_id`, `company_name`, `cnpj`, `cnae`, `sector`, `revenue_range`, `status` (default `novo`), `engineering_headcount`, `rd_annual_budget`, `estimated_benefit_min`, `estimated_benefit_max`, `created_at`, `updated_at`
- RLS: usuario ve apenas seus leads; admins veem todos
- Inserir 7 leads mock via codigo como dados iniciais

**UI (pagina CRM.tsx reescrita):**
- 3 cards de metricas:
  - "Leads Ativos": 12 (Tendencia +5%)
  - "Receita Potencial": R$ 45,2M
  - "Ticket Medio": R$ 3,8M
- Tabela de alta densidade com colunas:
  - "Empresa", "CNPJ", "CNAE", "Status", "Ultima Atualizacao"
- Status com badges coloridos:
  - Novo (azul), Qualificado (amarelo), Proposta (roxo), Ganho (verde)
- Hover na linha exibe botao ghost "Ver Detalhes"

**Hook (useLeads.ts):**
- react-query para listar, criar e atualizar leads

---

## Etapa 2 — Modal de Novo Lead com Enriquecimento

- Botao primario "+ Novo Lead" acima da tabela
- Modal com titulo "Cadastrar Novo Lead"
  - Campo "CNPJ" com mascara `00.000.000/0001-00`
  - Ao preencher, exibir spinner "Enriquecendo dados da Receita Federal..."
  - Chamada GET a `https://minhareceita.org/{cnpj_digits}`
  - Auto-preenchimento: "Razao Social", "CNAE", "Setor"
- Botao "Criar Lead" salva no banco com status `novo`
- Todos os labels, placeholders e mensagens de erro em pt-BR

---

## Etapa 3 — Drawer de Detalhes e Simulador Fiscal

- Clicar numa linha abre Sheet lateral com titulo "Detalhes do Lead"
- Informacoes exibidas: Empresa, CNPJ, CNAE, Setor, Faixa de Receita, Status
- Secao "Simulador de Potencial Fiscal":
  - Campos: "Qtd. de Engenheiros" (numero), "Orcamento Anual de P&D" (moeda)
  - Botao "Rodar Simulacao IA" (ghost azul, icone Sparkles)
- Resultado em Card:
  - Titulo: "Beneficio Fiscal Estimado"
  - Valor em verde/bold (ex: "R$ 1,2M - R$ 1,5M")
  - Observacao: "Baseado na Lei 11.196 (Lei do Bem)"
  - Calculo: `min = orcamento * 0.205`, `max = orcamento * 0.34`
- Botao "Gerar Proposta" exibe toast "Proposta gerada com sucesso!" e muda status para `proposta`

---

## Detalhes Tecnicos

```text
src/
  components/
    crm/
      NewLeadModal.tsx       -- modal com formulario e enriquecimento
      LeadDetailSheet.tsx    -- drawer lateral com detalhes
      TaxSimulator.tsx       -- simulador fiscal
  hooks/
    useLeads.ts              -- react-query: listar, criar, atualizar
  pages/
    CRM.tsx                  -- reescrita: metricas + tabela
```

**Idioma:** Todos os textos da interface (titulos de pagina, headers de tabela, labels de formulario, placeholders, tooltips, toasts, botoes, badges de status, mensagens de erro e disclaimers) serao em portugues do Brasil.

**Mascara de CNPJ:** Logica inline no onChange formatando para `00.000.000/0001-00`.

**Enriquecimento:** Fetch direto do client para `https://minhareceita.org/{cnpj}`. Mapeamento: `razao_social` para nome da empresa, `cnae_fiscal` para CNAE, `cnae_fiscal_descricao` para setor.

**Simulador:** Calculo local baseado em percentuais simplificados da Lei do Bem. Valores persistidos na tabela `leads`.

**RLS:** Politicas restritivas — cada usuario ve/edita apenas seus leads. Admins podem visualizar todos.

**Atualizacao do CommandPalette:** O item "CRM" sera renomeado para refletir o novo modulo.

