

## Redesenhar Visual do "O que eu faco agora?"

Transformar o componente `CrmActionAlerts` de uma lista plana com texto pequeno em cards agrupadores visuais com contadores proeminentes, melhorando a legibilidade e o apelo visual.

### Design Visual

Cada categoria de alerta sera um card individual com:
- Icone grande e colorido no topo
- Contador numerico grande e destacado (text-2xl font-bold)
- Titulo da categoria abaixo do numero
- Lista de projetos clicaveis dentro de um Collapsible ou scroll area
- Cor de fundo sutil por categoria para diferenciar visualmente

```text
┌─────────────────────────────────────────────────────────────┐
│  O que eu faco agora?                                       │
├─────────────┬─────────────────┬─────────────────────────────┤
│  [PhoneOff] │    [Clock]      │    [AlertTriangle]          │
│     3       │      2          │        5                    │
│ Sem Contato │   Atrasados     │     Parados                 │
│             │                 │  7d+: 2  5d: 1  3d: 2       │
│ > Projeto A │ > Projeto C     │ > Projeto E (8d)            │
│ > Projeto B │ > Projeto D     │ > Projeto F (6d)            │
│ > Projeto C │                 │ > Projeto G (4d)            │
└─────────────┴─────────────────┴─────────────────────────────┘
```

### Mudancas

#### `src/components/crm/CrmActionAlerts.tsx`

Reescrever o componente `AlertCard` interno e o layout da grid:

1. **Cards agrupadores com cor semantica**:
   - "Sem Contato": fundo `bg-red-50 dark:bg-red-950/30`, borda `border-red-200 dark:border-red-800`, icone vermelho
   - "Atrasados": fundo `bg-amber-50 dark:bg-amber-950/30`, borda `border-amber-200 dark:border-amber-800`, icone ambar
   - "Parados": fundo `bg-orange-50 dark:bg-orange-950/30`, borda `border-orange-200 dark:border-orange-800`, icone laranja

2. **Contador proeminente**: Numero grande centralizado (`text-2xl font-bold`) com a cor semantica da categoria

3. **Badges de sub-categoria para "Parados"**: Manter os badges 7d+, 5d, 3d com cores graduais dentro do card

4. **Lista de projetos**: Itens clicaveis com hover mais visivel (`hover:bg-muted rounded px-2 py-1`) em vez de apenas `hover:underline`

5. **Estado vazio**: Quando uma categoria tem 0 itens, mostrar o card com opacidade reduzida e um check verde indicando que esta tudo ok

6. **Card container**: Manter o Card externo com titulo "O que eu faco agora?" mas remover o fundo vermelho/verde do container -- cada sub-card tera sua propria cor

### Resumo de Arquivos

| Acao | Arquivo |
|------|---------|
| Modificar | `src/components/crm/CrmActionAlerts.tsx` |

