

# Reorganizar Seções do Detalhe do Lead

## Objetivo
Alterar a ordem das seções no drawer de detalhes do lead para um fluxo mais lógico.

## Nova Ordem das Seções

```text
1. Informacoes Principais (Empresa, CNPJ, Endereco) -- mantém
2. Simulador de Potencial Fiscal -- sobe para logo abaixo do Endereco
3. Contatos -- desce para abaixo do Simulador
4. Secoes de Enriquecimento (Atribuicao, Qualificacao, Projecao de Receita)
5. Phase Checklist
6. Velocidade e Saude -- vai para o final
```

## Detalhes Tecnicos

**Arquivo:** `src/components/crm/LeadDetailSheet.tsx`

Alteracoes no bloco de retorno (render), linhas ~537-584:

- Mover o `<TaxSimulator>` para imediatamente apos o bloco de informacoes principais / endereco (antes dos Contatos)
- Mover a secao de Contatos para apos o TaxSimulator
- Separar "Velocidade e Saude" das secoes de Accordion (`readOnlySections` e `editSections`) e renderiza-la como ultimo item da pagina
- Manter o `PhaseChecklist` antes de Velocidade e Saude

Isso requer tambem reorganizar os Accordions em `readOnlySections` e `editSections`, removendo o AccordionItem de "velocity" de dentro deles e renderizando-o separadamente no final do drawer.

